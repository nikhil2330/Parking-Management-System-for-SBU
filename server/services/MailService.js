// server/services/MailService.js
// ------------------------------------------------------------
// Lightweight mail helper for P4SBU.  Uses Nodemailer + plain
// SMTP so you can swap any provider (Gmail, Mailgun, SES, etc.)
// ------------------------------------------------------------

const nodemailer = require('nodemailer');

// ─── 1.  Build the transporter from env ──────────────────────
// Put these in /server/config/.env (examples below):
// MAIL_HOST=smtp.gmail.com
// MAIL_PORT=587          # 465 if you need SSL
// MAIL_SECURE=false      # true for port 465
// MAIL_USER=you@example.com
// MAIL_PASS=************
// MAIL_FROM="P4SBU Parking <no‑reply@p4sbu.com>"

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT, 10) || 587,
  secure: process.env.MAIL_SECURE === 'true', // true = SSL (port 465)
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

// Verify connection at server‑start so you fail fast
if (process.env.NODE_ENV !== 'test') {
  transporter.verify().then(() => console.log('Mail server ready'))
                     .catch(err => console.error('Mail server error', err));
}

// ─── 2.  Generic sender helper ───────────────────────────────
const send = async ({ to, subject, text, html }) => {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    text,
    html
  });
};

// ─── 3.  Domain‑specific wrappers ────────────────────────────
const buildHtml = (name, status) => {
  if (status === 'approved') {
    return `<p>Hi ${name},</p>
            <p>Your P4SBU parking account has been <b>approved</b>. You can now sign in and start reserving spots.</p>
            <p>Welcome aboard! 🚗</p>`;
  }
  return `<p>Hi ${name},</p>
          <p>We’re sorry, but your P4SBU parking account request has been <b>rejected</b>. If you believe this is a mistake you can contact our support at parking4sbu@gmail.com.</p>`;
};

exports.sendAccountStatusEmail = async (user, status) => {
  const subject = status === 'approved'
    ? 'Your P4SBU account has been approved'
    : 'Your P4SBU account request was rejected';

  await send({
    to: user.email,
    subject,
    text: `Hello ${user.username}, your account has been ${status}.`,
    html: buildHtml(user.username, status)
  });
};
