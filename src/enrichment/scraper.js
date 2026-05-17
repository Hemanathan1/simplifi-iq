/**
 * enrichment/scraper.js
 * Scrapes a company website using axios + Cheerio.
 * Extracts: description, tagline, industry hints, social links, tech stack clues.
 * Cheerio is used (not Puppeteer) for speed — Puppeteer is reserved for PDF generation.
 */

const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeWebsite(url) {
  if (!url) return null;

  const fullUrl = url.startsWith('http') ? url : `https://${url}`;

  const { data: html } = await axios.get(fullUrl, {
    timeout: 10000,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; SimplifIQ-bot/1.0; +https://simplifiiq.com)',
    },
    maxRedirects: 5,
  });

  const $ = cheerio.load(html);

  // ── Meta description ─────────────────────────────────────────────────────
  const description =
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    '';

  // ── Page title / tagline ─────────────────────────────────────────────────
  const tagline =
    $('meta[property="og:title"]').attr('content') ||
    $('title').text() ||
    '';

  // ── Hero heading (often the value prop) ─────────────────────────────────
  const heroHeading =
    $('h1').first().text().trim() ||
    $('h2').first().text().trim() ||
    '';

  // ── About / mission text ─────────────────────────────────────────────────
  let aboutText = '';
  $('section, div').each((_, el) => {
    const text = $(el).text().toLowerCase();
    if (
      (text.includes('about us') || text.includes('our mission') || text.includes('who we are')) &&
      aboutText.length < 500
    ) {
      aboutText = $(el).text().trim().substring(0, 500);
    }
  });

  // ── Social links ─────────────────────────────────────────────────────────
  const linkedin = findLink($, 'linkedin.com');
  const twitter  = findLink($, 'twitter.com') || findLink($, 'x.com');

  // ── Location ─────────────────────────────────────────────────────────────
  const location = extractLocation($);

  // ── Technology signals from HTML ─────────────────────────────────────────
  const technologies = detectTech(html);

  // ── Navigation items (product/service areas) ─────────────────────────────
  const navItems = [];
  $('nav a, header a').each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length < 40 && !['Home', 'Login', 'Sign up', 'Contact'].includes(text)) {
      navItems.push(text);
    }
  });

  return {
    description: description.trim(),
    tagline: tagline.trim(),
    heroHeading,
    aboutText,
    linkedin,
    twitter,
    location,
    technologies,
    navItems: [...new Set(navItems)].slice(0, 8),
  };
}

// ── Utility helpers ───────────────────────────────────────────────────────────

function findLink($, domain) {
  let found = '';
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (href.includes(domain) && !found) found = href;
  });
  return found;
}

function extractLocation($) {
  // Look for address-like patterns in footer
  const footerText = $('footer').text();
  const cityMatch = footerText.match(
    /([A-Z][a-zA-Z\s]+,\s*[A-Z]{2,}(?:\s+\d{5})?)/
  );
  return cityMatch ? cityMatch[1].trim() : '';
}

function detectTech(html) {
  const techSignals = {
    'React':       /react/i,
    'Vue':         /vue\.js|vuex/i,
    'Angular':     /angular/i,
    'Next.js':     /next\.js|__NEXT_DATA__/i,
    'WordPress':   /wp-content|wp-includes/i,
    'Shopify':     /shopify/i,
    'HubSpot':     /hubspot/i,
    'Intercom':    /intercom/i,
    'Segment':     /segment\.io|analytics\.js/i,
    'Stripe':      /stripe/i,
    'AWS':         /amazonaws\.com/i,
    'Google Analytics': /gtag|google-analytics/i,
    'Salesforce':  /salesforce/i,
    'Zendesk':     /zendesk/i,
    'Drift':       /drift\.com/i,
  };

  return Object.entries(techSignals)
    .filter(([, pattern]) => pattern.test(html))
    .map(([name]) => name);
}

module.exports = { scrapeWebsite };
