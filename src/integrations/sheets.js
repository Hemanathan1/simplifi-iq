/**
 * integrations/sheets.js
 * Bonus: Logs each lead to a Google Sheet
 * Requires: GOOGLE_SERVICE_ACCOUNT_JSON and GOOGLE_SHEETS_ID in .env
 */
const { google } = require('googleapis');

async function sheetsLog(lead, jobId) {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON || !process.env.GOOGLE_SHEETS_ID) {
    console.warn('[Sheets] Skipping — GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SHEETS_ID not set');
    return;
  }

  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    range: 'Sheet1!A:F',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        new Date().toISOString(),
        lead.name,
        lead.email,
        lead.company,
        lead.companyUrl || '',
        jobId,
        'completed',
      ]],
    },
  });

  console.log(`[Sheets] Logged lead for ${lead.company}`);
}

module.exports = { sheetsLog };
