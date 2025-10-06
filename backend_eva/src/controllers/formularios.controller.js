// src/controllers/formularios.controller.js
const pool = require('../../db');

// ===== Helpers =====
const toJsonbParam = (v) => {
  if (v === undefined || v === null) return null;
  try { return JSON.stringify(v); } catch { return null; }
};

// Reutiliza pregunta por texto; si no existe, crea
async function findOrCreatePregunta(client, { texto, categoria = null }) {
  const sel = await client.query(
    'SELECT pregunta_id FROM preguntas WHERE texto = $1 LIMIT 1',
    [texto]
  );
  if (sel.rows[0]) return sel.rows[0].pregunta_id;

  const ins = await client.query(
    'INSERT INTO preguntas (texto, categoria) VALUES ($1,$2) RETURNING pregunta_id',
    [texto, categoria]
  );
  return ins.rows[0].pregunta_id;
}

// ===== CREATE: formulario → secciones → módulos → preguntas =====
exports.create = async (req, res) => {
  const {
    nombre,
    descripcion = null,
    categoria = null,
    destinatario = null,
    estado = 'Borrador',
    version = 1,
    secciones = [] // [{ titulo, orden, modulos: [{ titulo, orden, preguntas: [...] }] }]
  } = req.body || {};

  if (!nombre) return res.status(400).json({ message: 'nombre es obligatorio' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const fRes = await client.query(
      `INSERT INTO formularios (nombre, descripcion, categoria, destinatario, estado, version)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING formulario_id`,
      [nombre, descripcion, categoria, destinatario, estado, version]
    );
    const formulario_id = fRes.rows[0].formulario_id;

    for (const sec of secciones) {
      if (!sec?.titulo || !sec?.orden) continue;

      const sRes = await client.query(
        `INSERT INTO formulario_secciones (formulario_id, titulo, orden)
         VALUES ($1,$2,$3)
         RETURNING seccion_id`,
        [formulario_id, sec.titulo, sec.orden]
      );
      const seccion_id = sRes.rows[0].seccion_id;

      for (const mod of (sec.modulos || [])) {
        if (!mod?.titulo || !mod?.orden) continue;

        const mRes = await client.query(
          `INSERT INTO formulario_modulos (seccion_id, titulo, orden)
           VALUES ($1,$2,$3)
           RETURNING modulo_id`,
          [seccion_id, mod.titulo, mod.orden]
        );
        const modulo_id = mRes.rows[0].modulo_id;

        for (const p of (mod.preguntas || [])) {
          const { texto, tipo, orden, opciones = null } = p || {};
          if (!texto || !tipo || !orden) continue;

          const pregunta_id = await findOrCreatePregunta(client, { texto });
          const opcionesJson = toJsonbParam(opciones);

          // ⚠️ Aquí el fix: guardamos seccion_id y modulo_id porque seccion_id es NOT NULL
          await client.query(
            `INSERT INTO formulario_preguntas (seccion_id, modulo_id, pregunta_id, tipo, orden, opciones)
             VALUES ($1,$2,$3,$4,$5,$6::jsonb)`,
            [seccion_id, modulo_id, pregunta_id, tipo, orden, opcionesJson]
          );
        }
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ formulario_id });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: e.message });
  } finally {
    client.release();
  }
};

// ===== LIST (cabecera) =====
exports.list = async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT formulario_id, nombre, descripcion, categoria, destinatario, estado, version,
             creado_en, actualizado_en
      FROM formularios
      ORDER BY formulario_id DESC
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ===== GET detalle anidado (con módulos) =====
exports.getOne = async (req, res) => {
  const { id } = req.params;

  try {
    const f = await pool.query(
      `SELECT formulario_id, nombre, descripcion, categoria, destinatario, estado, version,
              creado_en, actualizado_en
       FROM formularios WHERE formulario_id = $1`,
      [id]
    );
    if (!f.rows[0]) return res.status(404).json({ message: 'No encontrado' });

    const secciones = await pool.query(
      `SELECT seccion_id, titulo, orden
       FROM formulario_secciones
       WHERE formulario_id = $1
       ORDER BY orden ASC`,
      [id]
    );

    const seccionIds = secciones.rows.map(s => s.seccion_id);

    // Módulos por sección
    let modulosBySeccion = {};
    if (seccionIds.length) {
      const mods = await pool.query(
        `SELECT modulo_id, seccion_id, titulo, orden
         FROM formulario_modulos
         WHERE seccion_id = ANY($1::int[])
         ORDER BY orden ASC`,
        [seccionIds]
      );
      modulosBySeccion = mods.rows.reduce((acc, m) => {
        (acc[m.seccion_id] ||= []).push(m);
        return acc;
      }, {});
    }

    // Preguntas por módulo
    const allModuloIds = Object.values(modulosBySeccion).flat().map(m => m.modulo_id);
    let preguntasByModulo = {};
    if (allModuloIds.length) {
      const fp = await pool.query(
        `SELECT fp.formulario_pregunta_id, fp.modulo_id, fp.tipo, fp.orden, fp.opciones,
                p.pregunta_id, p.texto, p.categoria
         FROM formulario_preguntas fp
         JOIN preguntas p ON p.pregunta_id = fp.pregunta_id
         WHERE fp.modulo_id = ANY($1::int[])
         ORDER BY fp.orden ASC`,
        [allModuloIds]
      );
      preguntasByModulo = fp.rows.reduce((acc, r) => {
        (acc[r.modulo_id] ||= []).push({
          formulario_pregunta_id: r.formulario_pregunta_id,
          pregunta_id: r.pregunta_id,
          texto: r.texto,
          categoria: r.categoria,
          tipo: r.tipo,
          orden: r.orden,
          opciones: r.opciones
        });
        return acc;
      }, {});
    }

    const data = {
      ...f.rows[0],
      secciones: secciones.rows.map(s => ({
        ...s,
        modulos: (modulosBySeccion[s.seccion_id] || []).map(m => ({
          ...m,
          preguntas: preguntasByModulo[m.modulo_id] || []
        }))
      }))
    };

    res.json(data);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ===== UPDATE (solo top-level; no cambia estructura) =====
exports.update = async (req, res) => {
  const { id } = req.params;
  const fields = ['nombre', 'descripcion', 'categoria', 'destinatario', 'estado', 'version'];
  const sets = [];
  const vals = [];
  let i = 1;

  for (const f of fields) {
    if (req.body[f] !== undefined) {
      sets.push(`${f} = $${i++}`);
      vals.push(req.body[f]);
    }
  }
  if (!sets.length) return res.status(400).json({ message: 'Nada para actualizar' });

  vals.push(id);

  try {
    const up = await pool.query(
      `UPDATE formularios SET ${sets.join(', ')}, actualizado_en = now()
       WHERE formulario_id = $${i}
       RETURNING *`,
      vals
    );
    if (!up.rows[0]) return res.status(404).json({ message: 'No encontrado' });
    res.json(up.rows[0]);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ===== DELETE (borra estructura completa) =====
exports.remove = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const secs = await client.query(
      'SELECT seccion_id FROM formulario_secciones WHERE formulario_id = $1',
      [id]
    );
    const seccionIds = secs.rows.map(r => r.seccion_id);

    let moduloIds = [];
    if (seccionIds.length) {
      const mods = await client.query(
        'SELECT modulo_id FROM formulario_modulos WHERE seccion_id = ANY($1::int[])',
        [seccionIds]
      );
      moduloIds = mods.rows.map(r => r.modulo_id);
    }

    if (moduloIds.length) {
      await client.query(
        'DELETE FROM formulario_preguntas WHERE modulo_id = ANY($1::int[])',
        [moduloIds]
      );
      await client.query(
        'DELETE FROM formulario_modulos WHERE modulo_id = ANY($1::int[])',
        [moduloIds]
      );
    }

    await client.query('DELETE FROM formulario_secciones WHERE formulario_id = $1', [id]);
    const del = await client.query('DELETE FROM formularios WHERE formulario_id = $1', [id]);

    await client.query('COMMIT');

    if (!del.rowCount) return res.status(404).json({ message: 'No encontrado' });
    res.json({ message: 'Eliminado' });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: e.message });
  } finally {
    client.release();
  }
};
