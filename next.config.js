/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      'lh3.googleusercontent.com',
      'gateway.pinata.cloud',
      'cloudflare-ipfs.com',
      'ipfs.io',
      'cdn.jsdelivr.net'
    ],
    remotePatterns: [],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };

      // Suppress specific warnings
      config.ignoreWarnings = [
        /Critical dependency: require function is used in a way in which dependencies cannot be statically extracted/,
        { module: /onnxruntime-web/ },
      ];
    }

    return config;
  },
  // Add CSP headers for external scripts
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; object-src 'none';",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;