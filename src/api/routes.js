const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { leadSchema } = require('./validation');
const { processLead } = require('../pipeline');
const { logger } = require('../logger');

const router = express.Router();

const jobStatus = new Map();

router.post('/leads', async (req, res) => {
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

  const lead = parsed.data;
  const jobId = uuidv4();

  res.status(202).json({
    success: true,
    message: `Thanks ${lead.name}! Your personalized report will be sent to ${lead.email} shortly.`,
    jobId,
  });

  jobStatus.set(jobId, { status: 'processing', startedAt: new Date().toISOString() });

  processLead(lead, jobId)
    .then(() => {
      jobStatus.set(jobId, { status: 'completed', completedAt: new Date().toISOString() });
      logger.info(`[${jobId}] Pipeline completed for ${lead.email}`);
    })
    .catch((err) => {
      jobStatus.set(jobId, { status: 'failed', error: err.message, failedAt: new Date().toISOString() });
      logger.error(`[${jobId}] Pipeline failed: ${err.message}`);
    });
});

router.get('/leads/status/:jobId', (req, res) => {
  const job = jobStatus.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json({ jobId: req.params.jobId, ...job });
});

router.get('/leads/test-form', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>SimplifIQ — Free Company Audit Report</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: #f8fafc; color: #1e293b; min-height: 100vh; }
    .page { max-width: 620px; margin: 0 auto; padding: 40px 16px 60px; }
    .logo { display: inline-flex; align-items: center; gap: 10px; margin-bottom: 40px; }
    .logo-icon { width: 38px; height: 38px; background: #6366f1; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .logo-icon i { font-size: 20px; color: white; }
    .logo-text { font-size: 20px; font-weight: 600; color: #0f172a; }
    .hero { margin-bottom: 36px; }
    .hero h1 { font-size: 30px; font-weight: 700; color: #0f172a; line-height: 1.3; margin-bottom: 12px; }
    .hero p { font-size: 15px; color: #64748b; line-height: 1.7; margin-bottom: 20px; }
    .badges { display: flex; gap: 8px; flex-wrap: wrap; }
    .badge { font-size: 12px; padding: 5px 12px; border-radius: 99px; border: 1px solid #e2e8f0; color: #64748b; display: inline-flex; align-items: center; gap: 6px; background: white; }
    .badge i { font-size: 13px; color: #6366f1; }
    .card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group.full { grid-column: 1 / -1; }
    .form-group label { font-size: 13px; font-weight: 600; color: #374151; }
    .required { color: #6366f1; }
    .form-group input, .form-group textarea {
      font-size: 14px; padding: 10px 14px;
      border: 1px solid #e2e8f0; border-radius: 8px;
      background: #f8fafc; color: #1e293b; width: 100%; font-family: inherit;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .form-group input:focus, .form-group textarea:focus {
      outline: none; background: white; border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
    }
    .form-group textarea { resize: vertical; min-height: 88px; }
    .submit-btn {
      width: 100%; padding: 13px; background: #6366f1; color: white;
      border: none; border-radius: 10px; font-size: 15px; font-weight: 600;
      cursor: pointer; margin-top: 20px;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: background 0.15s, transform 0.1s;
    }
    .submit-btn:hover { background: #4f46e5; }
    .submit-btn:active { transform: scale(0.99); }
    .submit-btn:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }
    .response-box { margin-top: 16px; padding: 14px 16px; border-radius: 10px; display: none; font-size: 14px; line-height: 1.6; }
    .response-box.success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
    .response-box.error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
    .features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .feature { padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; background: white; }
    .feature i { font-size: 22px; color: #6366f1; margin-bottom: 10px; display: block; }
    .feature-title { font-size: 13px; font-weight: 600; color: #0f172a; margin-bottom: 4px; }
    .feature-desc { font-size: 12px; color: #64748b; line-height: 1.5; }
    .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #94a3b8; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinning { animation: spin 0.8s linear infinite; display: inline-block; }
    @media (max-width: 480px) {
      .form-grid { grid-template-columns: 1fr; }
      .form-group.full { grid-column: 1; }
      .features { grid-template-columns: 1fr; }
      .hero h1 { font-size: 24px; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="logo">
      <div class="logo-icon"><i class="ti ti-brain"></i></div>
      <span class="logo-text">SimplifIQ</span>
    </div>
    <div class="hero">
      <h1>Get your free AI-powered<br/>company audit report</h1>
      <p>Fill in your details and receive a personalized, professionally crafted audit report delivered straight to your inbox in under 60 seconds.</p>
      <div class="badges">
        <span class="badge"><i class="ti ti-bolt"></i>AI-generated</span>
        <span class="badge"><i class="ti ti-file-text"></i>PDF report</span>
        <span class="badge"><i class="ti ti-clock"></i>Under 60 seconds</span>
        <span class="badge"><i class="ti ti-lock"></i>Free forever</span>
      </div>
    </div>
    <div class="card">
      <div class="form-grid">
        <div class="form-group">
          <label>Full name <span class="required">*</span></label>
          <input id="name" type="text" placeholder="Jane Smith"/>
        </div>
        <div class="form-group">
          <label>Work email <span class="required">*</span></label>
          <input id="email" type="email" placeholder="jane@acme.com"/>
        </div>
        <div class="form-group">
          <label>Company name <span class="required">*</span></label>
          <input id="company" placeholder="Acme Corp"/>
        </div>
        <div class="form-group">
          <label>Company website</label>
          <input id="companyUrl" placeholder="https://acme.com"/>
        </div>
        <div class="form-group">
          <label>Industry</label>
          <input id="industry" placeholder="SaaS / Fintech / Consulting"/>
        </div>
        <div class="form-group">
          <label>Your role</label>
          <input id="role" placeholder="CEO / Head of Sales"/>
        </div>
        <div class="form-group full">
          <label>What challenge can we help with?</label>
          <textarea id="message" placeholder="Tell us about your biggest business challenge (optional)..."></textarea>
        </div>
      </div>
      <button class="submit-btn" onclick="submitLead()" id="submitBtn">
        <i class="ti ti-send"></i>
        Get my free audit report
      </button>
      <div class="response-box" id="response"></div>
    </div>
    <div class="features">
      <div class="feature">
        <i class="ti ti-search"></i>
        <div class="feature-title">Deep research</div>
        <div class="feature-desc">We scrape your website and enrich with public data sources automatically</div>
      </div>
      <div class="feature">
        <i class="ti ti-chart-bar"></i>
        <div class="feature-title">9-section report</div>
        <div class="feature-desc">Market positioning, growth opportunities, digital audit and more</div>
      </div>
      <div class="feature">
        <i class="ti ti-mail"></i>
        <div class="feature-title">Instant delivery</div>
        <div class="feature-desc">Professional PDF sent directly to your inbox automatically</div>
      </div>
    </div>
    <div class="footer">© ${new Date().getFullYear()} SimplifIQ · Simplifying AI Adoption for Businesses</div>
  </div>
  <script>
    async function submitLead() {
      const btn = document.getElementById('submitBtn');
      const res = document.getElementById('response');
      const body = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        company: document.getElementById('company').value,
        companyUrl: document.getElementById('companyUrl').value,
        industry: document.getElementById('industry').value,
        role: document.getElementById('role').value,
        message: document.getElementById('message').value,
      };
      btn.disabled = true;
      btn.innerHTML = '<i class="ti ti-loader-2 spinning"></i> Generating your report...';
      try {
        const r = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await r.json();
        res.style.display = 'block';
        if (r.ok) {
          res.className = 'response-box success';
          res.innerHTML = '<strong>Report on its way!</strong> ' + data.message + '<br><small style="opacity:0.7">Job ID: ' + data.jobId + '</small>';
          btn.innerHTML = '<i class="ti ti-check"></i> Report sent!';
          btn.style.background = '#16a34a';
        } else {
          res.className = 'response-box error';
          res.innerHTML = data.issues ? data.issues.map(i => i.field + ': ' + i.message).join('<br>') : data.error;
          btn.disabled = false;
          btn.innerHTML = '<i class="ti ti-send"></i> Get my free audit report';
        }
      } catch(e) {
        res.style.display = 'block';
        res.className = 'response-box error';
        res.innerHTML = 'Something went wrong. Make sure the server is running.';
        btn.disabled = false;
        btn.innerHTML = '<i class="ti ti-send"></i> Get my free audit report';
      }
    }
  </script>
</body>
</html>`);
});

module.exports = router;