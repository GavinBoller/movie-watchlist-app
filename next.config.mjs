/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // CSP is now handled in middleware.ts to avoid conflicts
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'microphone=(self), camera=(self)'
          },
          {
            key: 'Feature-Policy',
            value: 'microphone \'self\''
          }
        ]
      }
    ]
  }
};

export default nextConfig;
