# SimplifIQ — Automated Lead Audit System

An end-to-end lead automation system that captures prospect information, enriches company data, generates a personalized AI-powered audit report, and delivers it via email — all without human intervention.

## 🚀 Live Demo Flow

```
Prospect fills form
  → Company data enriched (web scraping + APIs)
  → Personalized audit report generated (Gemini AI)
  → Professional PDF created
  → Report emailed to prospect
  → Lead logged to AWS DynamoDB
  → PDF archived to AWS S3
```

## ⚙️ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
copy .env.example .env
# Fill in your API keys (see below)

# 3. Start the server
npm run dev
```

Open **http://localhost:3000/api/leads/test-form** to submit a test lead.

## 🔑 Environment Variables

```env
# Required
GEMINI_API_KEY=           # Get free at aistudio.google.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your_gmail_app_password
EMAIL_FROM=SimplifIQ <you@gmail.com>

# Optional enrichment APIs (system works without these)
CLEARBIT_API_KEY=
HUNTER_API_KEY=
SERPER_API_KEY=

# Bonus — AWS integrations
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1
AWS_S3_BUCKET=simplifiiq-reports
AWS_DYNAMODB_TABLE=simplifiiq-leads
```

## 📡 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/leads` | Submit a lead — triggers full pipeline |
| `POST` | `/api/leads/preview` | Preview PDF in browser (no email sent) |
| `GET`  | `/api/leads/status/:jobId` | Poll pipeline job status |
| `GET`  | `/api/leads/test-form` | Browser test form |
| `GET`  | `/health` | Health check |

## 🏗️ Architecture

```
POST /api/leads
  │
  ├── Validate input (Zod schema)
  ├── Return 202 Accepted instantly
  │
  └── Async pipeline:
       ├── 1. enrichCompany()
       │     ├── scrapeWebsite()     Cheerio scrapes homepage
       │     ├── fetchClearbit()     Company data API
       │     ├── fetchHunter()       Email pattern discovery
       │     └── fetchNews()         Serper news search
       │
       ├── 2. generateReport()       Gemini AI — personalized HTML report
       │
       ├── 3. createPDF()            html-pdf-node — renders HTML to PDF
       │
       ├── 4. sendReportEmail()      Nodemailer — sends PDF to prospect
       │
       ├── 5. sheetsLog()  ★ BONUS   AWS DynamoDB — logs lead data
       │
       └── 6. driveUpload() ★ BONUS  AWS S3 — archives PDF
```

## 📁 Project Structure

```
src/
├── index.js              Express server entry point
├── logger.js             Winston logger (shared)
├── pipeline.js           Pipeline orchestrator
├── api/
│   ├── routes.js         Express routes + test form
│   └── validation.js     Zod input validation
├── enrichment/
│   ├── index.js          Enrichment orchestrator (parallel)
│   ├── scraper.js        Cheerio website scraper
│   ├── clearbit.js       Clearbit company API
│   ├── hunter.js         Hunter.io email API
│   └── news.js           Serper news API
├── ai/
│   ├── index.js          Gemini AI report generator
│   └── template.js       HTML/CSS report shell
├── pdf/
│   ├── index.js          PDF generation (html-pdf-node)
│   └── preview.js        Browser PDF preview endpoint
├── email/
│   └── index.js          Nodemailer email delivery
└── integrations/
    ├── sheets.js          AWS DynamoDB lead logger ★ BONUS
    └── drive.js           AWS S3 PDF archiver ★ BONUS
```

## ✅ Features

### Core (Required)
- **Lead Intake** — Express API with Zod validation, instant 202 response
- **Company Enrichment** — Parallel scraping + Clearbit + Hunter + news APIs
- **AI Report Generation** — Google Gemini generates 9-section personalized audit
- **PDF Creation** — Professional A4 PDF with company-specific content
- **Email Delivery** — Branded HTML email with PDF attachment via Nodemailer

### Bonus
- **AWS DynamoDB** — Every lead logged with timestamp, company, status
- **AWS S3** — PDF archived to `simplifiiq-reports` bucket under `reports/`

## 🧠 Design Decisions

- **202 Accepted pattern** — Form gets instant response; pipeline runs async so users never wait
- **Parallel enrichment** — All data sources run simultaneously with `Promise.all()`
- **Graceful degradation** — Every enrichment source wrapped in `safeRun()` — failures don't crash the pipeline
- **Gemini AI (free)** — Generates highly personalized 9-section HTML audit reports
- **html-pdf-node** — Chosen over Puppeteer for Windows compatibility
- **Bonus best-effort** — S3/DynamoDB wrapped in `Promise.allSettled()` — bonus failures never affect core flow

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Server | Node.js + Express |
| Validation | Zod |
| Scraping | Axios + Cheerio |
| AI | Google Gemini 2.5 Flash |
| PDF | html-pdf-node |
| Email | Nodemailer (Gmail SMTP) |
| Logging | Winston |
| DB (Bonus) | AWS DynamoDB |
| Storage (Bonus) | AWS S3 |