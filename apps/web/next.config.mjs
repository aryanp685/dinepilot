const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@dinepilot/shared"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    const apiInternal =
      process.env.API_INTERNAL_URL || "http://127.0.0.1:4000";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiInternal}/api/v1/:path*`,
      },
      {
        source: "/socket.io/:path*",
        destination: `${apiInternal}/socket.io/:path*`,
      },
    ];
  },
};

export default nextConfig;
