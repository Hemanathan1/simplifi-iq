const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { leadSchema } = require('./validation');
const { processLead } = require('../pipeline');
const { logger } = require('../index');

const router = express.Router();

// In-memory job status tracker (use Redis in production)
const jobStatus = new Map();

/**
 * POST /api/leads
 * Main lead intake endpoint - validates, acknowledges, and kicks off async pipeline
 */
router.post('/leads', async (req, res) => {
  // 1. Validate input
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

  // 2. Acknowledge immediately — don't make the form wait
  res.status(202).json({
    success: true,
    message: `Thanks ${lead.name}! Your personalized report will be sent to ${lead.email} shortly.`,
    jobId,
  });

  // 3. Fire off the async pipeline (non-blocking)
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

/**
 * GET /api/leads/status/:jobId
 * Check the status of a submitted lead job
 */
router.get('/leads/status/:jobId', (req, res) => {
  const job = jobStatus.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  res.json({ jobId: req.params.jobId, ...job });
});

/**
 * GET /api/leads/test-form
 * Simple HTML form for testing without a real frontend
 */
router.get('/leads/test-form', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>SimplifIQ Lead Form</title>
      <style>
        body { font-family: sans-serif; max-width: 480px; margin: 60px auto; padding: 0 20px; }
        input, textarea, select { width: 100%; padding: 8px; margin: 6px 0 16px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 6px; }
        button { background: #5348b7; color: white; padding: 10px 24px; border: none; border-radius: 6px; cursor: pointer; font-size: 15px; }
        label { font-weight: 500; font-size: 14px; }
        #response { margin-top: 20px; padding: 12px; border-radius: 6px; display: none; }
        .success { background: #e1f5ee; color: #0f6e56; }
        .error   { background: #faece7; color: #993c1d; }
      </style>
    </head>
    <body>
      <h2>SimplifIQ — Lead Intake</h2>
      <p style="color:#666;font-size:14px">Fill in your details and receive a personalized company audit report.</p>
      <label>Full name *</label>
      <input id="name" placeholder="Jane Smith" />
      <label>Work email *</label>
      <input id="email" type="email" placeholder="jane@acme.com" />
      <label>Company name *</label>
      <input id="company" placeholder="Acme Corp" />
      <label>Company website</label>
      <input id="companyUrl" placeholder="https://acme.com" />
      <label>Industry</label>
      <input id="industry" placeholder="SaaS / Fintech / Consulting …" />
      <label>Your role</label>
      <input id="role" placeholder="CEO / Head of Sales …" />
      <label>What challenge can we help with?</label>
      <textarea id="message" rows="3" placeholder="Optional…"></textarea>
      <button onclick="submitLead()">Get my free audit report →</button>
      <div id="response"></div>
      <script>
        async function submitLead() {
          const body = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            company: document.getElementById('company').value,
            companyUrl: document.getElementById('companyUrl').value,
            industry: document.getElementById('industry').value,
            role: document.getElementById('role').value,
            message: document.getElementById('message').value,
          };
          const r = await fetch('/api/leads', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
          const data = await r.json();
          const el = document.getElementById('response');
          el.style.display = 'block';
          if (r.ok) {
            el.className = 'success';
            el.innerHTML = '✓ ' + data.message + '<br><small>Job ID: ' + data.jobId + '</small>';
          } else {
            el.className = 'error';
            el.innerHTML = '✗ ' + (data.issues ? data.issues.map(i => i.field + ': ' + i.message).join('<br>') : data.error);
          }
        }
      </script>
    </body>
    </html>
  `);
});

module.exports = router;
