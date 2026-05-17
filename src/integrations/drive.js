/**
 * integrations/drive.js
 * Bonus: Archives the generated PDF to a Google Drive folder
 * Requires: GOOGLE_SERVICE_ACCOUNT_JSON and GOOGLE_DRIVE_FOLDER_ID in .env
 */
const { google } = require('googleapis');
const { Readable } = require('stream');

async function driveUpload(pdfBuffer, lead, jobId) {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON || !process.env.GOOGLE_DRIVE_FOLDER_ID) {
    console.warn('[Drive] Skipping — GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_DRIVE_FOLDER_ID not set');
    return;
  }

  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });

  const drive = google.drive({ version: 'v3', auth });
  const fileName = `${lead.company.replace(/[^a-zA-Z0-9]/g, '-')}-Audit-${Date.now()}.pdf`;

  const stream = new Readable();
  stream.push(pdfBuffer);
  stream.push(null);

  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      mimeType: 'application/pdf',
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
    },
    media: {
      mimeType: 'application/pdf',
      body: stream,
    },
  });

  console.log(`[Drive] Uploaded ${fileName} — ID: ${res.data.id}`);
  return res.data.id;
}

module.exports = { driveUpload };
