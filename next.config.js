/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['react-leaflet', 'leaflet'],
  images: {
    domains: [],
    remotePatterns: [],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    
    // Add rule for wasm files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    });
    
    return config;
  },
  // Enable experimental features for WebAssembly
  experimental: {
    serverComponentsExternalPackages: [],
    webAssemblyModulesLoader: true,
  },
}

module.exports = nextConfig