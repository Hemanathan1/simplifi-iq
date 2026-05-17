/**
 * pipeline.js
 * Orchestrates the full lead automation workflow:
 * 1. Enrich company data
 * 2. Generate AI report
 * 3. Create PDF
 * 4. Send email
 * 5. [Bonus] Log to Sheets + archive to Drive
 */

const { enrichCompany } = require('./enrichment');
const { generateReport } = require('./ai');
const { createPDF } = require('./pdf');
const { sendReportEmail } = require('./email');

// Bonus integrations (won't crash if not configured)
let sheetsLog, driveUpload;
try {
  ({ sheetsLog } = require('./integrations/sheets'));
  ({ driveUpload } = require('./integrations/drive'));
} catch (_) {}

async function processLead(lead, jobId) {
  console.log(`[${jobId}] ▶ Starting pipeline for ${lead.company}`);

  // Step 1 — Enrich
  console.log(`[${jobId}] 1/4 Enriching company data…`);
  const companyProfile = await enrichCompany(lead);

  // Step 2 — AI report
  console.log(`[${jobId}] 2/4 Generating AI report…`);
  const reportHtml = await generateReport(lead, companyProfile);

  // Step 3 — PDF
  console.log(`[${jobId}] 3/4 Creating PDF…`);
  const pdfBuffer = await createPDF(reportHtml, lead);

  // Step 4 — Email
  console.log(`[${jobId}] 4/4 Sending email to ${lead.email}…`);
  await sendReportEmail(lead, pdfBuffer);

  // Bonus — Sheets + Drive (best-effort, non-blocking)
  const bonusPromises = [];
  if (sheetsLog) bonusPromises.push(sheetsLog(lead, jobId).catch(console.warn));
  if (driveUpload) bonusPromises.push(driveUpload(pdfBuffer, lead, jobId).catch(console.warn));
  await Promise.allSettled(bonusPromises);

  console.log(`[${jobId}] ✓ Pipeline complete`);
}

module.exports = { processLead };
