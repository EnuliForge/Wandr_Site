/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*.webm",
        headers: [
          { key: "Content-Type", value: "video/webm" },
          // During active development, avoid caching headaches
          { key: "Cache-Control", value: "no-store" },
          { key: "Accept-Ranges", value: "bytes" },
        ],
      },
    ];
  },
};

export default nextConfig;
