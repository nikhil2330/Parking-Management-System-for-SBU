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
  secure: process.env.MAIL_SECURE === 'true', // true = SSL (port 465)
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
          <p>We're sorry, but your P4SBU parking account request has been <b>rejected</b>. If you believe this is a mistake you can contact our support at parking4sbu@gmail.com.</p>`;
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

// ─── 4.  Feedback response email ─────────────────────────────
const buildFeedbackHtml = (feedback) => {
  const { user, subject, message, adminResponse, rating, category } = feedback;
  const username = user?.username || 'there';
  
  // Format the rating as stars
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
  const categoryDisplay = category.charAt(0).toUpperCase() + category.slice(1);
  
  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #900;">Response to Your Feedback</h2>
    
    <p>Hi ${username},</p>
    
    <p>Thank you for your feedback regarding "<b>${subject}</b>". An administrator has reviewed and responded to your feedback.</p>
    
    <div style="background-color: #f8f8f8; padding: 15px; border-left: 4px solid #900; margin: 20px 0;">
      <h3 style="margin-top: 0;">Your Original Feedback</h3>
      <p><b>Category:</b> ${categoryDisplay}</p>
      <p><b>Rating:</b> <span style="color: #f8d64e;">${stars}</span> (${rating}/5)</p>
      <p><b>Message:</b></p>
      <div style="background-color: white; padding: 10px; border: 1px solid #eee; border-radius: 4px;">
        ${message}
      </div>
    </div>
    
    <div style="background-color: #f0f7ff; padding: 15px; border-left: 4px solid #0056b3; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #0056b3;">Administrator Response:</h3>
      <div style="background-color: white; padding: 10px; border: 1px solid #cce5ff; border-radius: 4px;">
        ${adminResponse}
      </div>
    </div>
    
    <p>We appreciate your input as it helps us improve our parking services.</p>
    
    <p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; color: #666;">
      Thank you,<br>
      The P4SBU Team
    </p>
  </div>
  `;
};

exports.sendFeedbackResponseEmail = async (feedback) => {
  if (!feedback || !feedback.user || !feedback.user.email) {
    console.error('Cannot send feedback response: missing user or email');
    return;
  }
  
  const subject = `Response to Your Feedback: ${feedback.subject}`;
  
  const text = `
Hello ${feedback.user.username || 'there'},

Thank you for your feedback regarding "${feedback.subject}". An administrator has reviewed and responded to your feedback.

Your Original Feedback:
Category: ${feedback.category}
Rating: ${feedback.rating}/5
Message: ${feedback.message}

Administrator Response:
${feedback.adminResponse}

We appreciate your input as it helps us improve our parking services.

Thank you,
The P4SBU Team
  `;
  
  await send({
    to: feedback.user.email,
    subject,
    text,
    html: buildFeedbackHtml(feedback)
  });
};