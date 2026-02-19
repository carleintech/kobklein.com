/** @type {import('next').NextConfig} */
const nextConfig = {
  // API calls proxy to backend
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
