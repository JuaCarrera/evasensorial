require('dotenv').config();
const { renderStudentCodeEmail } = require('../templates/studentCodeEmail');

// ==============================================
//   CONFIGURACIÓN SMTP2GO API (USANDO FETCH)
// ==============================================
const SMTP2GO_API_URL = "https://api.smtp2go.com/v3/email/send";
const SMTP2GO_API_KEY = "api-FA9284F082A447729C783BC864F12098";
const MAIL_FROM = "isistemas@umariana.edu.co";

// ==============================================
//   FUNCIÓN PRINCIPAL
// ==============================================
async function sendStudentAccessCode({
  to,
  estudiante,
  codigo,
  portalUrl,
  role = "familiar",
  recipientName = ""
}) {
  const { nombre = "", apellidos = "" } = estudiante || {};

  const title =
    role === "profesor"
      ? "Invitación para docente"
      : "Invitación para acudiente";

  const html = renderStudentCodeEmail({
    title,
    studentName: `${nombre} ${apellidos}`.trim(),
    code: codigo,
    portalUrl,
    role,
    recipientName
  });

  const text = 
`${title}
Destinatario: ${recipientName || "(sin nombre)"}
Estudiante: ${nombre} ${apellidos}
Código: ${codigo}
Portal: ${portalUrl || ""}`;

  const subjectPrefix = role === "profesor" ? "Docente" : "Acudiente";
  const subject = `${subjectPrefix} • Código de acceso para ${nombre || "estudiante"}`;

  // ==============================================
  //    PETICIÓN FETCH EXACTA SEGÚN DOCUMENTACIÓN
  // ==============================================
  const payload = {
    api_key: SMTP2GO_API_KEY,
    to: [to],
    sender: MAIL_FROM,
    subject,
    text_body: text,
    html_body: html
  };

  const response = await fetch(SMTP2GO_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  return data;
}

module.exports = { sendStudentAccessCode };
