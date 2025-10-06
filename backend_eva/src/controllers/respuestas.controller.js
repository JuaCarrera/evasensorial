const pool = require('../../db');

/** Helpers */
function paginacion(query) {
  const page = Math.max(parseInt(query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || '50', 10), 1), 200);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function buildFilters(q, params) {
  const where = [];
  const values = [];

  const push = (clause, val) => { values.push(val); where.push(`${clause} $${values.length}`); };

  if (q.respondido_por) push('r.respondido_por =', q.respondido_por);
  if (q.formulario_id) push('f.formulario_id =', q.formulario_id);
  if (q.seccion_id)   push('s.seccion_id =', q.seccion_id);
  if (q.modulo_id)    push('m.modulo_id =',  q.modulo_id);

  // rango de fechas (sobre r.fecha)
  if (q.desde) push('r.fecha >=', q.desde + ' 00:00:00');
  if (q.hasta) push('r.fecha <=', q.hasta + ' 23:59:59');

  // inyecta primer valor (estudiante_id) al comienzo
  values.unshift(params.estudiante_id);
  where.unshift(`r.estudiante_id = $1`);

  return { where: where.length ? `WHERE ${where.join(' AND ')}` : '', values };
}

/** Query base con joins para devolver contexto (formulario, sección, módulo, pregunta) */
const SELECT_BASE = `
  SELECT
    r.respuesta_id,
    r.estudiante_id,
    r.pregunta_id,
    r.respondido_por,
    r.usuario_id,
    r.respuesta,
    r.fecha,

    p.texto              AS pregunta_texto,
    fp.tipo              AS pregunta_tipo,
    fp.orden             AS pregunta_orden,

    m.modulo_id,
    m.titulo             AS modulo_titulo,
    m.orden              AS modulo_orden,

    s.seccion_id,
    s.titulo             AS seccion_titulo,
    s.orden              AS seccion_orden,

    f.formulario_id,
    f.nombre             AS formulario_nombre,
    f.categoria          AS formulario_categoria,
    f.version            AS formulario_version
  FROM respuestas r
  JOIN preguntas p ON p.pregunta_id = r.pregunta_id
  LEFT JOIN formulario_preguntas fp ON fp.pregunta_id = r.pregunta_id
  LEFT JOIN formulario_secciones  s ON s.seccion_id   = fp.seccion_id
  LEFT JOIN formularios          f ON f.formulario_id = s.formulario_id
  LEFT JOIN formulario_modulos   m ON m.modulo_id     = fp.modulo_id
`;

/** Orden sugerido: formulario > sección > módulo > pregunta > fecha */
const ORDER_BY = `
  ORDER BY
    COALESCE(f.formulario_id, 999999), s.orden NULLS LAST,
    m.orden NULLS LAST, fp.orden NULLS LAST,
    r.fecha ASC, r.respuesta_id ASC
`;

/** Devuelve { total, rows } con paginación */
async function fetchRespuestas(estudiante_id, q) {
  const { page, limit, offset } = paginacion(q);
  const { where, values } = buildFilters(q, { estudiante_id });

  const countSQL = `SELECT COUNT(*) AS total FROM respuestas r
    LEFT JOIN formulario_preguntas fp ON fp.pregunta_id = r.pregunta_id
    LEFT JOIN formulario_secciones  s ON s.seccion_id   = fp.seccion_id
    LEFT JOIN formularios          f ON f.formulario_id = s.formulario_id
    LEFT JOIN formulario_modulos   m ON m.modulo_id     = fp.modulo_id
    ${where}`;

  const dataSQL  = `${SELECT_BASE} ${where} ${ORDER_BY} LIMIT $${values.length+1} OFFSET $${values.length+2}`;

  const client = await pool.connect();
  try {
    const [{ rows: [countRow] }, { rows }] = await Promise.all([
      client.query(countSQL, values),
      client.query(dataSQL, [...values, limit, offset])
    ]);
    const total = parseInt(countRow.total || '0', 10);
    return { page, limit, total, rows };
  } finally {
    client.release();
  }
}

/** GET /respuestas/por-codigo/:codigo_acceso */
exports.listByCodigo = async (req, res) => {
  const { codigo_acceso } = req.params;
  try {
    const r = await pool.query(
      'SELECT estudiante_id FROM estudiantes WHERE codigo_acceso = $1 LIMIT 1',
      [codigo_acceso]
    );
    if (!r.rows[0]) return res.status(404).json({ message: 'Estudiante no encontrado por codigo_acceso' });

    const estudiante_id = r.rows[0].estudiante_id;
    const data = await fetchRespuestas(estudiante_id, req.query);
    return res.json({
      estudiante_id,
      ...data
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

/** GET /respuestas/por-estudiante/:estudiante_id */
exports.listByEstudiante = async (req, res) => {
  const estudiante_id = Number(req.params.estudiante_id);
  if (!Number.isInteger(estudiante_id)) {
    return res.status(400).json({ message: 'estudiante_id inválido' });
  }
  try {
    const data = await fetchRespuestas(estudiante_id, req.query);
    return res.json({
      estudiante_id,
      ...data
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};
exports.listByTerapeuta = async (req, res) => {
  const terapeuta_id = Number(req.params.terapeuta_id);
  if (!Number.isInteger(terapeuta_id)) {
    return res.status(400).json({ message: 'terapeuta_id inválido' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT e.estudiante_id, e.nombre, e.apellidos, e.codigo_acceso,
              r.respuesta_id, r.pregunta_id, r.respuesta, r.fecha,
              p.texto as pregunta_texto
       FROM estudiantes e
       LEFT JOIN respuestas r ON r.estudiante_id = e.estudiante_id
       LEFT JOIN preguntas p ON p.pregunta_id = r.pregunta_id
       WHERE e.terapeuta_id = $1
       ORDER BY e.estudiante_id, r.fecha ASC`,
      [terapeuta_id]
    );

    res.json(rows);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};
