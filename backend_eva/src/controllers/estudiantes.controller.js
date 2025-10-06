// src/controllers/estudiantes.controller.js
const pool = require('../../db');
const { generateAccessCode } = require('../utils/generateCode');
const { sendStudentAccessCode } = require('../services/mailer');

// --- helpers ---
const quoteIdent = (id) =>
  /^[a-z_][a-z0-9_]*$/i.test(id) ? id : `"${id.replace(/"/g, '""')}"`;

async function upsertByEmail(client, table, idColumn, email, payload) {
  const cols = Object.keys(payload);
  const vals = Object.values(payload);

  if (cols.length === 0) {
    const sqlBare = `
      INSERT INTO ${quoteIdent(table)} (email)
      VALUES ($1)
      ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
      RETURNING ${quoteIdent(idColumn)} AS id
    `;
    const { rows } = await client.query(sqlBare, [email]);
    return rows[0].id;
  }

  const quotedCols = cols.map(quoteIdent).join(', ');
  const placeholders = cols.map((_, i) => `$${i + 2}`).join(', ');
  const sets = cols.map((c) => `${quoteIdent(c)} = EXCLUDED.${quoteIdent(c)}`).join(', ');

  const sql = `
    INSERT INTO ${quoteIdent(table)} (email, ${quotedCols})
    VALUES ($1, ${placeholders})
    ON CONFLICT (email) DO UPDATE SET ${sets}
    RETURNING ${quoteIdent(idColumn)} AS id
  `;
  const { rows } = await client.query(sql, [email, ...vals]);
  return rows[0].id;
}

const normEmails = (arr = []) =>
  arr.map(e => (typeof e === 'string' ? e : e?.email)).filter(Boolean);

// --- CREATE estudiante: usa TODOS los campos de la tabla ---
// --- CREATE estudiante: crea TODOS los campos y ENVÍA correos opcionalmente ---
exports.create = async (req, res) => {
  const {
    nombre, apellidos = null, email = null, terapeuta_id,
    documento_identificacion = null, fecha_nacimiento = null,
    edad = null, grado = null, colegio = null,
    // opcional: listas de emails a notificar (no se guardan)
    familiares = [],           // ["madre@x.com", ...] o [{email}]
    profesores = []            // ["profe@colegio.edu", ...] o [{email}]
  } = req.body;

  if (!nombre || !terapeuta_id) {
    return res.status(400).json({ message: 'nombre y terapeuta_id son obligatorios' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const codigo_acceso = generateAccessCode(8);

    const insertEst = `
      INSERT INTO estudiantes
        (nombre, apellidos, email, codigo_acceso, terapeuta_id,
         documento_identificacion, fecha_nacimiento, edad, grado, colegio)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING estudiante_id, codigo_acceso
    `;
    const { rows } = await client.query(insertEst, [
      nombre, apellidos, email, codigo_acceso, terapeuta_id,
      documento_identificacion, fecha_nacimiento, edad, grado, colegio
    ]);

    await client.query('COMMIT');

    const estudiante_id = rows[0].estudiante_id;
    const code = rows[0].codigo_acceso;

    // ====== ENVÍO DE CORREOS (opcional) ======
    const normEmails = (arr) => (arr || [])
      .map(e => (typeof e === 'string' ? e : e?.email))
      .filter(Boolean);

    const destinatarios = [...new Set([...normEmails(familiares), ...normEmails(profesores)])];

    if (destinatarios.length > 0) {
      // URL para el botón "Abrir portal"
      const base = process.env.PORTAL_BASE_URL || 'https://app.evasensorial.com/vincular';
      const portalUrl = `${base}?code=${encodeURIComponent(code)}`;

      console.log('[MAIL] Enviando códigos a:', destinatarios);
      const { sendStudentAccessCode } = require('../services/mailer');

      const resultados = await Promise.allSettled(
        destinatarios.map(to =>
          sendStudentAccessCode({
            to,
            estudiante: { nombre, apellidos },
            codigo: code,
            portalUrl
          })
        )
      );

      const enviados = [];
      const fallidos = [];
      resultados.forEach((r, i) => {
        const to = destinatarios[i];
        if (r.status === 'fulfilled') {
          enviados.push(to);
        } else {
          console.error('[MAIL] Error a', to, r.reason?.message);
          fallidos.push({ to, error: r.reason?.message });
        }
      });

      console.log('[MAIL] Resultado envío:', { enviados, fallidos });
      return res.status(201).json({ estudiante_id, codigo_acceso: code, enviados, fallidos });
    }

    // Si no se pidieron envíos, responde normal
    return res.status(201).json({ estudiante_id, codigo_acceso: code });
  } catch (e) {
    await client.query('ROLLBACK');
    return res.status(500).json({ message: e.message });
  } finally {
    client.release();
  }
};


// --- LISTAR ---
exports.findAll = async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT estudiante_id, nombre, apellidos, email, codigo_acceso,
             terapeuta_id, documento_identificacion, fecha_nacimiento,
             edad, grado, colegio
      FROM estudiantes
      ORDER BY estudiante_id DESC
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// --- OBTENER UNO ---
exports.findOne = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM estudiantes WHERE estudiante_id = $1`,
      [id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'No encontrado' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// --- UPDATE parcial (todos los campos editables) ---
exports.update = async (req, res) => {
  const { id } = req.params;
  const fields = [
    'nombre','apellidos','email','terapeuta_id','documento_identificacion',
    'fecha_nacimiento','edad','grado','colegio'
  ];

  const sets = [];
  const vals = [];
  let i = 1;

  for (const f of fields) {
    if (req.body[f] !== undefined) {
      sets.push(`${quoteIdent(f)} = $${i++}`);
      vals.push(req.body[f]);
    }
  }
  if (!sets.length) return res.status(400).json({ message: 'Nada para actualizar' });

  vals.push(id);
  try {
    const { rows } = await pool.query(
      `UPDATE estudiantes SET ${sets.join(', ')} WHERE estudiante_id = $${i} RETURNING *`,
      vals
    );
    if (!rows[0]) return res.status(404).json({ message: 'No encontrado' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// --- DELETE (limpia vínculos) ---
exports.remove = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM estudiante_familiar WHERE estudiante_id = $1', [id]);
    await client.query('DELETE FROM estudiante_profesor WHERE estudiante_id = $1', [id]);
    const { rowCount } = await client.query('DELETE FROM estudiantes WHERE estudiante_id = $1', [id]);
    await client.query('COMMIT');
    if (!rowCount) return res.status(404).json({ message: 'No encontrado' });
    res.json({ message: 'Eliminado' });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: e.message });
  } finally {
    client.release();
  }
};

// --- Vincular familiar por código (cuando se registre) ---
exports.linkFamiliarByCode = async (req, res) => {
  const { email, nombre = null, parentesco = null, codigo_acceso } = req.body;
  if (!email || !codigo_acceso) {
    return res.status(400).json({ message: 'email y codigo_acceso son obligatorios' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: estRows } = await client.query(
      'SELECT estudiante_id FROM estudiantes WHERE codigo_acceso = $1',
      [codigo_acceso]
    );
    if (!estRows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Código inválido' });
    }
    const estudiante_id = estRows[0].estudiante_id;

    const famId = await upsertByEmail(
      client, 'familiares', 'familiar_id', email.toLowerCase(),
      { nombre, parentesco, 'contraseña': 'temporal' }
    );

    await client.query(
      `INSERT INTO estudiante_familiar (estudiante_id, familiar_id)
       VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [estudiante_id, famId]
    );

    await client.query('COMMIT');
    res.json({ message: 'Vinculado', estudiante_id });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: e.message });
  } finally {
    client.release();
  }
};

// --- Vincular profesor por código (cuando se registre) ---
exports.linkProfesorByCode = async (req, res) => {
  const { email, nombre = null, materia = null, codigo_acceso } = req.body;
  if (!email || !codigo_acceso) {
    return res.status(400).json({ message: 'email y codigo_acceso son obligatorios' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: estRows } = await client.query(
      'SELECT estudiante_id FROM estudiantes WHERE codigo_acceso = $1',
      [codigo_acceso]
    );
    if (!estRows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Código inválido' });
    }
    const estudiante_id = estRows[0].estudiante_id;

    const profId = await upsertByEmail(
      client, 'profesores', 'profesor_id', email.toLowerCase(),
      { nombre, materia, 'contraseña': 'temporal' }
    );

    await client.query(
      `INSERT INTO estudiante_profesor (estudiante_id, profesor_id)
       VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [estudiante_id, profId]
    );

    await client.query('COMMIT');
    res.json({ message: 'Vinculado', estudiante_id });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: e.message });
  } finally {
    client.release();
  }
};

// --- NUEVO: Reenviar (o regenerar) código de acceso ---
exports.resendCode = async (req, res) => {
  const { id } = req.params;
  const { destinatarios = [], regenerate = false } = req.body; // destinatarios: array de emails

  if (!Array.isArray(destinatarios) || destinatarios.length === 0) {
    return res.status(400).json({ message: 'destinatarios (array) es obligatorio' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT estudiante_id, nombre, apellidos, codigo_acceso FROM estudiantes WHERE estudiante_id = $1',
      [id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Estudiante no encontrado' });

    let { nombre, apellidos, codigo_acceso } = rows[0];

    // regenerar si se pide
    if (regenerate) {
      codigo_acceso = generateAccessCode(8);
      await pool.query('UPDATE estudiantes SET codigo_acceso = $1 WHERE estudiante_id = $2', [codigo_acceso, id]);
    }

    const emails = normEmails(destinatarios);
    const resultados = { enviados: [], fallidos: [] };

    // enviar (si el servicio de correo no está listo, ajustaremos luego)
    for (const to of emails) {
      try {
        await sendStudentAccessCode({ to, estudiante: { nombre, apellidos }, codigo: codigo_acceso });
        resultados.enviados.push(to);
      } catch (err) {
        resultados.fallidos.push({ to, error: err.message });
      }
    }

    return res.json({ estudiante_id: Number(id), codigo_acceso, ...resultados });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

// --- Asignar estudiante a un terapeuta ---
exports.assignTherapist = async (req, res) => {
  const { id } = req.params; // estudiante_id
  const { terapeuta_id } = req.body;

  if (!terapeuta_id) {
    return res.status(400).json({ message: 'terapeuta_id es obligatorio' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE estudiantes
       SET terapeuta_id = $1
       WHERE estudiante_id = $2
       RETURNING estudiante_id, nombre, apellidos, terapeuta_id`,
      [terapeuta_id, id]
    );

    if (!rows[0]) return res.status(404).json({ message: 'Estudiante no encontrado' });
    res.json({message: " Estudiante asignado a un terapeuta de manera correcta"});
    
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// --- Listar estudiantes asignados a un terapeuta ---
exports.findByTherapist = async (req, res) => {
  const terapeuta_id = Number(req.params.terapeuta_id);
  if (!Number.isInteger(terapeuta_id)) {
    return res.status(400).json({ message: 'terapeuta_id inválido' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT estudiante_id, nombre, apellidos, email, codigo_acceso,
              documento_identificacion, fecha_nacimiento, edad, grado, colegio
       FROM estudiantes
       WHERE terapeuta_id = $1
       ORDER BY estudiante_id DESC`,
      [terapeuta_id]
    );

    return res.json(rows);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};
