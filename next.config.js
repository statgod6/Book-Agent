/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Handle canvas module for pdfjs-dist
    config.resolve.alias.canvas = false;
    return config;
  },
};

module.exports = nextConfig;
