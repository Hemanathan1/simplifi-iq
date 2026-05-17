/**
 * ai/index.js
 * Sends enriched company profile to Claude and gets back
 * a fully structured HTML audit report.
 */

const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function generateReport(lead, profile) {
  const prompt = buildPrompt(lead, profile);

  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 4096,
    system: getSystemPrompt(),
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = message.content[0].text;

  // Extract HTML block if Claude wrapped it in ```html ... ```
  const htmlMatch = raw.match(/```html\s*([\s\S]*?)```/i);
  return htmlMatch ? htmlMatch[1].trim() : raw.trim();
}

// ── System prompt ─────────────────────────────────────────────────────────────

function getSystemPrompt() {
  return `You are an elite business analyst at a top-tier consulting firm.
Your job is to generate a highly personalized, professional company audit report in HTML format.

Rules:
- Output ONLY valid HTML (no markdown, no explanations outside the HTML)
- The report must feel hand-crafted for this specific company — never generic
- Use the data provided; if a field is missing, make a smart inference or skip that section
- Every section must reference specific details about the company
- Tone: authoritative, insightful, forward-looking — like McKinsey meets a smart startup advisor
- The HTML should be self-contained with inline <style> for beautiful PDF rendering`;
}

// ── User prompt ───────────────────────────────────────────────────────────────

function buildPrompt(lead, p) {
  const newsSection = p.recentNews?.length
    ? p.recentNews.map((n) => `- ${n.date}: "${n.title}" (${n.source})\n  ${n.snippet}`).join('\n')
    : 'No recent news found.';

  const techSection = p.technologies?.length
    ? p.technologies.join(', ')
    : 'Not detected';

  const navSection = p.scraped?.navItems?.length
    ? p.scraped.navItems.join(', ')
    : 'Not available';

  return `
Generate a complete, professional HTML audit report for the following company.
The report will be converted to PDF and sent directly to the prospect as their first touchpoint with SimplifIQ.

=== COMPANY INTEL ===
Company Name:     ${p.name}
Website:          ${p.website}
Industry:         ${p.industry}
Description:      ${p.description || p.scraped?.description || 'Not available'}
Tagline:          ${p.tagline || p.scraped?.tagline || ''}
Hero Heading:     ${p.scraped?.heroHeading || ''}
About/Mission:    ${p.scraped?.aboutText || 'Not available'}
Location:         ${p.location || 'Not available'}
Founded:          ${p.foundedYear || 'Not available'}
Employees:        ${p.employees || 'Not available'}
LinkedIn:         ${p.socialLinks?.linkedin || 'Not found'}
Twitter:          ${p.socialLinks?.twitter || 'Not found'}
Tech Stack:       ${techSection}
Nav/Products:     ${navSection}

=== CONTACT INTEL ===
Prospect Name:    ${lead.name}
Prospect Role:    ${lead.role || 'Not specified'}
Prospect Email:   ${lead.email}
Their Message:    ${lead.message || 'None provided'}

=== RECENT NEWS ===
${newsSection}

=== REPORT REQUIREMENTS ===
Generate a visually stunning HTML report with these exact sections:

1. HEADER — Company name, industry badge, website, date. Clean and professional.

2. EXECUTIVE SUMMARY — 3-4 sentences that show you deeply understand this company.
   Reference their specific product/service, positioning, and market context.

3. COMPANY OVERVIEW — Key facts in a visual card grid:
   Industry, Location, Founded, Team Size, Website

4. DIGITAL PRESENCE AUDIT — Analyze their:
   - Website effectiveness (based on description/tagline/hero)
   - Tech stack assessment (what it reveals about their maturity)
   - Social media presence
   Rate each area: Strong / Moderate / Needs Attention (with color badges)

5. MARKET POSITIONING — Where they sit in their market, who their likely competitors are,
   what differentiates them. Be specific to their industry.

6. GROWTH OPPORTUNITIES — 3 specific, actionable opportunities tailored to their business.
   Each with: opportunity title, why it matters for THEM, recommended first step.

7. RECENT DEVELOPMENTS — Summarize the news items with brief analysis of what they mean
   for the company's trajectory. If no news, write a forward-looking section instead.

8. SIMPLIFIIQ RECOMMENDATIONS — 3 ways SimplifIQ can specifically help THIS company
   based on their profile. Be concrete and relevant to their industry/size.

9. FOOTER — SimplifIQ branding, contact info, disclaimer.

=== DESIGN REQUIREMENTS ===
- Color scheme: Deep navy (#0f172a) + electric indigo (#6366f1) + white
- Use a professional sans-serif font stack
- Cards with subtle shadows and rounded corners
- Color-coded badges/pills for ratings and categories
- Clean data tables or grids for factual information
- Section dividers
- The report should look like it was designed by a professional agency
- Optimized for A4 PDF rendering (avoid page-break issues)
`;
}

module.exports = { generateReport };
