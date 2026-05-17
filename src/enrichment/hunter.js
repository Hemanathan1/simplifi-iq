/**
 * enrichment/hunter.js
 * Uses Hunter.io Domain Search API to find:
 *  - Email format pattern (e.g. {first}.{last}@company.com)
 *  - Number of emails found
 *  - Key contacts (names + roles)
 * Free tier: 25 searches/month.
 */

const axios = require('axios');

async function fetchHunter(domain) {
  if (!process.env.HUNTER_API_KEY || !domain) return null;

  const { data } = await axios.get('https://api.hunter.io/v2/domain-search', {
    params: {
      domain,
      api_key: process.env.HUNTER_API_KEY,
      limit: 5,
    },
    timeout: 8000,
  });

  const d = data.data;
  return {
    pattern:    d.pattern,          // e.g. "{first}.{last}"
    confidence: d.pattern_probability,
    emailCount: d.emails?.length || 0,
    contacts: (d.emails || []).slice(0, 3).map((e) => ({
      name:       `${e.first_name || ''} ${e.last_name || ''}`.trim(),
      email:      e.value,
      role:       e.position,
      seniority:  e.seniority,
    })),
    organization: d.organization,
  };
}

module.exports = { fetchHunter };
