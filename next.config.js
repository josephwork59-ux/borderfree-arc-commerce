const nextConfig = {
  reactStrictMode: true,
  images: {
    // NFT assets are uploaded to Filebase's IPFS bucket (pages/api/upload.js)
    // and served from its public gateway.
    remotePatterns: [
      { protocol: 'https', hostname: 'ipfs.filebase.io' },
    ],
  },
  env: {
    BASE_URL: process.env.BASE_URL,
  },
};
module.exports = nextConfig;
