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
import { isValidCnpj } from '@/lib/cnpj';

const schema = z.object({
  empresa: z.string().trim().min(2).max(120),
  cnpj: z.string().transform((v) => v.replace(/\D/g, '')).pipe(z.string().length(14).refine(isValidCnpj, 'CNPJ inválido')),
  responsavel: z.string().trim().min(2).max(120),
  whatsapp: z.string().refine((v) => canonicalPhone(v).length === 10, 'WhatsApp inválido'),
  email: z.string().trim().max(160).email().optional().or(z.literal('')),
  mensagem: z.string().trim().max(1000).optional(),
});

const LIMIT = { max: 5, windowMs: 60 * 60 * 1000 };
// Teto global (todas as origens) de cotações em 24 h: o limite por IP sozinho não segura um ataque distribuído
const DAILY_CAP = 200;

/** Texto de uma linha só para o aviso ao admin (sem quebras que forjem linhas ou campos). */
function oneLine(v: string): string {
  return v.replace(/[\r\n\u2028\u2029\t]+/g, ' ').trim();
}

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, LIMIT, 'empresas-cotacao');
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Dados inválidos' }, { status: 400 });
  }
  // Honeypot: campo "site" é invisível para pessoas; se vier preenchido é robô. Responde ok sem gravar.
  if (typeof body === 'object' && body !== null && 'site' in body && String((body as { site: unknown }).site ?? '').trim() !== '') {
    return NextResponse.json({ ok: true, protocolo: 'recebido', avisado: false });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Confira os dados informados (CNPJ válido, WhatsApp com DDD).' }, { status: 400 });
  }
  const d = parsed.data;

  try {
    const ts = Date.now();
    const today = await prisma.setting.count({
      where: { category: 'cotacao', createdAt: { gte: new Date(ts - 24 * 60 * 60 * 1000) } },
    });
    if (today >= DAILY_CAP) {
      return NextResponse.json({ ok: false, error: 'Muitos pedidos hoje. Fale com a gente pelo WhatsApp.' }, { status: 429 });
    }
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
      `🏢 *Nova cotação B2B*\n\nEmpresa: ${oneLine(d.empresa)}\nResponsável: ${oneLine(d.responsavel)}\n` +
      `WhatsApp: ${oneLine(d.whatsapp)}\n${d.email ? `E-mail: ${oneLine(d.email)}\n` : ''}` +
      `${d.mensagem ? `Interesse: ${oneLine(d.mensagem)}\n` : ''}\nProtocolo: ${hash}`;
    const sent = await notifyAdmin(aviso).catch(() => ({ ok: false }));
    return NextResponse.json({ ok: true, protocolo: hash, avisado: sent.ok });
  } catch {
    console.error('[cotacao] falha ao gravar cotação');
    return NextResponse.json({ ok: false, error: 'Não foi possível registrar agora.' }, { status: 500 });
  }
}
