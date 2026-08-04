// ============================================================
// Admin Conversas (WhatsApp)
// ============================================================

import { prisma } from '@becker/db';
import { ConversasList } from './ConversasList';

export const dynamic = 'force-dynamic';

export default async function AdminConversasPage() {
  const conversations = await prisma.whatsAppConversation.findMany({
    orderBy: { lastMessageAt: 'desc' },
    take: 50,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold text-becker-ink">Conversas WhatsApp</h1>
        <span className="text-sm text-becker-slate">
          {conversations.length} conversa{conversations.length !== 1 ? 's' : ''}
        </span>
      </div>

      <ConversasList conversations={conversations} />
    </div>
  );
}
