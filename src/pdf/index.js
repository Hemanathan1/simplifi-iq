const htmlPdf = require('html-pdf-node');

async function createPDF(reportHtml, lead) {
  // Clean problematic CSS
  const cleanHtml = reportHtml
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  const file = { content: cleanHtml };
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