import type { NextConfig } from "next";

const backendOriginRaw = process.env.BACKEND_ORIGIN?.trim() || "http://127.0.0.1:8000";
const backendOrigin = backendOriginRaw.endsWith("/")
  ? backendOriginRaw.slice(0, -1)
  : backendOriginRaw;

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api",
        destination: `${backendOrigin}/api/`,
      },
      {
        source: "/api/:path*",
        destination: `${backendOrigin}/api/:path*/`,
      },
    ];
  },
};

export default nextConfig;
