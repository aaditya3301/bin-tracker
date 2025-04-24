/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // The appDir is now default in Next.js 13+
  experimental: {
    serverComponentsExternalPackages: [],
  },
}

module.exports = nextConfig