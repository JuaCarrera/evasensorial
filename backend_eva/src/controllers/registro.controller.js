const crypto = require('crypto');
const pool = require('../../db');

/* ============= Helpers ============= */
const genToken = () => crypto.randomBytes(24).toString('base64url');
function minutesFromNow(min = 1440) {
  const d = new Date();
  d.setMinutes(d.getMinutes() + Number(min || 1440));
  return d.toISOString().replace('T',' ').replace('Z','');
}
async function resolveEstudianteIdByCodigo(client, codigo) {
  const r = await client.query('SELECT estudiante_id FROM estudiantes WHERE codigo_acceso = $1 LIMIT 1', [codigo]);
  return r.rows[0]?.estudiante_id || null;
}
async function upsertFamiliarByDoc(client, { documento_identificacion, nombre = '', email = '', parentesco = null }) {
  const r = await client.query(
    `INSERT INTO familiares (documento_identificacion, nombre, email, contraseña, parentesco)
     VALUES ($1, COALESCE($2,''), COALESCE($3,''), 'temporal', $4)
     ON CONFLICT (documento_identificacion)
     DO UPDATE SET
       nombre = COALESCE(NULLIF(EXCLUDED.nombre,''), familiares.nombre),
       email  = COALESCE(NULLIF(EXCLUDED.email,''),  familiares.email),
       parentesco = COALESCE(EXCLUDED.parentesco, familiares.parentesco)
     RETURNING familiar_id, nombre, email, parentesco, documento_identificacion`,
    [documento_identificacion, nombre, email, parentesco]
  );
  return r.rows[0];
}
async function upsertProfesorByDoc(client, { documento_identificacion, nombre = '', email = '', materia = null }) {
  const r = await client.query(
    `INSERT INTO profesores (documento_identificacion, nombre, email, contraseña, materia)
     VALUES ($1, COALESCE($2,''), COALESCE($3,''), 'temporal', $4)
     ON CONFLICT (documento_identificacion)
     DO UPDATE SET
       nombre = COALESCE(NULLIF(EXCLUDED.nombre,''), profesores.nombre),
       email  = COALESCE(NULLIF(EXCLUDED.email,''),  profesores.email),
       materia= COALESCE(EXCLUDED.materia, profesores.materia)
     RETURNING profesor_id, nombre, email, materia, documento_identificacion`,
    [documento_identificacion, nombre, email, materia]
  );
  return r.rows[0];
}
async function vincularFamiliar(client, estudiante_id, familiar_id) {
  await client.query(
    `INSERT INTO estudiante_familiar (estudiante_id, familiar_id)
     VALUES ($1,$2) ON CONFLICT DO NOTHING`,
    [estudiante_id, familiar_id]
  );
}
async function vincularProfesor(client, estudiante_id, profesor_id) {
  await client.query(
    `INSERT INTO estudiante_profesor (estudiante_id, profesor_id)
     VALUES ($1,$2) ON CONFLICT DO NOTHING`,
    [estudiante_id, profesor_id]
  );
}
async function getActiveTokenRow(client, token) {
  const r = await client.query(
    `SELECT * FROM api_tokens
     WHERE token = $1 AND activo = TRUE AND expira_en > now()`,
    [token]
  );
  return r.rows[0] || null;
}

/* ============= 1) Registrar participante + vincular + emitir token ============= */
/**
 * Body:
 * {
 *   "tipo_usuario": "familiar" | "profesor",
 *   "codigo_acceso": "ABCD1234",
 *   "documento_identificacion": "1090...",
 *   "nombre": "Opcional",
 *   "email": "Opcional",
 *   "parentesco": "Solo familiar",
 *   "materia": "Solo profesor",
 *   "expira_min": 1440
 * }
 */
exports.registrarYEmitirToken = async (req, res) => {
  const {
    tipo_usuario, codigo_acceso, documento_identificacion,
    nombre, email, parentesco, materia, expira_min = 1440
  } = req.body || {};

  if (!tipo_usuario || !codigo_acceso || !documento_identificacion) {
    return res.status(400).json({ message: 'tipo_usuario, codigo_acceso y documento_identificacion son obligatorios' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const estudiante_id = await resolveEstudianteIdByCodigo(client, codigo_acceso);
    if (!estudiante_id) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Estudiante no encontrado por codigo_acceso' });
    }

    let participante, familiar_id = null, profesor_id = null;
    if (tipo_usuario === 'familiar') {
      participante = await upsertFamiliarByDoc(client, { documento_identificacion, nombre, email, parentesco });
      familiar_id = participante.familiar_id;
      await vincularFamiliar(client, estudiante_id, familiar_id);
    } else if (tipo_usuario === 'profesor') {
      participante = await upsertProfesorByDoc(client, { documento_identificacion, nombre, email, materia });
      profesor_id = participante.profesor_id;
      await vincularProfesor(client, estudiante_id, profesor_id);
    } else {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'tipo_usuario inválido' });
    }

    // Emite token
    const token = genToken();
    const expira_en = minutesFromNow(expira_min);
    await client.query(
      `INSERT INTO api_tokens
        (token, tipo_usuario, familiar_id, profesor_id, estudiante_id, documento_identificacion, expira_en, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)`,
      [token, tipo_usuario, familiar_id, profesor_id, estudiante_id, documento_identificacion, expira_en, JSON.stringify({ motivo: 'registro+temp' })]
    );

    await client.query('COMMIT');
    return res.status(201).json({
      token, expira_en, estudiante_id,
      participante: { tipo: tipo_usuario, ...participante }
    });
  } catch (e) {
    await client.query('ROLLBACK');
    return res.status(500).json({ message: e.message });
  } finally {
    client.release();
  }
};

/* ============= 2) Estado por token (precarga del formulario) ============= */
exports.estadoPorToken = async (req, res) => {
  const { token } = req.params;
  const client = await pool.connect();
  try {
    const tk = await getActiveTokenRow(client, token);
    if (!tk) return res.status(404).json({ message: 'Token inválido o expirado' });

    // participante
    let participante = null;
    if (tk.tipo_usuario === 'familiar' && tk.familiar_id) {
      const r = await client.query(
        `SELECT familiar_id, nombre, email, parentesco, documento_identificacion
         FROM familiares WHERE familiar_id = $1`,
        [tk.familiar_id]
      );
      participante = { tipo: 'familiar', ...r.rows[0] };
    } else if (tk.tipo_usuario === 'profesor' && tk.profesor_id) {
      const r = await client.query(
        `SELECT profesor_id, nombre, email, materia, documento_identificacion
         FROM profesores WHERE profesor_id = $1`,
        [tk.profesor_id]
      );
      participante = { tipo: 'profesor', ...r.rows[0] };
    }

    const est = await client.query(
      `SELECT estudiante_id, nombre, apellidos, codigo_acceso
       FROM estudiantes WHERE estudiante_id = $1`,
      [tk.estudiante_id]
    );

    const tempRes = await client.query(
      `SELECT pregunta_id, respuesta, actualizado_en
       FROM respuestas_temp WHERE token = $1 ORDER BY actualizado_en DESC`,
      [token]
    );

    const tempInfo = await client.query(
      `SELECT data FROM participante_temp WHERE token = $1`,
      [token]
    );

    // faltantes
    const faltantes = [];
    if (participante) {
      if (!participante.nombre)  faltantes.push('nombre');
      if (!participante.email)   faltantes.push('email');
      if (participante.tipo === 'familiar' && !participante.parentesco) faltantes.push('parentesco');
      if (participante.tipo === 'profesor' && !participante.materia)   faltantes.push('materia');
    }

    return res.json({
      token: tk.token,
      tipo_usuario: tk.tipo_usuario,
      estudiante: est.rows[0] || null,
      participante,
      faltantes,
      participante_temp: tempInfo.rows[0]?.data || {},
      respuestas_temporales: tempRes.rows
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  } finally {
    client.release();
  }
};

/* ============= 3) Guardar info temporal del participante (merge JSON) ============= */
/**
 * Body: { data: { telefono: "...", direccion: "...", ... } }
 */
exports.guardarParticipanteTemporal = async (req, res) => {
  const { token } = req.params;
  const { data = {} } = req.body || {};
  const client = await pool.connect();
  try {
    const tk = await getActiveTokenRow(client, token);
    if (!tk) return res.status(404).json({ message: 'Token inválido o expirado' });

    await client.query(
      `INSERT INTO participante_temp (token, data)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (token)
       DO UPDATE SET data = participante_temp.data || EXCLUDED.data, actualizado_en = now()`,
      [token, JSON.stringify(data)]
    );

    const r = await client.query(`SELECT data FROM participante_temp WHERE token = $1`, [token]);
    return res.json({ message: 'Guardado', data: r.rows[0].data });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  } finally {
    client.release();
  }
};

/* ============= 4) Guardar respuestas temporales (UPsert; soporta una o varias) ============= */
/**
 * Body:
 *  - { pregunta_id, respuesta }
 *  o
 *  - { respuestas: [{pregunta_id, respuesta}, ...] }
 */
exports.guardarRespuestasTemporales = async (req, res) => {
  const { token } = req.params;
  const client = await pool.connect();
  try {
    const tk = await getActiveTokenRow(client, token);
    if (!tk) return res.status(404).json({ message: 'Token inválido o expirado' });

    const items = Array.isArray(req.body?.respuestas)
      ? req.body.respuestas
      : (req.body?.pregunta_id ? [{ pregunta_id: req.body.pregunta_id, respuesta: req.body.respuesta }] : []);

    if (!items.length) return res.status(400).json({ message: 'No hay respuestas para guardar' });

    for (const it of items) {
      if (!it?.pregunta_id || it.respuesta === undefined) continue;
      await client.query(
        `INSERT INTO respuestas_temp (token, estudiante_id, pregunta_id, respuesta)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (token, pregunta_id)
         DO UPDATE SET respuesta = EXCLUDED.respuesta, actualizado_en = now()`,
        [token, tk.estudiante_id, it.pregunta_id, String(it.respuesta)]
      );
    }

    return res.json({ message: 'Guardado' });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  } finally {
    client.release();
  }
};

/* ============= 5) Finalizar: persistir y cerrar token ============= */
/**
 * - Mueve respuestas_temp -> respuestas
 * - Actualiza datos faltantes del participante a partir de participante_temp
 * - Desactiva token y limpia temporales
 */
exports.finalizar = async (req, res) => {
  const { token } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const tk = await getActiveTokenRow(client, token);
    if (!tk) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Token inválido o expirado' });
    }

    // 1) Respuestas
    const tmp = await client.query(
      `SELECT pregunta_id, respuesta FROM respuestas_temp WHERE token = $1`,
      [token]
    );

    let usuario_id = null;
    if (tk.tipo_usuario === 'familiar') usuario_id = tk.familiar_id;
    if (tk.tipo_usuario === 'profesor') usuario_id = tk.profesor_id;

    for (const r of tmp.rows) {
      await client.query(
        `INSERT INTO respuestas (estudiante_id, pregunta_id, respondido_por, usuario_id, respuesta)
         VALUES ($1,$2,$3,$4,$5)`,
        [tk.estudiante_id, r.pregunta_id, tk.tipo_usuario, usuario_id, r.respuesta]
      );
    }

    // 2) Datos del participante desde participante_temp (merge a tabla real)
    const ptemp = await client.query(`SELECT data FROM participante_temp WHERE token = $1`, [token]);
    const data = ptemp.rows[0]?.data || {};
    if (Object.keys(data).length) {
      if (tk.tipo_usuario === 'familiar' && tk.familiar_id) {
        const sets = [];
        const vals = [];
        let i = 1;
        if (data.nombre !== undefined)     { sets.push(`nombre = $${i++}`); vals.push(data.nombre); }
        if (data.email !== undefined)      { sets.push(`email = $${i++}`);  vals.push(data.email); }
        if (data.parentesco !== undefined) { sets.push(`parentesco = $${i++}`); vals.push(data.parentesco); }
        if (sets.length) {
          vals.push(tk.familiar_id);
          await client.query(`UPDATE familiares SET ${sets.join(', ')} WHERE familiar_id = $${i}`, vals);
        }
      }
      if (tk.tipo_usuario === 'profesor' && tk.profesor_id) {
        const sets = [];
        const vals = [];
        let i = 1;
        if (data.nombre !== undefined) { sets.push(`nombre = $${i++}`); vals.push(data.nombre); }
        if (data.email !== undefined)  { sets.push(`email = $${i++}`);  vals.push(data.email); }
        if (data.materia !== undefined){ sets.push(`materia = $${i++}`); vals.push(data.materia); }
        if (sets.length) {
          vals.push(tk.profesor_id);
          await client.query(`UPDATE profesores SET ${sets.join(', ')} WHERE profesor_id = $${i}`, vals);
        }
      }
    }

    // 3) Cerrar token y limpiar temporales
    await client.query('DELETE FROM respuestas_temp WHERE token = $1', [token]);
    await client.query('DELETE FROM participante_temp WHERE token = $1', [token]);
    await client.query('UPDATE api_tokens SET activo = FALSE WHERE token = $1', [token]);

    await client.query('COMMIT');
    return res.json({ message: 'Finalizado', insertados: tmp.rowCount });
  } catch (e) {
    await client.query('ROLLBACK');
    return res.status(500).json({ message: e.message });
  } finally {
    client.release();
  }
};

// === helper: buscar token activo por documento + estudiante (via codigo_acceso) ===
async function findActiveTokenByDocAndCodigo(client, documento_identificacion, codigo_acceso) {
  const est = await client.query(
    'SELECT estudiante_id FROM estudiantes WHERE codigo_acceso = $1 LIMIT 1',
    [codigo_acceso]
  );
  const estudiante_id = est.rows[0]?.estudiante_id;
  if (!estudiante_id) return null;

  const tk = await client.query(
    `SELECT token, tipo_usuario, estudiante_id, expira_en
       FROM api_tokens
      WHERE documento_identificacion = $1
        AND estudiante_id = $2
        AND activo = TRUE
        AND expira_en > now()
      ORDER BY expira_en DESC
      LIMIT 1`,
    [documento_identificacion, estudiante_id]
  );
  return tk.rows[0] || null;
}



// === GET /registro/token (query: documento_identificacion) ===
exports.tokenPorCedula = async (req, res) => {
  const { documento_identificacion } = req.query || {};
  if (!documento_identificacion) {
    return res.status(400).json({ message: 'documento_identificacion es obligatorio' });
  }

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT token, tipo_usuario, estudiante_id, expira_en
         FROM api_tokens
        WHERE documento_identificacion = $1
          AND activo = TRUE
          AND expira_en > now()
        ORDER BY expira_en DESC
        LIMIT 1`,
      [documento_identificacion]
    );

    if (!rows[0]) {
      return res.status(404).json({ message: 'No hay token activo para esa cédula' });
    }

    return res.json(rows[0]); // { token, tipo_usuario, estudiante_id, expira_en }
  } catch (e) {
    return res.status(500).json({ message: e.message });
  } finally {
    client.release();
  }
};
