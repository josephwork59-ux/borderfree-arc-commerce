const dedicatedEndPoint = process.env.NEXT_PUBLIC_IPFS_URL;
const dedicatedSubdomain = process.env.NEXT_PUBLIC_IPFS_DE;

const toRemotePattern = (value) => {
  if (!value) return null;

  try {
    const url = new URL(value.includes('://') ? value : `https://${value}`);
    return { protocol: 'https', hostname: url.hostname };
  } catch {
    return null;
  }
};

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [dedicatedEndPoint, dedicatedSubdomain].map(toRemotePattern).filter(Boolean),
  },
  env: {
    BASE_URL: process.env.BASE_URL,
  },
};
module.exports = nextConfig;
