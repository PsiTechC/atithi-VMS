// Send invite email to client-user
export async function sendUserInviteMail(opts: {
  to: string;
  name: string;
  clientName: string;
  tempPassword: string;
}) {
  const html = `
    <div style="font-family:Arial,sans-serif">
      <h2>Welcome to Visitor Management, ${opts.name}</h2>
      <p>Your account for <b>${opts.clientName}</b> is ready. Use the credentials below to sign in:</p>
      <ul>
        <li><b>Email:</b> ${opts.to}</li>
        <li><b>Password:</b> ${opts.tempPassword}</li>
        <li><b>Login URL:</b> <a href="${process.env.APP_BASE_URL || "http://localhost:3000"}/login">${process.env.APP_BASE_URL || "http://localhost:3000"}/login</a></li>
      </ul>
      <p>For security, please change your password after logging in.</p>
    </div>
  `;
  return transporter.sendMail({
    from: `"Visitor Management" <${process.env.SMTP_USER}>`,
    to: opts.to,
    subject: "Your User Account Access",
    html,
  });
}
// // lib/mailer.ts
// import nodemailer from "nodemailer"

// const {
//     SMTP_HOST,
//     SMTP_PORT,
//     SMTP_USER,
//     SMTP_PASS,
//     MAIL_FROM = "no-reply@example.com",
// } = process.env

// export const transporter = nodemailer.createTransport({
//     host: SMTP_HOST,
//     port: Number(SMTP_PORT || 587),
//     secure: Number(SMTP_PORT) === 465, // true for 465, false for 587/2525
//     auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
// })

// export async function sendMail(opts: {
//     to: string
//     subject: string
//     html: string
//     text?: string
// }) {
//     return transporter.sendMail({
//         from: MAIL_FROM,
//         to: opts.to,
//         subject: opts.subject,
//         html: opts.html,
//         text: opts.text,
//     })
// }


// lib/mailer.ts
import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST; // adjust to your provider
const port = Number(process.env.SMTP_PORT);
const secure = process.env.SMTP_SECURE === 'true';      // false for 587 (STARTTLS), true for 465
const user = process.env.SMTP_USER!;                    // sender email
const pass = process.env.SMTP_PASS!;                    // sender app-password/password

export const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: { user, pass },
  tls: {
    rejectUnauthorized: false, // Allow self-signed certificates or mismatched hostnames
  },
});

export async function sendInviteEmail(opts: {
  to: string;
  clientName: string;
  loginUrl: string;
  emailForLogin: string;
  plainPassword: string; // required by your spec
}) {
  const html = `
    <div style="font-family:Arial,sans-serif">
      <h2>Welcome to Visitor Management, ${opts.clientName}</h2>
      <p>Your account is ready. Use the credentials below to sign in:</p>
      <ul>
        <li><b>URL:</b> <a href="${opts.loginUrl}">${opts.loginUrl}</a></li>
        <li><b>Email:</b> ${opts.emailForLogin}</li>
        <li><b>Password:</b> ${opts.plainPassword}</li>
      </ul>
      <p>For security, please keep this email safe.</p>
    </div>
  `;

  return transporter.sendMail({
    from: `"Visitor Management" <${user}>`,
    to: opts.to,
    subject: "Your Client Portal Access",
    html,
  });
}


// 🔹 Check if SMTP is working
export async function checkSMTP() {
  try {
    await transporter.verify();
    console.log("✅ SMTP server is ready to take our messages");
    return true;
  } catch (err) {
    console.error("❌ SMTP connection failed:", err);
    return false;
  }
}