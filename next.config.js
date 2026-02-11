/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse'],
  },
  // Reduce webpack cache noise (e.g. "Serializing big strings" from pdf-parse)
  webpack: (config) => {
    config.infrastructureLogging = { level: 'error' };
    return config;
  },
};

module.exports = nextConfig;
