const htmlPdf = require('html-pdf-node');
const { wrapInTemplate } = require('../ai/template');

async function createPDF(reportHtml, lead) {
  // Clean up any malformed CSS comments that break the PDF renderer
  const cleanHtml = reportHtml
    .replace(/\/\*(?![^*]*\*\/)[^*]*/g, '')  // remove unclosed /* comments
    .replace(/<!--[\s\S]*?-->/g, '');          // remove HTML comments

  const fullHtml = wrapInTemplate(cleanHtml, lead.company);
  const file = { content: fullHtml };
  const options = {
    format: 'A4',
    printBackground: true,
    margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' },
  };

  const pdfBuffer = await htmlPdf.generatePdf(file, options);
  console.log(`[PDF] Generated ${Math.round(pdfBuffer.length / 1024)} KB for ${lead.company}`);
  return pdfBuffer;
}

module.exports = { createPDF };