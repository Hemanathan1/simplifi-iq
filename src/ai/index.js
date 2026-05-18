/**
 * ai/index.js
 * Generates personalized audit report using Google Gemini API (free tier)
 */

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
  return htmlMatch ? htmlMatch[1].trim() : raw.trim();
}

function buildPrompt(lead, p) {
  const newsSection = p.recentNews?.length
    ? p.recentNews.map((n) => `- ${n.date}: "${n.title}" (${n.source})`).join('\n')
    : 'No recent news found.';

  const techSection = p.technologies?.length ? p.technologies.join(', ') : 'Not detected';
  const navSection  = p.scraped?.navItems?.length ? p.scraped.navItems.join(', ') : 'Not available';

  return `
You are an elite business analyst. Generate a complete professional HTML audit report for this company.
Output ONLY valid HTML with inline <style> tags. No markdown, no explanations outside HTML.

=== COMPANY INTEL ===
Company:      ${p.name}
Website:      ${p.website}
Industry:     ${p.industry}
Description:  ${p.description || p.scraped?.description || 'Not available'}
Tagline:      ${p.tagline || p.scraped?.tagline || ''}
Hero Heading: ${p.scraped?.heroHeading || ''}
Location:     ${p.location || 'Not available'}
Founded:      ${p.foundedYear || 'Not available'}
Employees:    ${p.employees || 'Not available'}
Tech Stack:   ${techSection}
Nav Items:    ${navSection}

=== PROSPECT ===
Name:    ${lead.name}
Role:    ${lead.role || 'Not specified'}
Email:   ${lead.email}
Message: ${lead.message || 'None'}

=== RECENT NEWS ===
${newsSection}

=== REPORT SECTIONS REQUIRED ===
1. HEADER — Company name, industry badge, date, website
2. EXECUTIVE SUMMARY — 3-4 sentences specific to this company
3. COMPANY OVERVIEW — Key facts in card grid (industry, location, founded, employees)
4. DIGITAL PRESENCE AUDIT — Rate website, tech stack, social media (Strong/Moderate/Needs Attention)
5. MARKET POSITIONING — Where they sit, likely competitors, differentiators
6. GROWTH OPPORTUNITIES — 3 specific actionable opportunities for THIS company
7. RECENT DEVELOPMENTS — News analysis or forward-looking section
8. RECOMMENDATIONS — 3 concrete ways to help this specific company
9. FOOTER — SimplifIQ branding

=== DESIGN ===
- Colors: Deep navy (#0f172a) + electric indigo (#6366f1) + white
- Professional sans-serif fonts
- Cards with shadows, rounded corners
- Color-coded badges for ratings
- A4 PDF optimized layout
- Look like it was designed by a professional agency
`;
}

module.exports = { generateReport };