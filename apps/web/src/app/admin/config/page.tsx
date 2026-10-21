// ============================================================
// Admin Config — abas A Loja / B Banners / C Pagamentos
// ============================================================

import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/session';
import { getStoreSettings } from '@/lib/settings';
import { ConfigTabs } from './ConfigTabs';

export const dynamic = 'force-dynamic';

export default async function AdminConfigAbasPage() {
  const session = await requireAdmin();
  if (!session) redirect('/conta?redirect=/admin/config');
  const store = await getStoreSettings();

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-becker-ink mb-6">Config</h1>
      <ConfigTabs initialStore={store} />
    </div>
  );
}
