// src/controllers/terapeutas.controller.js
const pool = require('../../db');
const bcrypt = require('bcryptjs');
const { signJwt } = require('../../middleware/auth');

const sanitize = (row) => {
  if (!row) return row;
  const {
    terapeuta_id, nombre, email, es_superadmin, Cargo,
    identificacion, especialidad, telefono, ubicacion, estado
  } = row;
  return {
    terapeuta_id, nombre, email, es_superadmin, Cargo,
    identificacion, especialidad, telefono, ubicacion, estado
  };
};

// LOGIN
exports.login = async (req, res) => {
  const { email, password, contrasena } = req.body;
  const raw = password ?? contrasena ?? req.body['contraseña'];
  if (!email || !raw) return res.status(400).json({ message: 'Email y contraseña son obligatorios' });

  try {
    const { rows } = await pool.query(
      `SELECT terapeuta_id, nombre, email, "contraseña" AS hash, es_superadmin, "Cargo",
              identificacion, especialidad, telefono, ubicacion, estado
       FROM terapeutas WHERE email = $1`,
      [email]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });

    const ok = await bcrypt.compare(raw, user.hash);
    if (!ok) return res.status(401).json({ message: 'Credenciales inválidas' });

    const token = signJwt({
      id: user.terapeuta_id,
      email: user.email,
      es_superadmin: user.es_superadmin || false
    });

    return res.json({ token, user: sanitize(user) });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

// CREATE
exports.create = async (req, res) => {
  const {
    nombre, email, password, contrasena,
    es_superadmin = false, Cargo = null,
    identificacion = null, especialidad = null,
    telefono = null, ubicacion = null, estado = null
  } = req.body;

  const raw = password ?? contrasena ?? req.body['contraseña'];
  if (!nombre || !email || !raw) {
    return res.status(400).json({ message: 'nombre, email y contraseña son obligatorios' });
  }

  try {
    const exists = await pool.query('SELECT 1 FROM terapeutas WHERE email = $1 LIMIT 1', [email]);
    if (exists.rowCount) return res.status(409).json({ message: 'El email ya está registrado' });

    const hash = await bcrypt.hash(raw, 10);
    const { rows } = await pool.query(
      `INSERT INTO terapeutas (
          nombre, email, "contraseña", es_superadmin, "Cargo",
          identificacion, especialidad, telefono, ubicacion, estado
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING terapeuta_id, nombre, email, es_superadmin, "Cargo",
                 identificacion, especialidad, telefono, ubicacion, estado`,
      [nombre, email, hash, es_superadmin, Cargo, identificacion, especialidad, telefono, ubicacion, estado]
    );
    return res.status(201).json(rows[0]);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

// READ ALL
exports.findAll = async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT terapeuta_id, nombre, email, es_superadmin, "Cargo",
              identificacion, especialidad, telefono, ubicacion, estado
       FROM terapeutas ORDER BY terapeuta_id DESC`
    );
    return res.json(rows);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

// READ ONE
exports.findOne = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT terapeuta_id, nombre, email, es_superadmin, "Cargo",
              identificacion, especialidad, telefono, ubicacion, estado
       FROM terapeutas WHERE terapeuta_id = $1`,
      [id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'No encontrado' });
    return res.json(rows[0]);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

// UPDATE parcial
exports.update = async (req, res) => {
  const { id } = req.params;
  const {
    nombre, email, password, contrasena, es_superadmin, Cargo,
    identificacion, especialidad, telefono, ubicacion, estado
  } = req.body;

  try {
    const sets = [];
    const vals = [];
    let i = 1;

    const push = (field, value, col = field) => {
      if (value !== undefined) { sets.push(`${col} = $${i++}`); vals.push(value); }
    };

    push('nombre', nombre);
    push('email', email);
    push('es_superadmin', es_superadmin);
    push('"Cargo"', Cargo, '"Cargo"');
    push('identificacion', identificacion);
    push('especialidad', especialidad);
    push('telefono', telefono);
    push('ubicacion', ubicacion);
    push('estado', estado);

    const raw = password ?? contrasena ?? req.body['contraseña'];
    if (raw !== undefined) {
      const hash = await bcrypt.hash(raw, 10);
      push('"contraseña"', hash, '"contraseña"');
    }

    if (!sets.length) return res.status(400).json({ message: 'Nada para actualizar' });

    vals.push(id);
    const { rows } = await pool.query(
      `UPDATE terapeutas SET ${sets.join(', ')} WHERE terapeuta_id = $${i}
       RETURNING terapeuta_id, nombre, email, es_superadmin, "Cargo",
                 identificacion, especialidad, telefono, ubicacion, estado`,
      vals
    );

    if (!rows[0]) return res.status(404).json({ message: 'No encontrado' });
    return res.json(rows[0]);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

// DELETE
exports.remove = async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query('DELETE FROM terapeutas WHERE terapeuta_id = $1', [id]);
    if (!rowCount) return res.status(404).json({ message: 'No encontrado' });
    return res.json({ message: 'Eliminado' });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};