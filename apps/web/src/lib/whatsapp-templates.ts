// ============================================================
// WhatsApp message templates
// Sprint 2: templates padronizados para cada evento do pedido
// ============================================================

interface OrderItem {
  productName: string;
  versionLabel: string;
  qty: number;
  price: number;
  total: number;
}

interface OrderData {
  number: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  paymentMethod: 'pix' | 'credit_card';
  tracking?: string | null;
  trackingUrl?: string;
  address?: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  totalWeight?: number;
}

const formatBRL = (n: number) => `R$ ${n.toFixed(2)}`;

export const whatsappTemplates = {
  /** Pedido criado + aguardando pagamento */
  orderCreated: (o: OrderData) => {
    const itemsList = o.items
      .map((i) => `  • ${i.qty}x ${i.productName} (${i.versionLabel}) — ${formatBRL(i.total)}`)
      .join('\n');

    const paymentInfo = o.paymentMethod === 'pix'
      ? '💰 *Pagamento via PIX*\nVocê receberá o QR Code em instantes. Aprovação é instantânea!'
      : '💳 *Pagamento via Cartão*\nProcessaremos seu pagamento nos próximos minutos.';

    return `🛒 *Pedido ${o.number}* — Becker

Olá, *${o.customerName.split(' ')[0]}*! Recebemos seu pedido:

${itemsList}

━━━━━━━━━━━━━━━━━━━
Subtotal: ${formatBRL(o.subtotal)}${o.discount > 0 ? `\nDesconto: -${formatBRL(o.discount)}` : ''}
Frete: ${o.shipping === 0 ? '🎁 Grátis' : formatBRL(o.shipping)}
*Total: ${formatBRL(o.total)}*

${paymentInfo}

📦 *Entrega*
${o.address ? `${o.address.street}, ${o.address.number}\n${o.address.neighborhood} — ${o.address.city}/${o.address.state}` : 'A definir'}

Qualquer dúvida, é só chamar aqui! 💜
— Equipe Becker`;
  },

  /** Pagamento aprovado */
  paymentApproved: (o: OrderData) => {
    return `✅ *Pagamento confirmado!*

Pedido *${o.number}* — ${formatBRL(o.total)}
Já estamos separando seus produtos com carinho.

📦 Status atual: *Em separação*
Prazo de entrega: até 5 dias úteis

Acompanhe em tempo real:
${o.trackingUrl || `https://becker.pscode.ia.br/pedido/${o.number}`}

💜 Equipe Becker`;
  },

  /** Pedido em separação */
  preparing: (o: OrderData) => {
    return `📦 *Pedido em separação!*

Seu pedido *${o.number}* está sendo preparado com muito carinho pela nossa equipe.

Status: *Em separação* 🛍️
Prazo de entrega: até 5 dias úteis

Acompanhe:
${o.trackingUrl || `https://becker.pscode.ia.br/pedido/${o.number}`}

💜 Becker`;
  },

  /** Pedido enviado + código de rastreio */
  shipped: (o: OrderData) => {
    return `🚚 *Seu pedido foi enviado!*

Pedido *${o.number}* — ${formatBRL(o.total)}

Código de rastreio: *${o.tracking || 'em breve'}*
${o.tracking ? `Acompanhe: https://rastreamento.correios.com.br/app/index.php?objetos=${o.tracking}` : ''}

Status: *A caminho* 🚚
Previsão: 2 a 5 dias úteis

Acompanhe seu pedido:
${o.trackingUrl || `https://becker.pscode.ia.br/pedido/${o.number}`}

💜 Becker`;
  },

  /** Pedido entregue */
  delivered: (o: OrderData) => {
    return `✅ *Pedido entregue!*

Pedido *${o.number}* foi entregue com sucesso!

Esperamos que tenha gostado! 😊

Que tal avaliar nossos produtos? Sua opinião é muito importante pra gente.
👉 https://becker.pscode.ia.br/conta/pedidos

Obrigado por comprar na Becker! 💜
— Equipe Becker`;
  },

  /** Pedido cancelado */
  cancelled: (o: OrderData) => {
    return `❌ *Pedido cancelado*

Pedido *${o.number}* foi cancelado.

Se você não solicitou isso ou tem alguma dúvida, é só responder aqui. Teremos prazer em ajudar.

💜 Equipe Becker`;
  },

  /** Lembrete de carrinho abandonado (futuro) */
  cartAbandoned: (o: { customerName: string; items: any[]; total: number; cartUrl: string }) => {
    const itemsList = o.items
      .slice(0, 3)
      .map((i) => `  • ${i.name}`)
      .join('\n');
    return `🛒 *Oi, ${o.customerName.split(' ')[0]}!*

Notamos que você deixou uns produtos no carrinho:
${itemsList}
${o.items.length > 3 ? `  ... e mais ${o.items.length - 3} itens\n` : ''}
Total: *${formatBRL(o.total)}*

Que tal finalizar? Os produtos podem acabar! 🏃
👉 ${o.cartUrl}

💜 Becker`;
  },

  // ============ DELIVERY (Sprint 12) ============

  /** Pedido saiu pra entrega (motoboy a caminho) */
  deliveryOutForDelivery: (o: {
    customerName: string;
    orderNumber: string;
    motoboyName?: string;
    address: { street: string; number: string; neighborhood: string; city: string; state: string };
    confirmUrl: string;
    problemUrl: string;
  }) => {
    return `🚚 *Seu pedido saiu pra entrega!*

Olá, *${o.customerName.split(' ')[0]}*!

O pedido *${o.orderNumber}* está a caminho. 🏍️
${o.motoboyName ? `\nMotoboy: *${o.motoboyName}*` : ''}

📍 *Endereço:*
${o.address.street}, ${o.address.number}
${o.address.neighborhood} — ${o.address.city}/${o.address.state}

Quando o motoboy chegar, me avisa por aqui:

✅ *Recebi OK* → ${o.confirmUrl}
⚠️ *Tive problema* → ${o.problemUrl}

💜 Becker`;
  },

  /** Cliente confirmou recebimento OK */
  deliveryConfirmedThanks: (o: { customerName: string; orderNumber: string }) => {
    return `✅ *Oba! Recebemos a confirmação!*

Valeu, *${o.customerName.split(' ')[0]}*! 🥳

Pedido *${o.orderNumber}* entregue com sucesso. Esperamos que você ame os produtos!

Que tal nos avaliar? Sua opinião faz a diferença 💜
👉 https://becker.pscode.ia.br/conta/pedidos

Obrigado por comprar na Becker! Até a próxima 🚀
— Equipe Becker`;
  },

  /** Cliente reportou problema na entrega */
  deliveryProblemReceived: (o: { customerName: string; orderNumber: string }) => {
    return `⚠️ *Problema registrado*

${o.customerName.split(' ')[0]}, recebemos seu aviso sobre o pedido *${o.orderNumber}*.

Nossa equipe vai te chamar aqui no WhatsApp nos próximos minutos pra resolver. Sem stress, vamos resolver juntos! 💪

— Equipe Becker`;
  },

  /** Lembrete 24h após saída pra entrega (sem confirmação) */
  deliveryReminder24h: (o: {
    customerName: string;
    orderNumber: string;
    confirmUrl: string;
    problemUrl: string;
  }) => {
    return `📦 *Oi, ${o.customerName.split(' ')[0]}!*

Tudo certo com seu pedido *${o.orderNumber}*? 

Ainda não recebemos a confirmação de entrega. O motoboy pode ter passado por aí e a gente quer garantir que você recebeu tudo certinho. 😊

✅ *Tô com o pedido* → ${o.confirmUrl}
⚠️ *Tive problema* → ${o.problemUrl}

— Equipe Becker`;
  },
};
