/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Permite acesso a partir do domínio de produção
  async rewrites() {
    return [];
  },
  // Configuração de imagens
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  // Transpile dos packages locais
  transpilePackages: ['@becker/ui', '@becker/types', '@becker/lib'],
  // Otimizações experimentais
  experimental: {
    typedRoutes: false,
  },
  // Headers de segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
