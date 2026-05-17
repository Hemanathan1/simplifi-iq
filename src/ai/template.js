/**
 * ai/template.js
 * Wraps Claude's generated HTML content in a full-page shell
 * with consistent fonts, reset styles, and PDF-safe layout.
 */

function wrapInTemplate(bodyHtml, companyName) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${companyName} — Company Audit Report | SimplifIQ</title>
  <style>
    /* ── Reset & base ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { font-size: 15px; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: #ffffff;
      color: #1e293b;
      line-height: 1.6;
      padding: 0;
    }

    /* ── PDF page setup ── */
    @page {
      size: A4;
      margin: 16mm 14mm;
    }
    @media print {
      .no-break { page-break-inside: avoid; }
    }

    /* ── Layout ── */
    .page { max-width: 780px; margin: 0 auto; padding: 40px 32px; }

    /* ── Typography ── */
    h1 { font-size: 2rem; font-weight: 700; color: #0f172a; }
    h2 { font-size: 1.25rem; font-weight: 600; color: #0f172a; margin-bottom: 12px; }
    h3 { font-size: 1rem; font-weight: 600; color: #334155; margin-bottom: 8px; }
    p  { color: #475569; margin-bottom: 10px; font-size: 0.93rem; }

    /* ── Section ── */
    .section {
      margin-bottom: 36px;
      padding-bottom: 24px;
      border-bottom: 1px solid #e2e8f0;
      page-break-inside: avoid;
    }
    .section:last-child { border-bottom: none; }
    .section-label {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #6366f1;
      margin-bottom: 6px;
    }

    /* ── Cards grid ── */
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
      margin-top: 12px;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px 16px;
    }
    .card-label { font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; }
    .card-value { font-size: 0.95rem; font-weight: 600; color: #0f172a; margin-top: 4px; }

    /* ── Badges ── */
    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 99px;
      font-size: 0.72rem;
      font-weight: 600;
    }
    .badge-strong   { background: #dcfce7; color: #166534; }
    .badge-moderate { background: #fef9c3; color: #854d0e; }
    .badge-attention{ background: #fee2e2; color: #991b1b; }
    .badge-industry { background: #ede9fe; color: #5b21b6; }
    .badge-info     { background: #e0f2fe; color: #075985; }

    /* ── Opportunity cards ── */
    .opportunity {
      background: #f8fafc;
      border-left: 3px solid #6366f1;
      border-radius: 0 8px 8px 0;
      padding: 14px 18px;
      margin-bottom: 12px;
    }
    .opportunity h3 { color: #4f46e5; }

    /* ── News items ── */
    .news-item {
      padding: 12px 0;
      border-bottom: 1px solid #f1f5f9;
    }
    .news-item:last-child { border-bottom: none; }
    .news-meta { font-size: 0.75rem; color: #94a3b8; }

    /* ── Audit rows ── */
    .audit-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #f1f5f9;
    }
    .audit-row:last-child { border-bottom: none; }
    .audit-label { font-size: 0.88rem; color: #334155; font-weight: 500; }
    .audit-detail { font-size: 0.82rem; color: #64748b; max-width: 360px; }

    /* ── Recommendation cards ── */
    .rec-card {
      border: 1px solid #c7d2fe;
      border-radius: 10px;
      padding: 16px 20px;
      margin-bottom: 12px;
      background: #fafafe;
    }
    .rec-number {
      width: 26px; height: 26px;
      background: #6366f1; color: white;
      border-radius: 50%;
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 0.8rem; font-weight: 700;
      margin-bottom: 8px;
    }

    /* ── Header block ── */
    .report-header {
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
      color: white;
      padding: 36px 40px;
      border-radius: 14px;
      margin-bottom: 36px;
    }
    .report-header h1 { color: white; font-size: 1.8rem; }
    .report-header .subtitle { color: #a5b4fc; font-size: 0.88rem; margin-top: 6px; }
    .report-header .meta { margin-top: 20px; display: flex; gap: 24px; flex-wrap: wrap; }
    .report-header .meta-item { font-size: 0.8rem; color: #cbd5e1; }
    .report-header .meta-item strong { color: white; display: block; }

    /* ── Footer ── */
    .report-footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 0.75rem;
      color: #94a3b8;
    }
    .footer-brand { font-weight: 700; color: #6366f1; font-size: 1rem; }
  </style>
</head>
<body>
  <div class="page">
    ${bodyHtml}
  </div>
</body>
</html>`;
}

module.exports = { wrapInTemplate };
