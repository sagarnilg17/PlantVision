import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Camera (plant scan) and geolocation (map picker) are used first-party only.
  { key: "Permissions-Policy", value: "camera=(self), geolocation=(self), microphone=(), payment=()" },
];

// Three build targets:
//  - BUILD_TARGET=static  → static `out/` bundle for the Capacitor/APK build
//  - BUILD_STANDALONE=1   → self-contained Node server for a container (Cloud Run)
//  - (neither)            → Vercel's managed runtime
const isStatic     = process.env.BUILD_TARGET === "static";
const isStandalone = process.env.BUILD_STANDALONE === "1";

const nextConfig: NextConfig = isStatic
  ? {
      output: "export",
      trailingSlash: true,
      images: { unoptimized: true },
    }
  : {
      // `standalone` produces `.next/standalone/server.js` for the Docker image.
      // Left off on Vercel so it keeps using its own optimized runtime.
      ...(isStandalone ? { output: "standalone" as const } : {}),
      async headers() {
        return [{ source: "/:path*", headers: securityHeaders }];
      },
    };

export default nextConfig;
