import './globals.css';

export const metadata = {
  title: 'Becker Admin',
  description: 'Painel administrativo Becker',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50 antialiased">{children}</body>
    </html>
  );
}
