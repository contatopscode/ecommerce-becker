// ============================================================
// Mercado Pago - Integração
// Suporta PIX, Cartão de Crédito, Boleto
// Docs: https://www.mercadopago.com.br/developers/pt/reference
// ============================================================

import 'server-only';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { prisma } from '@becker/db';

// ============== CONFIGURAÇÃO ==============

/**
 * Busca credenciais do MP no banco de dados (model Setting)
 * Fallback para variáveis de ambiente
 */
async function getMPCredentials(): Promise<{
  accessToken: string;
  publicKey: string;
  sandbox: boolean;
} | null> {
  // Tenta banco de dados primeiro
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: { in: ['payments_mp_access_token', 'payments_mp_public_key', 'payments_mp_sandbox'] },
      },
    });
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

    if (map.payments_mp_access_token) {
      return {
        accessToken: map.payments_mp_access_token,
        publicKey: map.payments_mp_public_key || '',
        sandbox: map.payments_mp_sandbox === 'true',
      };
    }
  } catch (e) {
    console.warn('[mercadopago] Erro ao buscar credenciais no DB:', e);
  }

  // Fallback: env vars
  const envToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (envToken) {
    return {
      accessToken: envToken,
      publicKey: process.env.MERCADOPAGO_PUBLIC_KEY || '',
      sandbox: process.env.MERCADOPAGO_SANDBOX === 'true',
    };
  }

  return null;
}

/**
 * Cria cliente MP com credenciais
 */
async function getMPClient() {
  const creds = await getMPCredentials();
  if (!creds) {
    throw new Error('Mercado Pago não configurado. Configure em /admin/configuracoes > Pagamentos');
  }
  return {
    client: new MercadoPagoConfig({ accessToken: creds.accessToken }),
    sandbox: creds.sandbox,
  };
}

// ============== TIPOS ==============

export interface CreatePixPaymentInput {
  orderId: string;
  orderNumber: string;
  total: number;
  customer: {
    name: string;
    email?: string;
    whatsapp: string;
  };
  description?: string;
  expirationMinutes?: number;
}

export interface CreatePixPaymentResult {
  ok: boolean;
  paymentId?: string;
  qrCode?: string;          // texto copia-e-cola
  qrCodeBase64?: string;    // imagem base64 do QR
  expirationDate?: string;  // ISO string
  ticketUrl?: string;
  error?: string;
}

export interface PaymentStatus {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded' | 'in_process' | 'in_mediation';
  statusDetail?: string;
  paidAt?: string;
  amount: number;
}

// ============== PIX ==============

/**
 * Cria um pagamento PIX via Mercado Pago
 */
export async function createPixPayment(input: CreatePixPaymentInput): Promise<CreatePixPaymentResult> {
  try {
    const { client, sandbox } = await getMPClient();
    const payment = new Payment(client);

    const customerName = input.customer.name.split(' ');
    const firstName = customerName[0] || 'Cliente';
    const lastName = customerName.slice(1).join(' ') || 'Becker';

    // Gera ID de idempotência
    const idempotencyKey = `${input.orderId}-${Date.now()}`;

    // Cria pagamento PIX
    // Docs: https://www.mercadopago.com.br/developers/pt/reference/payments/_payments/post
    const result = await payment.create({
      body: {
        transaction_amount: input.total,
        payment_method_id: 'pix',
        description: input.description || `Pedido ${input.orderNumber} - Becker`,
        payer: {
          email: input.customer.email || `cliente+${input.orderId.slice(0, 8)}@becker.com.br`,
          first_name: firstName,
          last_name: lastName,
          // CPF/CNPJ é opcional mas recomendado
        },
        external_reference: input.orderId,
        notification_url: process.env.MERCADOPAGO_WEBHOOK_URL ||
          `${process.env.SITE_DOMAIN || 'https://becker.pscode.ia.br'}/api/webhooks/mercadopago`,
        date_of_expiration: new Date(
          Date.now() + (input.expirationMinutes || 30) * 60 * 1000
        ).toISOString(),
      },
      requestOptions: { idempotencyKey },
    });

    if (!result.id) {
      return { ok: false, error: 'Mercado Pago não retornou ID' };
    }

    // Extrai QR Code do response
    const pointOfInteraction = (result as any).point_of_interaction;
    const transactionData = pointOfInteraction?.transaction_data;

    if (!transactionData?.qr_code) {
      return { ok: false, error: 'QR Code não retornado pelo MP' };
    }

    return {
      ok: true,
      paymentId: String(result.id),
      qrCode: transactionData.qr_code,
      qrCodeBase64: transactionData.qr_code_base64,
      expirationDate: (result as any).date_of_expiration,
      ticketUrl: transactionData.ticket_url,
    };
  } catch (e: any) {
    console.error('[mercadopago] Erro ao criar pagamento PIX:', e);
    return {
      ok: false,
      error: e.message || 'Erro ao criar pagamento no Mercado Pago',
    };
  }
}

// ============== STATUS ==============

/**
 * Consulta status de um pagamento no MP
 */
export async function getPaymentStatus(paymentId: string): Promise<PaymentStatus | null> {
  try {
    const { client } = await getMPClient();
    const payment = new Payment(client);
    const result = await payment.get({ id: paymentId });

    return {
      id: String(result.id),
      status: result.status as any,
      statusDetail: result.status_detail,
      paidAt: result.date_approved,
      amount: result.transaction_amount || 0,
    };
  } catch (e: any) {
    console.error('[mercadopago] Erro ao consultar pagamento:', e);
    return null;
  }
}

// ============== PREFERENCE (Cartão / Boleto) ==============

/**
 * Cria preference (usado para Checkout Pro, Cartão e Boleto)
 */
export async function createPreference(input: {
  orderId: string;
  orderNumber: string;
  items: Array<{ title: string; quantity: number; unit_price: number }>;
  total: number;
  customer: { name: string; email?: string };
}): Promise<{ ok: boolean; preferenceId?: string; initPoint?: string; error?: string }> {
  try {
    const { client, sandbox } = await getMPClient();
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: input.items,
        external_reference: input.orderId,
        payer: {
          name: input.customer.name,
          email: input.customer.email || `cliente+${input.orderId.slice(0, 8)}@becker.com.br`,
        },
        back_urls: {
          success: `${process.env.SITE_DOMAIN}/pedido/${input.orderId}?status=approved`,
          failure: `${process.env.SITE_DOMAIN}/checkout/pagamento?orderId=${input.orderId}&status=failure`,
          pending: `${process.env.SITE_DOMAIN}/checkout/pagamento?orderId=${input.orderId}&status=pending`,
        },
        auto_return: 'approved',
        notification_url: process.env.MERCADOPAGO_WEBHOOK_URL ||
          `${process.env.SITE_DOMAIN || 'https://becker.pscode.ia.br'}/api/webhooks/mercadopago`,
      },
    });

    return {
      ok: true,
      preferenceId: result.id,
      initPoint: sandbox ? result.sandbox_init_point : result.init_point,
    };
  } catch (e: any) {
    console.error('[mercadopago] Erro ao criar preference:', e);
    return { ok: false, error: e.message };
  }
}

// ============== TEST ==============

/**
 * Testa conexão com Mercado Pago
 * Usado pelo botão "Testar conexão" no admin
 */
export async function testConnection(): Promise<{ ok: boolean; mode: string; error?: string }> {
  try {
    const { client, sandbox } = await getMPClient();
    const payment = new Payment(client);

    // Tenta listar pagamentos recentes (1 item só pra testar)
    await payment.search({ options: { limit: 1 } });

    return {
      ok: true,
      mode: sandbox ? 'sandbox' : 'production',
    };
  } catch (e: any) {
    return {
      ok: false,
      mode: 'unknown',
      error: e.message || 'Erro de conexão',
    };
  }
}

// ============== HELPERS ==============

/**
 * Mapeia status do MP para nosso enum
 */
export function mapMPStatusToOrderStatus(
  mpStatus: string
): 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' {
  switch (mpStatus) {
    case 'approved':
      return 'PAID';
    case 'rejected':
    case 'cancelled':
      return 'FAILED';
    case 'refunded':
      return 'REFUNDED';
    case 'pending':
    case 'in_process':
    case 'in_mediation':
    case 'authorized':
    default:
      return 'PENDING';
  }
}
