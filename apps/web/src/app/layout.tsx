import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Becker — Limpeza que cuida de verdade',
    template: '%s | Becker',
  },
  description: 'Loja oficial Becker. Produtos de limpeza doméstica, industrial e cosmética. 40 anos cuidando do seu lar.',
  keywords: ['becker', 'produtos de limpeza', 'lava roupas', 'multiuso', 'desinfetante'],
  authors: [{ name: 'Becker' }],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: process.env.SITE_DOMAIN || 'https://becker.pscode.ia.br',
    siteName: 'Becker',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
