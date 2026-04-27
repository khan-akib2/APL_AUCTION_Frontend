import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'apl-auction-backend.onrender.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  turbopack: {
    root: __dirname,
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",

              // Scripts
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",

              // Styles
              "style-src 'self' 'unsafe-inline'",

              // Images
              "img-src 'self' data: blob: https: http:",

              // API + Socket connections
              [
                "connect-src 'self'",
                "https://apl-auction-backend.onrender.com",
                "https://*.vercel.app",
                "ws://localhost:4000",
                "http://localhost:4000",
                "wss://apl-auction-backend.onrender.com",
                "https://vitals.vercel-insights.com",
              ].join(' '),

              // Fonts
              "font-src 'self' data: https:",

              // Frames
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;