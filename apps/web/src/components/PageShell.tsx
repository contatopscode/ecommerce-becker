// ============================================================
// PageShell - layout visual padrão (Header + main + Footer + WhatsApp)
// ============================================================

import { Header } from './Header';
import { Footer } from './Footer';
import { WhatsAppButton } from './WhatsAppButton';

export function PageShell({ children, fullWidth = false }: { children: React.ReactNode; fullWidth?: boolean }) {
  return (
    <>
      <Header />
      <main className={fullWidth ? '' : 'min-h-[60vh]'}>{children}</main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
