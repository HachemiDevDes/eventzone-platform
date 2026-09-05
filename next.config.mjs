/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "country-state-city"
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/en",
        destination: "/",
        permanent: true,
      },
      {
        source: "/fr",
        destination: "/",
        permanent: true,
      },
      {
        source: "/ar",
        destination: "/",
        permanent: true,
      },
      {
        source: "/en/:path*",
        destination: "/:path*",
        permanent: true,
      },
      {
        source: "/fr/:path*",
        destination: "/:path*",
        permanent: true,
      },
      {
        source: "/ar/:path*",
        destination: "/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
