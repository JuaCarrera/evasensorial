// src/templates/studentCodeEmail.js
function renderStudentCodeEmail({
  title,
  studentName,
  code,
  portalUrl,
  role = 'familiar',
  recipientName = ''
}) {
  const primary   = '#7C3AED';
  const gradFrom  = '#6D28D9';
  const gradTo    = '#9333EA';
  const cardBg    = '#ffffff';
  const textMain  = '#1F2937';
  const textMuted = '#6B7280';

  // 🔥 URL fija al registro (sin código en la URL)
  const safeUrl = 'https://evasensorial.netlify.app/register';

  const isFamiliar = role === 'familiar';

  const heading = isFamiliar
    ? 'Invitación para acudiente'
    : 'Invitación para docente';

  const subheading = isFamiliar
    ? 'Te invitamos a vincularte como acudiente del estudiante. Usa el siguiente código para completar tu registro y acceder al Formulario.'
    : 'Te invitamos a vincularte como docente del estudiante. Usa el siguiente código para completar tu registro y acceder al Formulario.';

  const buttonText = isFamiliar ? 'Vincularme como acudiente' : 'Vincularme como docente';

  const greetLine = recipientName
    ? `Hola <strong>${esc(recipientName)}</strong>,`
    : 'Hola,';

  return `
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title || heading)}</title>
<style>
@media (max-width:600px){
  .container{padding:16px!important}
  .card{padding:20px!important}
  .code{font-size:28px!important;letter-spacing:6px!important}
  .btn{padding:12px 16px!important}
}
</style>
</head>
<body style="margin:0;background:linear-gradient(135deg,${gradFrom},${gradTo});font-family:ui-sans-serif,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div class="container" style="padding:32px;">
    <table role="presentation" width="100%" style="max-width:640px;margin:0 auto;">
      <tr><td style="padding:8px 0 16px 0;text-align:center">
        
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="#F3E8FF" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M7.5 0a2.5 2.5 0 0 0-2.45 2H5a2 2 0 0 0-2 2v2.5H2a2 2 0 0 0-2 2V9a2 2 0 0 0 2 2h1v2.5a2 2 0 0 0 2 2h.05A2.5 2.5 0 0 0 7.5 16v-1a1.5 1.5 0 0 1-1.5-1.5V8h3v5.5A1.5 1.5 0 0 1 7.5 15v1a2.5 2.5 0 0 0 2.45-2H11a2 2 0 0 0 2-2V11h1a2 2 0 0 0 2-2V8.5a2 2 0 0 0-2-2h-1V4a2 2 0 0 0-2-2h-.05A2.5 2.5 0 0 0 7.5 0z"/>
        </svg>

        <div style="color:#F3E8FF;font-weight:700;font-size:18px;letter-spacing:.3px">EVA Sensorial</div>
      </td></tr>
    </table>

    <table role="presentation" width="100%" style="max-width:640px;margin:0 auto;background:${cardBg};border-radius:16px;box-shadow:0 10px 25px rgba(0,0,0,.18)">
      <tr><td class="card" style="padding:28px">
        
        <h1 style="margin:0;color:${textMain};font-size:22px;line-height:1.3">${esc(title || heading)}</h1>
        <p style="margin:10px 0 0;color:${textMuted};font-size:14px">${greetLine}</p>
        <p style="margin:6px 0 0;color:${textMuted};font-size:14px">${esc(subheading)}</p>

        <div style="margin:16px 0 0;color:${textMuted};font-size:14px">Estudiante</div>
        <div style="color:${textMain};font-weight:600;font-size:16px">${esc(studentName || '—')}</div>

        <div style="margin:20px 0 6px;color:${textMuted};font-size:14px">Código de acceso</div>
        <div class="code" style="display:inline-block;background:#F3F4F6;border:1px solid #E5E7EB;border-radius:12px;padding:14px 18px;font-weight:800;color:${textMain};font-size:32px;letter-spacing:10px">
          ${esc(code || '------')}
        </div>

        <div style="margin:24px 0 22px">
          <a class="btn" href="${safeUrl}" style="display:inline-block;background:${primary};color:#fff;text-decoration:none;font-weight:700;border-radius:12px;padding:14px 22px">
            ${esc(buttonText)}
          </a>
        </div>

        <p style="margin:0;color:${textMuted};font-size:13px;line-height:1.6">
          Si el botón no funciona, copia y pega esta URL en tu navegador:
          <br><span style="color:${textMain}">${safeUrl}</span>
        </p>

        <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0">
        <p style="margin:0;color:${textMuted};font-size:12px">
          Si no esperabas este mensaje, puedes ignorarlo. Tu correo no será vinculado si no completas el proceso.
        </p>

      </td></tr>
    </table>

    <table role="presentation" width="100%" style="max-width:640px;margin:16px auto 0">
      <tr><td style="text-align:center;color:#E9D5FF;font-size:12px">
        © ${new Date().getFullYear()} EVA Sensorial
      </td></tr>
    </table>
  </div>
</body>
</html>`;
}

function esc(s=''){
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');
}

module.exports = { renderStudentCodeEmail };
