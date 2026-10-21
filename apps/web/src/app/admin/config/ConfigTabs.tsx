'use client';

import { useState } from 'react';
import type { StoreSettings } from '@/lib/settings';
import { StoreForm } from './StoreForm';

const TABS = [
  { id: 'loja', label: 'A · Loja' },
  { id: 'banners', label: 'B · Banners' },
  { id: 'pagamentos', label: 'C · Pagamentos' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function ConfigTabs({ initialStore }: { initialStore: StoreSettings }) {
  const [tab, setTab] = useState<TabId>('loja');

  return (
    <div>
      <div role="tablist" className="flex gap-2 border-b border-becker-line mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-semibold -mb-px border-b-2 ${
              tab === t.id ? 'border-becker-purple text-becker-purple' : 'border-transparent text-becker-slate'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'loja' && <StoreForm initial={initialStore} />}
      {tab === 'banners' && <p className="text-becker-slate">Banners da home — em breve.</p>}
      {tab === 'pagamentos' && <p className="text-becker-slate">Pagamentos (Mercado Pago) — em breve.</p>}
    </div>
  );
}
