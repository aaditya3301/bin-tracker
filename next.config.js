/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      'lh3.googleusercontent.com', // For Google OAuth profile images
      'gateway.pinata.cloud',       // For Pinata IPFS gateway
      'cloudflare-ipfs.com',        // Cloudflare IPFS gateway
      'ipfs.io',                    // Public IPFS gateway
    ],
    remotePatterns: [],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  webpack: (config, { isServer }) => {
    // Avoid processing onnxruntime-web on the server
    if (isServer) {
      config.externals = [...(config.externals || []), 'onnxruntime-web'];
    }
    
    // Add external onnxruntime-web and web3 fallbacks
    if (!isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        path: false,
        crypto: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
  // Remove any invalid experimental options
  experimental: {
    serverComponentsExternalPackages: [],
  }
};

module.exports = nextConfig;