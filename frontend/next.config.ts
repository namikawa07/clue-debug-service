import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    const p = (src: string, dst: string) => ({
      source: src,
      destination: dst,
      permanent: true,
    });
    return [
      // Old /workspaces/ → /w/ redirects
      p("/workspaces/:wid", "/w/:wid"),
      p("/workspaces/:wid/tasks", "/w/:wid/tasks"),
      p("/workspaces/:wid/tasks/:tid", "/w/:wid/tasks/:tid"),
      p("/workspaces/:wid/notes", "/w/:wid/notes"),
      p("/workspaces/:wid/members", "/w/:wid/members"),
      p("/workspaces/:wid/settings", "/w/:wid/settings"),
      p("/workspaces/:wid/teams", "/w/:wid/teams"),
      p("/workspaces/:wid/teams/:tid", "/w/:wid/teams/:tid"),
      p("/workspaces/:wid/spaces/:sid", "/w/:wid/spaces/:sid"),
      p("/workspaces/:wid/spaces/:sid/tasks", "/w/:wid/spaces/:sid/tasks"),
      p("/workspaces/:wid/spaces/:sid/tasks/:tid", "/w/:wid/spaces/:sid/tasks/:tid"),
      p("/workspaces/:wid/spaces/:sid/notes", "/w/:wid/spaces/:sid/notes"),
      p("/workspaces/:wid/spaces/:sid/teams", "/w/:wid/spaces/:sid/teams"),
      p("/workspaces/:wid/spaces/:sid/teams/:tid", "/w/:wid/spaces/:sid/teams/:tid"),
      p("/workspaces/:wid/spaces/:sid/settings", "/w/:wid/spaces/:sid/settings"),
      p("/workspaces/:wid/spaces/:sid/epics", "/w/:wid/spaces/:sid/epics"),
      p("/workspaces/:wid/spaces/:sid/epics/:eid", "/w/:wid/spaces/:sid/epics/:eid"),
    ];
  },
  images: {
    // this wasn't working as expected
    remotePatterns: [
      {
        protocol: "https",
        hostname: "finepro-ai.vercel.app",
        pathname: "/api/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/api/**",
      },
    ],
    // Disable image optimization warnings
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  /* config options here */
  reactStrictMode: true,
  devIndicators: {
    position: "bottom-right",
  },
  // Suppress specific warnings
  // logging: {
  //   level: "error", // Only show errors, not warnings
  // },
};

export default nextConfig;
