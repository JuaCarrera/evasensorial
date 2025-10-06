require("dotenv").config();
const { Pool } = require("pg");

(async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log("[DB] Intentando conectar a:", process.env.DATABASE_URL);
    const result = await pool.query("select now() as fecha;");
    console.log("[DB] ✅ Conexión exitosa");
    console.log("[DB] Hora del servidor:", result.rows[0].fecha);
  } catch (err) {
    console.error("[DB] ❌ Error de conexión");
    console.error(" - Código:", err.code);
    console.error(" - Mensaje:", err.message);
    console.error(" - Detalles:", err);
  } finally {
    await pool.end();
  }
})();
