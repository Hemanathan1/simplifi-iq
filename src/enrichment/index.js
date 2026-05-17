/**
 * enrichment/index.js
 * Runs all enrichment sources in parallel and merges into one company profile.
 */

const { scrapeWebsite } = require('./scraper');
const { fetchClearbit } = require('./clearbit');
const { fetchHunter } = require('./hunter');
const { fetchNews } = require('./news');

async function enrichCompany(lead) {
  const domain = extractDomain(lead.companyUrl || lead.email);
  console.log(`[Enrichment] Starting for domain: ${domain}`);

  const [scraped, clearbit, hunter, news] = await Promise.all([
    safeRun('scraper',  () => scrapeWebsite(lead.companyUrl)),
    safeRun('clearbit', () => fetchClearbit(domain)),
    safeRun('hunter',   () => fetchHunter(domain)),
    safeRun('news',     () => fetchNews(lead.company, domain)),
  ]);

  const profile = {
    name:        lead.company,
    website:     lead.companyUrl || '',
    domain,
    industry:    lead.industry || clearbit?.category?.industry || scraped?.industry || 'Unknown',
    description: clearbit?.description || scraped?.description || '',
    tagline:     scraped?.tagline || '',
    employees:   clearbit?.metrics?.employees || null,
    location:    clearbit?.geo?.city
                   ? `${clearbit.geo.city}, ${clearbit.geo.country}`
                   : scraped?.location || '',
    foundedYear: clearbit?.foundedYear || null,
    socialLinks: {
      linkedin: clearbit?.linkedin?.handle
                  ? `https://linkedin.com/company/${clearbit.linkedin.handle}`
                  : scraped?.linkedin || '',
      twitter:  clearbit?.twitter?.handle
                  ? `https://twitter.com/${clearbit.twitter.handle}`
                  : scraped?.twitter || '',
    },
    technologies:    clearbit?.tech || scraped?.technologies || [],
    emailPattern:    hunter?.pattern || '',
    emailConfidence: hunter?.confidence || null,
    recentNews:      news || [],
    scraped:         scraped || {},
  };

  console.log(`[Enrichment] Complete for ${lead.company}`);
  return profile;
}

function extractDomain(urlOrEmail) {
  if (!urlOrEmail) return '';
  try {
    if (urlOrEmail.includes('@')) return urlOrEmail.split('@')[1];
    return new URL(urlOrEmail).hostname.replace(/^www\./, '');
  } catch {
    return urlOrEmail.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  }
}

async function safeRun(label, fn) {
  try {
    return await fn();
  } catch (err) {
    console.warn(`[Enrichment] ${label} failed: ${err.message}`);
    return null;
  }
}

module.exports = { enrichCompany };
