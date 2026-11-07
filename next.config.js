/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The textures and HDRs keep their names when they change, so they're
  // cached for a day and then refreshed in the background, rather than
  // checked again on every visit
  async headers() {
    return [
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
