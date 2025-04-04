/** @type {import('next').NextConfig} */


const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  reactStrictMode: false,
  eslint: {
    dirs: ['src'],
  },
  // Environment variables accessible to the client
  env: {
    NEXT_PUBLIC_APP_VERSION: '2.1.0',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'pyramid-ninja',
  },
  // Image domains for next/image
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'us-central1-pyramid-ninja.cloudfunctions.net',
        pathname: '/**',
      },
    ],
  },
  
  // Asset prefix for static assets (when deployed to CDN)
  // assetPrefix: process.env.NODE_ENV === 'production' ? 'https://cdn.yourdomain.com' : '',
  
  // Custom webpack configuration
  webpack: (config) => {
    // Audio files
    config.module.rules.push({
      test: /\.(mp3|wav|ogg)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/sounds/[name].[hash][ext]'
      }
    });
    
    return config;
  },
  
  // Headers to add to all pages
  headers: async () => {
    return [
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Redirects
  redirects: async () => {
    return [
      {
        source: '/game',
        destination: '/join',
        permanent: true,
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);