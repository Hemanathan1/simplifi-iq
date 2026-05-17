# SimplifIQ — Automated Lead Audit System

Automates the full lead intake → company enrichment → AI report → PDF → email workflow.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
copy .env.example .env
# Then open .env and fill in your API keys

# 3. Start the server
npm run dev
```

Open **http://localhost:3000/api/leads/test-form** to submit a test lead.

## Environment Variables

Open `.env` and fill in:

```
ANTHROPIC_API_KEY=        ← Required (get from console.anthropic.com)
SMTP_HOST=smtp.gmail.com  ← Required for email
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your_app_password
```

Everything else (Clearbit, Hunter, Serper, Google) is optional — the system works without them.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/leads` | Submit a lead (triggers full pipeline) |
| `POST` | `/api/leads/preview` | Preview PDF in browser (no email sent) |
| `GET`  | `/api/leads/status/:jobId` | Check pipeline job status |
| `GET`  | `/api/leads/test-form` | Browser test form |
| `GET`  | `/health` | Health check |

## Project Structure

```
simplifiiq/
├── src/
│   ├── index.js              # Express server entry point
│   ├── pipeline.js           # Orchestrates all modules
│   ├── api/
│   │   ├── routes.js         # Express routes
│   │   └── validation.js     # Zod input validation
│   ├── enrichment/
│   │   ├── index.js          # Enrichment orchestrator
│   │   ├── scraper.js        # Cheerio web scraper
│   │   ├── clearbit.js       # Clearbit API
│   │   ├── hunter.js         # Hunter.io API
│   │   └── news.js           # Serper news API
│   ├── ai/
│   │   ├── index.js          # Claude API report generator
│   │   └── template.js       # HTML/CSS report shell
│   ├── pdf/
│   │   ├── index.js          # Puppeteer PDF renderer
│   │   └── preview.js        # Browser preview endpoint
│   ├── email/
│   │   └── index.js          # Nodemailer email delivery
│   └── integrations/
│       ├── sheets.js         # Google Sheets logger (bonus)
│       └── drive.js          # Google Drive archiver (bonus)
├── .env.example
├── .gitignore
└── package.json
```

## Pipeline Flow

```
POST /api/leads
  → Validate input (Zod)
  → 202 Accepted (instant response to user)
  → enrichCompany()     scrape website + APIs
  → generateReport()    Claude AI writes personalized report
  → createPDF()         Puppeteer renders HTML → PDF
  → sendReportEmail()   Nodemailer sends PDF to prospect
  → sheetsLog()         Google Sheets log (bonus)
  → driveUpload()       Google Drive archive (bonus)
```
