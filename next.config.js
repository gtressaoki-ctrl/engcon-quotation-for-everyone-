/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['puppeteer-core', '@sparticuz/chromium', 'pdf-lib', '@pdf-lib/fontkit'],
  },
  // Include font and template files in serverless function output
  outputFileTracingIncludes: {
    '/api/generate-pdf': ['./public/templates/**', './public/fonts/**'],
  },
};

module.exports = nextConfig;
