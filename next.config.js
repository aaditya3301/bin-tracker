/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // The appDir is now default in Next.js 13+
  experimental: {
    serverComponentsExternalPackages: [],
  },
  images: {
    domains: [
      'lh3.googleusercontent.com', // For Google OAuth profile images
    ],
  },
};

module.exports = nextConfig;