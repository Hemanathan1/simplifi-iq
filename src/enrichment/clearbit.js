/**
 * enrichment/clearbit.js
 * Fetches structured company data from Clearbit's Company API.
 * Returns null gracefully if API key is missing or domain is unknown.
 * Free tier: 100 lookups/month — sufficient for a prototype.
 */

const axios = require('axios');

async function fetchClearbit(domain) {
  if (!process.env.CLEARBIT_API_KEY || !domain) return null;

  const { data } = await axios.get(
    `https://company.clearbit.com/v2/companies/find?domain=${domain}`,
    {
      auth: { username: process.env.CLEARBIT_API_KEY, password: '' },
      timeout: 8000,
    }
  );

  return {
    name:        data.name,
    description: data.description,
    foundedYear: data.foundedYear,
    category: {
      industry:    data.category?.industry,
      subIndustry: data.category?.subIndustry,
      sector:      data.category?.sector,
    },
    metrics: {
      employees:       data.metrics?.employees,
      employeesRange:  data.metrics?.employeesRange,
      raised:          data.metrics?.raised,
      annualRevenue:   data.metrics?.annualRevenue,
    },
    geo: {
      city:        data.geo?.city,
      state:       data.geo?.state,
      country:     data.geo?.country,
    },
    linkedin: { handle: data.linkedin?.handle },
    twitter:  { handle: data.twitter?.handle },
    tech:     data.tech || [],
    tags:     data.tags || [],
    type:     data.type,   // e.g. "private", "public"
    logo:     data.logo,
  };
}

module.exports = { fetchClearbit };
