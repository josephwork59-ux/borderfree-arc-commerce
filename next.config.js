const dedicatedEndPoint = process.env.NEXT_PUBLIC_IPFS_URL;
const dedicatedSubdomain = process.env.NEXT_PUBLIC_IPFS_DE;
// console.log(dedicatedSubdomain);

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [dedicatedEndPoint, dedicatedSubdomain],
  },
  env: {
    BASE_URL: process.env.BASE_URL,
  },
};
module.exports = nextConfig;
