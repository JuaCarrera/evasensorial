// src/middleware/auth.js
const jwt = require('jsonwebtoken');

function signJwt(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET || 'change_me', { expiresIn: '8h' });
}

function verifyJwt(req, res, next) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ message: 'Token requerido' });
  const token = auth.slice(7);
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'change_me');
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Token inválido' });
  }
}

module.exports = { signJwt, verifyJwt };
