// ============================================================
// Admin Configurações — página completa
// ============================================================

import { getSession } from '@/lib/auth/session';
import { ConfigForm } from './ConfigForm';
import { prisma } from '@becker/db';

export const dynamic = 'force-dynamic';

export default async function AdminConfigPage() {
  const session = await getSession();
  const settings = await prisma.setting.findMany({ orderBy: { category: 'asc' } });

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-becker-ink mb-6">Configurações</h1>
      <ConfigForm
        session={session}
        settings={settings.map((s) => ({
          key: s.key,
          value: s.value,
          category: s.category,
          label: s.label || s.key,
          type: s.type,
        }))}
      />
    </div>
  );
}
