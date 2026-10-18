const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@dinepilot/shared", "@dinepilot/api"],
  experimental: {
    serverComponentsExternalPackages: [
      "mongoose",
      "@volter/twin-mongodb",
      "bcryptjs",
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    const isVercelWithoutExternalApi =
      process.env.VERCEL === "1" && !process.env.API_INTERNAL_URL;

    if (isVercelWithoutExternalApi) {
      return [];
    }

    const apiInternal =
      process.env.API_INTERNAL_URL || "http://127.0.0.1:4000";
    return {
      beforeFiles: [
        {
          source: "/api/v1/:path*",
          destination: `${apiInternal}/api/v1/:path*`,
        },
        {
          source: "/socket.io/:path*",
          destination: `${apiInternal}/socket.io/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
