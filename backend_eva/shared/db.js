require('dotenv').config();
const { Pool } = require('pg');
const url = require('url');

function makePool() {
  if (process.env.DATABASE_URL) {
    // Log mínimo para depurar host cuando hay ENOTFOUND
    try {
      const { hostname } = new url.URL(process.env.DATABASE_URL);
      console.log(`[DB] Usando DATABASE_URL. Host: ${hostname}`);
    } catch (_) {
      console.warn('[DB] DATABASE_URL inválida. Revisa el formato.');
    }

    return new Pool({
      connectionString: process.env.DATABASE_URL, // incluye ?sslmode=require
      ssl: { rejectUnauthorized: false }
    });
  }

  console.log('[DB] Usando configuración por campos .env');
  return new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  });
}

const pool = makePool();

// Prueba temprana y logs más claros si falla
(async () => {
  try {
    await pool.query('select 1');
    console.log('[DB] Conexión OK');
  } catch (e) {
    console.error('[DB] Error de conexión:', e.code, e.message);
  }
})();

module.exports = pool;
