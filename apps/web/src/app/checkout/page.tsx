// ============================================================
// Checkout — shell server (SiteHeader) + client flow
// ============================================================

export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { SiteHeader } from '@/components/SiteHeader';
import CheckoutPageClient, { CheckoutFallback } from './CheckoutPageClient';

export default function CheckoutPage() {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={<CheckoutFallback />}>
        <CheckoutPageClient />
      </Suspense>
    </>
  );
}
