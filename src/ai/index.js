const axios = require('axios');

async function generateReport(lead, profile) {
  const prompt = buildPrompt(lead, profile);

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 4096, temperature: 0.7 },
    },
    { timeout: 60000 }
  );

  const raw = response.data.candidates[0].content.parts[0].text;

  // Extract HTML block if wrapped in ```html ... ```
  const htmlMatch = raw.match(/```html\s*([\s\S]*?)```/i);
  const html = htmlMatch ? htmlMatch[1].trim() : raw.trim();

  // If response doesn't contain HTML tags, wrap it
  if (!html.includes('<')) {
    return `<div style="font-family:sans-serif;padding:40px;">
      <h1>${lead.company} — Audit Report</h1>
      <pre style="white-space:pre-wrap;">${html}</pre>
    </div>`;
  }

  return html;
}

function buildPrompt(lead, p) {
  const techSection = p.technologies?.length ? p.technologies.join(', ') : 'Not detected';
  const navSection  = p.scraped?.navItems?.length ? p.scraped.navItems.join(', ') : 'Not available';
  const newsSection = p.recentNews?.length
    ? p.recentNews.map((n) => `- "${n.title}" (${n.source})`).join('\n')
    : 'No recent news found.';

  return `You are an elite business analyst. Generate a complete professional HTML audit report.

CRITICAL RULES:
- Output ONLY a complete HTML document starting with <!DOCTYPE html>
- Include ALL styles inline inside a <style> tag in <head>
- Do NOT use CSS comments (no /* */ anywhere)
- Do NOT use markdown, backticks, or any text outside the HTML
- Make it visually stunning and professional

COMPANY DATA:
- Company: ${p.name}
- Website: ${p.website}
- Industry: ${p.industry}
- Description: ${p.description || p.scraped?.description || 'Not available'}
- Tagline: ${p.tagline || ''}
- Hero: ${p.scraped?.heroHeading || ''}
- Location: ${p.location || 'Not available'}
- Founded: ${p.foundedYear || 'Not available'}
- Employees: ${p.employees || 'Not available'}
- Tech Stack: ${techSection}
- Products/Nav: ${navSection}

PROSPECT:
- Name: ${lead.name}
- Role: ${lead.role || 'Not specified'}
- Email: ${lead.email}
- Message: ${lead.message || 'None'}

NEWS:
${newsSection}

Generate a complete HTML report with these sections:
1. Header with company name, industry badge, date
2. Executive Summary (3-4 sentences specific to ${p.name})
3. Company Overview (cards: industry, location, founded, employees, website)
4. Digital Presence Audit (rate website/tech/social as Strong/Moderate/Needs Attention)
5. Market Positioning (competitors, differentiators)
6. Growth Opportunities (3 specific opportunities for ${p.name})
7. Recent Developments (news or forward-looking analysis)
8. SimplifIQ Recommendations (3 concrete ways to help ${p.name})
9. Footer with SimplifIQ branding

DESIGN:
- Navy (#0f172a) + indigo (#6366f1) + white color scheme
- Professional cards with borders and padding
- Colored badges for ratings
- Clean typography
- Looks like a McKinsey consulting report
- NO CSS comments anywhere in the style tag`;
}

module.exports = { generateReport };