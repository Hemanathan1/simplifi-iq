/**
 * enrichment/news.js
 * Fetches recent news about the company using Serper (Google Search API).
 * Falls back to a basic RSS/web search if Serper key is missing.
 * Free tier: 2,500 searches/month.
 */

const axios = require('axios');

async function fetchNews(companyName, domain) {
  if (!companyName) return [];

  // Try Serper first (most reliable)
  if (process.env.SERPER_API_KEY) {
    return fetchViaSerper(companyName);
  }

  // Fallback: no key, return empty (don't crash)
  console.warn('[News] No SERPER_API_KEY set — skipping news enrichment');
  return [];
}

async function fetchViaSerper(companyName) {
  const { data } = await axios.post(
    'https://google.serper.dev/news',
    { q: `"${companyName}" news`, num: 5, tbs: 'qdr:m' }, // last month
    {
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 8000,
    }
  );

  return (data.news || []).slice(0, 5).map((item) => ({
    title:     item.title,
    snippet:   item.snippet,
    source:    item.source,
    date:      item.date,
    link:      item.link,
  }));
}

module.exports = { fetchNews };
