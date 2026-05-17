/**
 * pdf/preview.js
 * Adds a /api/leads/preview endpoint for testing PDF output
 * in the browser without sending an email.
 *
 * Usage:
 *   POST /api/leads/preview
 *   Body: same as /api/leads (name, email, company, companyUrl, ...)
 *   Response: PDF file (inline in browser)
 */

const express = require('express');
const { leadSchema } = require('../api/validation');
const { enrichCompany } = require('../enrichment');
const { generateReport } = require('../ai');
const { createPDF } = require('./index');

const router = express.Router();

router.post('/leads/preview', async (req, res) => {
  const parsed = leadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Validation failed',
      issues: parsed.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      })),
    });
  }

  try {
    const lead = parsed.data;
    console.log(`[Preview] Generating PDF preview for ${lead.company}…`);

    const profile    = await enrichCompany(lead);
    const reportHtml = await generateReport(lead, profile);
    const pdfBuffer  = await createPDF(reportHtml, lead);

    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `inline; filename="${lead.company}-audit.pdf"`,
      'Content-Length':      pdfBuffer.length,
    });
    res.end(pdfBuffer);

  } catch (err) {
    console.error('[Preview] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
