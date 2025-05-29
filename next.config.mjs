/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove static export for App Hosting
  experimental: {
    serverComponentsExternalPackages: []
  }
};

export default nextConfig;
