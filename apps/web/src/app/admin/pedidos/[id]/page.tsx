// ============================================================
// Admin: Detalhe do Pedido + Timeline de Delivery
// /admin/pedidos/[id]
// ============================================================

import { prisma } from '@becker/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { DeliveryTimeline } from './DeliveryTimeline';

export const dynamic = 'force-dynamic';

export default async function AdminPedidoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    redirect('/admin');
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      address: true,
      items: true,
      delivery: {
        include: {
          events: { orderBy: { createdAt: 'desc' } },
        },
      },
    },
  });

  if (!order) notFound();

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PAID: 'bg-blue-100 text-blue-800',
    PROCESSING: 'bg-purple-100 text-purple-800',
    SHIPPED: 'bg-indigo-100 text-indigo-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    REFUNDED: 'bg-gray-100 text-gray-800',
  };

  const formatBRL = (n: any) => `R$ ${Number(n).toFixed(2)}`;
  const formatDate = (d: Date | null) =>
    d ? new Date(d).toLocaleString('pt-BR') : '—';

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link
            href="/admin/pedidos"
            className="text-becker-purple text-sm font-semibold hover:underline"
          >
            ← Voltar pra lista
          </Link>
          <h1 className="text-3xl font-extrabold text-becker-ink mt-2">
            Pedido {order.number}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${statusColors[order.status]}`}>
              {order.status}
            </span>
            <span className="text-sm text-becker-slate">
              Criado em {formatDate(order.createdAt)}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-extrabold text-becker-purple">
            {formatBRL(order.total)}
          </div>
          <div className="text-xs text-becker-slate">
            Subtotal: {formatBRL(order.subtotal)} · Frete: {formatBRL(order.shipping)}
            {Number(order.discount) > 0 && ` · Desc: -${formatBRL(order.discount)}`}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Coluna 1: Cliente + Endereço + Itens */}
        <div className="space-y-6">
          {/* Cliente */}
          <div className="bg-white rounded-2xl border border-becker-line p-5">
            <h2 className="font-bold text-becker-ink mb-3">👤 Cliente</h2>
            {order.user ? (
              <div className="space-y-1 text-sm">
                <div><strong>{order.user.name}</strong></div>
                <div className="text-becker-slate">📱 {order.user.whatsapp}</div>
                {order.user.email && <div className="text-becker-slate">📧 {order.user.email}</div>}
                <div className="text-xs text-becker-slate mt-2">
                  Pedidos anteriores: {order.user.orders?.length ?? 0}
                </div>
              </div>
            ) : (
              <div className="text-sm">
                <div><strong>{order.guestWhatsapp}</strong></div>
              </div>
            )}
          </div>

          {/* Endereço */}
          {order.address && (
            <div className="bg-white rounded-2xl border border-becker-line p-5">
              <h2 className="font-bold text-becker-ink mb-3">📍 Endereço de entrega</h2>
              <div className="text-sm space-y-0.5">
                <div>{order.address.street}, {order.address.number}</div>
                {order.address.complement && <div>{order.address.complement}</div>}
                <div>{order.address.district}</div>
                <div>{order.address.city}/{order.address.state}</div>
                <div className="text-becker-slate">CEP {order.address.cep}</div>
              </div>
            </div>
          )}

          {/* Itens */}
          <div className="bg-white rounded-2xl border border-becker-line p-5">
            <h2 className="font-bold text-becker-ink mb-3">📦 Itens ({order.items.length})</h2>
            <div className="space-y-2">
              {order.items.map((it) => (
                <div key={it.id} className="flex justify-between text-sm">
                  <div>
                    {it.qty}x {it.productName}
                    <div className="text-xs text-becker-slate">{it.versionLabel}</div>
                  </div>
                  <div className="font-semibold">{formatBRL(it.total)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Coluna 2: Delivery Timeline */}
        <div>
          <DeliveryTimeline
            delivery={order.delivery
              ? {
                  id: order.delivery.id,
                  status: order.delivery.status,
                  motoboyName: order.delivery.motoboyName,
                  motoboyPhone: order.delivery.motoboyPhone,
                  outForDeliveryAt: order.delivery.outForDeliveryAt?.toISOString() ?? null,
                  deliveredAt: order.delivery.deliveredAt?.toISOString() ?? null,
                  problemAt: order.delivery.problemAt?.toISOString() ?? null,
                  problemNote: order.delivery.problemNote,
                  confirmToken: order.delivery.confirmToken,
                  events: order.delivery.events.map((e) => ({
                    id: e.id,
                    type: e.type,
                    actor: e.actor,
                    message: e.message,
                    createdAt: e.createdAt.toISOString(),
                  })),
                }
              : null}
            orderId={order.id}
            orderNumber={order.number}
            customerPhone={order.guestWhatsapp || order.user?.whatsapp}
          />
        </div>
      </div>
    </div>
  );
}
