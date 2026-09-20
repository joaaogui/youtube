/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yt3.ggpht.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/",
        has: [{ type: "host", value: "www.joaog.space" }],
        destination: "https://joaog.space/",
        permanent: true,
      },
      {
        source: "/channel/:path*",
        destination: "https://youtube.joaog.space/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;


