require("dotenv").config();
const { Pool } = require("pg");
const { URL } = require("url");

function makePool() {
  if (process.env.DATABASE_URL) {
    try {
      const parsed = new URL(process.env.DATABASE_URL);

      // 🔒 Ocultar contraseña en logs
      const safeUrl = new URL(process.env.DATABASE_URL);
      safeUrl.password = "*****";

      console.log(`[DB] Usando DATABASE_URL (pooler IPv4). Host: ${parsed.hostname}`);
      console.log(`[DB] Conexión configurada a: ${safeUrl.toString()}`);

      return new Pool({
        connectionString: process.env.DATABASE_URL,
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
    const result = await pool.query("select now() as fecha;");
    console.log("[DB] ✅ Conexión exitosa");
    console.log("[DB] Hora del servidor:", result.rows[0].fecha);
  } catch (e) {
    console.error("[DB] ❌ Error de conexión:");
    console.error(" - Código:", e.code);
    console.error(" - Mensaje:", e.message);
    console.error(" - Dirección:", e.address);
    console.error(" - Puerto:", e.port);
  }
})();

module.exports = pool;
