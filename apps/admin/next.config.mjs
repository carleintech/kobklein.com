/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: [
    "@sentry/nextjs",
    "@sentry/node",
    "@opentelemetry/instrumentation",
    "require-in-the-middle",
  ],
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
