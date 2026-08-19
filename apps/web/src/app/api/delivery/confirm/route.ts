// ============================================================
// API: Confirmação de entrega (público, sem auth)
// GET /api/delivery/confirm?token=X&action=confirm|problem
//   → cliente clica no link do WhatsApp e cai aqui
//   → renderiza uma página HTML simples com o resultado
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { confirmDelivery } from '@/lib/delivery';

export const dynamic = 'force-dynamic';

function htmlResponse(title: string, body: string, success: boolean) {
  const color = success ? '#22c55e' : '#ef4444';
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Becker</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #6c47d6 0%, #4f32a8 100%);
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 24px;
      padding: 40px 30px;
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: ${color}20;
      color: ${color};
      font-size: 48px;
      display: grid;
      place-items: center;
      margin: 0 auto 20px;
    }
    h1 { color: #1a1a2e; margin-bottom: 12px; font-size: 24px; }
    p { color: #6b7280; line-height: 1.6; }
    .footer { margin-top: 24px; padding-top: 20px; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${success ? '✓' : '!'}</div>
    <h1>${title}</h1>
    <p>${body}</p>
    <div class="footer">💜 Becker — 40 anos cuidando da sua casa</div>
  </div>
</body>
</html>`;
  return new NextResponse(html, {
    status: success ? 200 : 400,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  const action = req.nextUrl.searchParams.get('action') as 'confirm' | 'problem' | null;
  const note = req.nextUrl.searchParams.get('note') || undefined;

  if (!token || !action) {
    return htmlResponse(
      'Link inválido',
      'Este link não está completo. Pede um novo pelo WhatsApp.',
      false
    );
  }

  if (action !== 'confirm' && action !== 'problem') {
    return htmlResponse(
      'Ação inválida',
      'Esse link não é de confirmação nem de problema. Verifica e tenta de novo.',
      false
    );
  }

  const result = await confirmDelivery({ token, action, problemNote: note });

  if (!result.ok) {
    return htmlResponse(
      'Erro',
      result.error || 'Não conseguimos processar. Tenta de novo ou fala com a gente pelo WhatsApp.',
      false
    );
  }

  if (action === 'confirm') {
    return htmlResponse(
      'Recebimento confirmado! 🎉',
      'Valeu por avisar! Esperamos que você ame os produtos. Bom proveito! 💜',
      true
    );
  } else {
    return htmlResponse(
      'Problema registrado ⚠️',
      'Já avisamos a equipe. Eles vão te chamar aqui no WhatsApp em instantes. Sem stress!',
      true
    );
  }
}
