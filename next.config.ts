import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://hatey-hat-api.vercel.app";

const scriptSources = [
  "'self'",
  "'unsafe-inline'",
  !isProd ? "'unsafe-eval'" : "",
  "https://accounts.google.com",
].filter(Boolean).join(" ");

const connectSources = [
  "'self'",
  apiUrl.replace(/\/+$/, ""),
  "https://accounts.google.com",
  !isProd ? "http://localhost:5000 http://127.0.0.1:5000" : "",
].filter(Boolean).join(" ");

const cspHeader = `
  default-src 'self';
  script-src ${scriptSources};
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:;
  img-src 'self' https: blob: data:;
  connect-src ${connectSources};
  frame-src 'self' https://accounts.google.com;
  frame-ancestors 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self' https://accounts.google.com;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
