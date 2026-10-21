// ============================================================
// API: Pedido de cotação B2B
// POST /api/empresas/cotacao
// Grava em Setting (cotacao.<timestamp>.<hash>) e avisa a loja pelo WhatsApp (best-effort)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '@becker/db';
import { checkRateLimit } from '@/lib/rate-limit';
import { notifyAdmin } from '@/lib/whatsapp-admin';
import { canonicalPhone } from '@/lib/auth/pedido-access';

const schema = z.object({
  empresa: z.string().trim().min(2).max(120),
  cnpj: z.string().transform((v) => v.replace(/\D/g, '')).pipe(z.string().length(14)),
  responsavel: z.string().trim().min(2).max(120),
  whatsapp: z.string().refine((v) => canonicalPhone(v).length === 10, 'WhatsApp inválido'),
  email: z.string().trim().max(160).email().optional().or(z.literal('')),
  mensagem: z.string().trim().max(1000).optional(),
});

const LIMIT = { max: 5, windowMs: 60 * 60 * 1000 };

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, LIMIT);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Dados inválidos' }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Confira os dados informados (CNPJ com 14 dígitos, WhatsApp com DDD).' }, { status: 400 });
  }
  const d = parsed.data;

  try {
    const ts = Date.now();
    const hash = crypto.createHash('sha256').update(`${ts}:${d.cnpj}:${crypto.randomBytes(8).toString('hex')}`).digest('hex').slice(0, 12);
    await prisma.setting.create({
      data: {
        key: `cotacao.${ts}.${hash}`,
        category: 'cotacao',
        value: JSON.stringify({ ...d, criadoEm: new Date(ts).toISOString() }),
      },
    });

    // Aviso à loja: best-effort, a cotação já está gravada
    const aviso =
      `🏢 *Nova cotação B2B*\n\nEmpresa: ${d.empresa}\nResponsável: ${d.responsavel}\n` +
      `WhatsApp: ${d.whatsapp}\n${d.email ? `E-mail: ${d.email}\n` : ''}` +
      `${d.mensagem ? `Interesse: ${d.mensagem}\n` : ''}\nProtocolo: ${hash}`;
    const sent = await notifyAdmin(aviso).catch(() => ({ ok: false }));
    return NextResponse.json({ ok: true, protocolo: hash, avisado: sent.ok });
  } catch {
    console.error('[cotacao] falha ao gravar cotação');
    return NextResponse.json({ ok: false, error: 'Não foi possível registrar agora.' }, { status: 500 });
  }
}
