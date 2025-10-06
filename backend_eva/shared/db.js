require("dotenv").config();
const { Pool } = require("pg");
const { URL } = require("url");

function makePool() {
  if (process.env.DATABASE_URL) {
    try {
      const parsed = new URL(process.env.DATABASE_URL);
      console.log(`[DB] Usando DATABASE_URL. Host: ${parsed.hostname}`);

      // ✅ Forzar uso del Shared Pooler (IPv4) de Supabase si se define en .env
      // Si Render intenta IPv6, lo redirigimos a DB_HOST (shared pooler IPv4)
      if (process.env.DB_HOST) {
        parsed.hostname = process.env.DB_HOST;
        console.log(`[DB] Forzando host IPv4 (Shared Pooler): ${parsed.hostname}`);
      }

      return new Pool({
        connectionString: parsed.toString(),
        ssl: { rejectUnauthorized: false },
      });
    } catch (_) {
      console.warn("[DB] DATABASE_URL inválida. Revisa el formato.");
    }
  }

  console.log("[DB] Usando configuración manual por campos .env (respaldo)");
  return new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
  });
}

const pool = makePool();

// 🔎 Prueba temprana con logs detallados
(async () => {
  try {
    console.log("[DB] Intentando conectar...");
    await pool.query("select now()");
    console.log("[DB] ✅ Conexión OK");
  } catch (e) {
    console.error("[DB] ❌ Error de conexión:");
    console.error(" - Código:", e.code);
    console.error(" - Mensaje:", e.message);
    console.error(" - Dirección:", e.address);
    console.error(" - Puerto:", e.port);
  }
})();

module.exports = pool;
