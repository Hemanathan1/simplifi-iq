/**
 * email/index.js
 * Sends the generated PDF audit report to the prospect via email.
 * Supports two transports:
 *   - SendGrid (recommended for production)
 *   - SMTP / Gmail (easy for local dev/testing)
 *
 * Falls back gracefully between the two based on available env vars.
 */

const nodemailer = require('nodemailer');

// ── Transport factory ─────────────────────────────────────────────────────────

function createTransport() {
  // Option A: SendGrid
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host:   'smtp.sendgrid.net',
      port:   587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }

  // Option B: SMTP (Gmail, Outlook, custom)
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  throw new Error(
    'No email transport configured. Set SENDGRID_API_KEY or SMTP_HOST in .env'
  );
}

// ── Main send function ────────────────────────────────────────────────────────

async function sendReportEmail(lead, pdfBuffer) {
  const transporter = createTransport();
  const from        = process.env.EMAIL_FROM || 'SimplifIQ <noreply@simplifiiq.com>';
  const fileName    = `${lead.company.replace(/[^a-zA-Z0-9]/g, '-')}-Audit-Report.pdf`;

  const mailOptions = {
    from,
    to:      `${lead.name} <${lead.email}>`,
    subject: `Your ${lead.company} Audit Report — SimplifIQ`,
    text:    buildPlainText(lead),
    html:    buildEmailHtml(lead),
    attachments: [
      {
        filename:    fileName,
        content:     pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[Email] Sent to ${lead.email} — Message ID: ${info.messageId}`);
  return info;
}

// ── Email body templates ──────────────────────────────────────────────────────

function buildEmailHtml(lead) {
  const firstName = lead.name.split(' ')[0];

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a,#1e1b4b);padding:36px 40px;">
              <div style="font-size:22px;font-weight:700;color:#ffffff;">SimplifIQ</div>
              <div style="font-size:13px;color:#a5b4fc;margin-top:4px;">Simplifying AI Adoption for Businesses</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="font-size:18px;font-weight:600;color:#0f172a;margin:0 0 16px;">
                Hi ${firstName}, your audit report is ready 👋
              </p>
              <p style="font-size:14px;color:#475569;line-height:1.7;margin:0 0 16px;">
                Thank you for your interest in SimplifIQ. We've put together a
                <strong>personalized audit report for ${lead.company}</strong> —
                attached to this email as a PDF.
              </p>
              <p style="font-size:14px;color:#475569;line-height:1.7;margin:0 0 24px;">
                Inside you'll find:
              </p>

              <!-- Feature list -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                ${[
                  ['📊', 'Company overview & key metrics'],
                  ['🔍', 'Digital presence audit'],
                  ['🎯', 'Market positioning analysis'],
                  ['🚀', 'Tailored growth opportunities'],
                  ['💡', 'SimplifIQ recommendations for your business'],
                ].map(([icon, text]) => `
                <tr>
                  <td style="padding:5px 0;font-size:14px;color:#475569;">
                    <span style="margin-right:10px;">${icon}</span>${text}
                  </td>
                </tr>`).join('')}
              </table>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#6366f1;border-radius:8px;">
                    <a href="mailto:${process.env.REPLY_TO || 'hello@simplifiiq.com'}"
                       style="display:inline-block;padding:12px 28px;color:#ffffff;
                              font-size:14px;font-weight:600;text-decoration:none;">
                      Reply to discuss your report →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;">
              <p style="font-size:12px;color:#94a3b8;margin:0;line-height:1.6;">
                You're receiving this because you submitted your details via the SimplifIQ lead form.
                This report was generated automatically based on publicly available information.
                <br/>© ${new Date().getFullYear()} SimplifIQ · All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildPlainText(lead) {
  const firstName = lead.name.split(' ')[0];
  return `Hi ${firstName},

Your personalized audit report for ${lead.company} is attached to this email.

The report includes:
- Company overview & key metrics
- Digital presence audit
- Market positioning analysis  
- Tailored growth opportunities
- SimplifIQ recommendations

Reply to this email if you'd like to discuss the findings.

— The SimplifIQ Team
© ${new Date().getFullYear()} SimplifIQ`;
}

module.exports = { sendReportEmail };
