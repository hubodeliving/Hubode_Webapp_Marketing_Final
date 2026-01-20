// @ts-nocheck
const path = require('path');

/** @type {import('next').NextConfig} */
const variablesPath = path.resolve(__dirname, 'styles/_variables.scss').replace(/\\/g, '/');

const nextConfig = {
  reactStrictMode: true,

  // ✅ Completely ignore TS errors during build
  typescript: {
    ignoreBuildErrors: true,
  },

  // ✅ Completely ignore ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },

  sassOptions: {
    // so `styles/` at the project root is on Sass’s import path
    includePaths: [path.join(__dirname, 'styles')],
    // auto-inject your variables partial into every .scss/.sass file with an absolute path
    prependData: `@import "${variablesPath}";`,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        // port: '', // Defaults to ''
        // pathname: '/images/your-project-id/your-dataset/**', // Optional: Be more specific if needed
      },
      // Add other hostnames here if needed, e.g., for localhost if testing locally sometimes
      // { protocol: 'http', hostname: 'localhost' }
    ],
    // OR if using the older 'domains' configuration:
    // domains: ['cdn.sanity.io'],
  },
};

module.exports = nextConfig;
