/**
 * pdf/index.js
 * Converts the AI-generated HTML report into a professional PDF
 * using Puppeteer (headless Chrome).
 *
 * Why Puppeteer over pdfkit?
 *  - Full CSS support (gradients, flexbox, grid, custom fonts)
 *  - Pixel-perfect rendering of the styled HTML report
 *  - Native @page / @media print support
 */

const puppeteer = require('puppeteer');
const { wrapInTemplate } = require('../ai/template');

async function createPDF(reportHtml, lead) {
  // Wrap raw HTML body in full page template with styles
  const fullHtml = wrapInTemplate(reportHtml, lead.company);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // prevents crashes in low-memory envs
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();

    // Set content and wait for all network resources + fonts to load
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

    // Inject Google Fonts for polished typography
    await page.addStyleTag({
      url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    }).catch(() => {}); // fail silently if offline

    // Small pause to let fonts render
    await new Promise((r) => setTimeout(r, 500));

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,   // renders background colors/gradients
      margin: {
        top:    '16mm',
        bottom: '16mm',
        left:   '14mm',
        right:  '14mm',
      },
      displayHeaderFooter: true,
      headerTemplate: `<div></div>`,
      footerTemplate: `
        <div style="font-size:9px;color:#94a3b8;width:100%;text-align:center;padding:0 14mm;">
          SimplifIQ Confidential &nbsp;·&nbsp; Generated for ${escapeHtml(lead.company)}
          &nbsp;·&nbsp;
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>`,
    });

    console.log(`[PDF] Generated ${Math.round(pdfBuffer.length / 1024)} KB for ${lead.company}`);
    return pdfBuffer;

  } finally {
    if (browser) await browser.close();
  }
}

function escapeHtml(str) {
  return (str || '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

module.exports = { createPDF };
