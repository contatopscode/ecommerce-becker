// ============================================================
// API: Testar envio de mensagem de carrinho abandonado
// POST /api/admin/cart/test-send
// Autenticação: sessão admin
// Cria carrinho de teste + dispara mensagem (1h, 24h ou 72h)
// Pra validar Evolution API + templates
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@becker/db';
import { sendWhatsApp, normalizeWhatsAppNumber } from '@/lib/whatsapp-client';
import { saveCart } from '@/lib/cart-recovery';

const TEMPLATES = {
  '1h': (cart: any) => `🛒 *[TESTE 1h] Oi! Sentimos sua falta*

Você deixou ${cart.totalItems} ${cart.totalItems === 1 ? 'item' : 'itens'} no carrinho da Becker:

${cart.items.slice(0, 3).map((i: any) => `  • ${i.qty}x ${i.name} (${i.versionLabel})`).join('\n')}
${cart.items.length > 3 ? `  ... e mais ${cart.items.length - 3}\n` : ''}

💰 Total: *R$ ${Number(cart.subtotal).toFixed(2).replace('.', ',')}*

⏰ Reservamos seus produtos por mais um tempo. Finalize agora:

🔗 ${process.env.SITE_DOMAIN || 'https://becker.pscode.ia.br'}/carrinho

_(Esta é uma mensagem de teste - Sprint 9)_`,

  '24h': (cart: any) => `💚 *[TESTE 24h] Becker - Seus produtos ainda estão esperando!*

Passou um dia e você ainda não finalizou. Seus itens no carrinho:

${cart.items.slice(0, 3).map((i: any) => `  • ${i.qty}x ${i.name}`).join('\n')}

✨ *Que tal um incentivo?* Use o cupom *VOLTA10* e ganhe 10% OFF na sua compra!

Total com desconto: *R$ ${(Number(cart.subtotal) * 0.9).toFixed(2).replace('.', ',')}*

🔗 Finalizar: ${process.env.SITE_DOMAIN || 'https://becker.pscode.ia.br'}/carrinho
(Cupom aplica automaticamente no checkout)

_(Esta é uma mensagem de teste - Sprint 9)_`,

  '72h': (cart: any) => `👋 *[TESTE 72h] Última chance!*

Oi! Seus produtos ainda estão no carrinho mas vamos liberar em breve.

${cart.items.slice(0, 3).map((i: any) => `  • ${i.qty}x ${i.name}`).join('\n')}

🎁 *OFERTA ESPECIAL SÓ PRA VOCÊ:* Frete grátis + 15% OFF com o cupom *ULTIMACHANCE*

Total estimado: *R$ ${(Number(cart.subtotal) * 0.85).toFixed(2).replace('.', ',')}*

🔗 ${process.env.SITE_DOMAIN || 'https://becker.pscode.ia.br'}/carrinho

Depois dessa, vamos devolver os produtos pro estoque! ⏰

_(Esta é uma mensagem de teste - Sprint 9)_`,
};

export async function POST(req: NextRequest) {
  // Apenas admin
  const session = await getSession();
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ ok: false, error: 'Sem permissão' }, { status: 403 });
  }

  try {
    const { whatsapp, type = '1h' } = await req.json();

    if (!whatsapp) {
      return NextResponse.json({ ok: false, error: 'WhatsApp obrigatório' }, { status: 400 });
    }

    if (!['1h', '24h', '72h'].includes(type)) {
      return NextResponse.json({ ok: false, error: 'Type deve ser 1h, 24h ou 72h' }, { status: 400 });
    }

    // Normaliza WhatsApp
    const cleaned = whatsapp.replace(/\D/g, '');
    if (cleaned.length < 10) {
      return NextResponse.json({ ok: false, error: 'WhatsApp inválido' }, { status: 400 });
    }
    const fullPhone = cleaned.startsWith('55') ? cleaned : `55${cleaned}`;

    // Cria carrinho de teste com produtos reais do banco
    const products = await prisma.product.findMany({
      where: { active: true, isFeatured: true },
      include: { versions: { where: { active: true }, take: 1 } },
      take: 3,
    });

    if (products.length === 0) {
      return NextResponse.json({ ok: false, error: 'Nenhum produto ativo no banco' }, { status: 500 });
    }

    const items = products.slice(0, 2).map((p) => {
      const v = p.versions[0];
      return {
        productId: p.id,
        name: p.name,
        versionId: v.id,
        versionLabel: v.label,
        price: Number(v.price),
        qty: 1,
        image: `/img/products/`,
      };
    });

    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const totalItems = items.reduce((sum, i) => sum + i.qty, 0);

    const cart = {
      whatsapp: fullPhone,
      customerName: 'Cliente Teste',
      items,
      subtotal,
      totalItems,
    };

    // Salva o carrinho no banco (pra ficar no histórico)
    await saveCart({
      whatsapp: fullPhone,
      customerName: 'Cliente Teste',
      items,
    });

    // Envia mensagem
    const message = TEMPLATES[type as '1h' | '24h' | '72h'](cart);

    const result = await sendWhatsApp({
      number: fullPhone,
      text: message,
    });

    if (!result.success) {
      return NextResponse.json({
        ok: false,
        error: result.error || 'Falha ao enviar',
        details: 'Verifique se Evolution API está configurada (env vars EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE)',
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      messageId: result.messageId,
      sentTo: fullPhone,
      type,
      items: items.length,
      subtotal,
    });
  } catch (e: any) {
    console.error('[cart/test-send] Erro:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
