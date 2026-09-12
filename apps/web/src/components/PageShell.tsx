// ============================================================
// PageShell - layout visual padrão (Header + main + Footer + WhatsApp)
// ============================================================

import { SiteHeader } from './SiteHeader';
import { Footer } from './Footer';
import { WhatsAppButton } from './WhatsAppButton';

export function PageShell({ children, fullWidth = false }: { children: React.ReactNode; fullWidth?: boolean }) {
  return (
    <>
      <SiteHeader />
      <main className={fullWidth ? '' : 'min-h-[60vh]'}>{children}</main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
