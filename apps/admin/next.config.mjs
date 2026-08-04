/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@becker/ui', '@becker/types', '@becker/lib'],
};

export default nextConfig;
