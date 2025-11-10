/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
   experimental: {
    serverComponentsExternalPackages: ['typeorm', 'mysql2']
  }
}

module.exports = nextConfig

