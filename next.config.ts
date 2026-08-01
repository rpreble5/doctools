import type { NextConfig } from "next";

/**
 * Static export, for GitHub Pages.
 *
 * There is nothing to give up here — the app has no server-side
 * anything by design, so `output: "export"` costs no features.
 *
 * Project Pages are served from a subpath (/<repo>), so the base path
 * comes from the environment rather than being hard-coded: CI sets it,
 * local dev leaves it empty and serves from the root.
 */
const basePath = process.env.PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
