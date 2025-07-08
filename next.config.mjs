/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  async headers() {
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' https://vercel.live https://*.vercel.live https://accounts.google.com https://apis.google.com https://www.gstatic.com https://ssl.gstatic.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com;
      font-src 'self' https://fonts.gstatic.com;
      img-src 'self' data: https://image.tmdb.org https://www.google.com https://accounts.google.com;
      connect-src 'self' https://vitals.vercel-insights.com https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com;
      frame-src 'self' https://accounts.google.com https://content.googleapis.com;
    `;

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader.replace(/\s{2,}/g, ' ').trim(),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
