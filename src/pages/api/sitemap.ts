import { NextApiRequest, NextApiResponse } from 'next';

const sitemap = async (req: NextApiRequest, res: NextApiResponse) => {
  // Set Cache-Control headers
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate');
  
  // URLs that should be in the sitemap
  const baseUrl = 'https://pyramid.ninja';
  const pages = [
    '',            // Home page
    '/about',      // About page
    '/host',       // Host page
    '/join',       // Join page
  ];

  // Current date in ISO format for lastmod
  const today = new Date().toISOString().split('T')[0];
  
  // Generate sitemap XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages.map(page => `
  <url>
    <loc>${baseUrl}${page}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page === '' ? 'daily' : 'weekly'}</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>
  `).join('')}
</urlset>`;

  // Set content type to XML and send response
  res.setHeader('Content-Type', 'text/xml');
  res.write(sitemap);
  res.end();
};

export default sitemap;