import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    qualities: [75, 90],
  },
  // Keep Node-only Sentry/OpenTelemetry packages out of webpack bundles;
  // they are loaded at runtime via instrumentation.ts register() instead.
  serverExternalPackages: [
    "@sentry/nextjs",
    "@sentry/node",
    "@opentelemetry/instrumentation",
    "require-in-the-middle",
  ],
};

export default withSerwist(nextConfig);
