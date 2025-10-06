require('dotenv').config();
const nodemailer = require('nodemailer');
const { renderStudentCodeEmail } = require('../templates/studentCodeEmail');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

async function sendStudentAccessCode({
  to,
  estudiante,                     // { nombre, apellidos }
  codigo,
  portalUrl,
  role = 'familiar',              // 'familiar' | 'profesor'
  recipientName = ''              // opcional: nombre del destinatario
}) {
  const { nombre = '', apellidos = '' } = estudiante || {};
  const title = role === 'profesor' ? 'Invitación para docente' : 'Invitación para acudiente';

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
Destinatario: ${recipientName || '(sin nombre)'}
Estudiante: ${nombre} ${apellidos}
Código: ${codigo}
Portal: ${portalUrl || ''}`;

  const subjectPrefix = role === 'profesor' ? 'Docente' : 'Acudiente';
  const subject = `${subjectPrefix} • Código de acceso para ${nombre || 'estudiante'}`;

  return transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
    text
  });
}

module.exports = { transporter, sendStudentAccessCode };
