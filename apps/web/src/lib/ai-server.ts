// ============================================================
// OpenAI Server - usado no webhook WhatsApp
// ============================================================

import 'server-only';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

if (!OPENAI_API_KEY) {
  console.warn('[ai] OPENAI_API_KEY não configurada. IA desabilitada (vai usar fallback).');
}

const SYSTEM_PROMPT = `Você é o assistente virtual da Becker, marca de produtos de limpeza com 40 anos de mercado. Atende via WhatsApp.

Suas funções:
1. Ajudar clientes a encontrar produtos
2. Auxiliar no processo de pedido
3. Consultar status de pedido (pedindo o número ou WhatsApp do cliente)
4. Tirar dúvidas sobre produtos
5. Encaminhar para atendimento humano quando solicitado

Catálogo (top 5 mais vendidos):
- Limpador Multiuso Becker 500ml - R$ 12,90 (5 fragrâncias)
- Eco Becker Lava Roupas 3L - R$ 39,90 (sabão vegetal, 30 lavagens)
- Lava Roupas Múltipla Ação 3L - R$ 28,90
- Amaciante Concentrado 500ml - R$ 14,50
- Desinfetante 2L - R$ 16,90 (5 fragrâncias)
- Álcool Etílico 70° 1L - R$ 18,90
- Lava Louças 500ml - R$ 7,90

Site: https://becker.pscode.ia.br
WhatsApp principal: (81) 99902-2262

Tom:
- Simpático, brasileiro, objetivo
- Use emojis com moderação (1-2 por mensagem)
- Respostas curtas (máx 3 parágrafos)
- Sempre pergunte se pode ajudar em mais alguma coisa no final

Para comprar: pede o produto + versão + CEP + forma de pagamento.
Se o cliente quiser falar com humano, diga que vai transferir e peça pra descrever a dúvida.`;

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function chat(userMessage: string, history: ChatMessage[] = []): Promise<{ success: boolean; response?: string; error?: string }> {
  if (!OPENAI_API_KEY) {
    return { success: false, error: 'OpenAI não configurada' };
  }

  try {
    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.filter((m) => m.role !== 'system'),
      { role: 'user', content: userMessage },
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[ai] OpenAI error:', err);
      return { success: false, error: `OpenAI HTTP ${response.status}` };
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) return { success: false, error: 'Sem resposta' };
    return { success: true, response: text };
  } catch (e: any) {
    console.error('[ai] Erro:', e);
    return { success: false, error: e.message };
  }
}

export async function detectIntent(message: string): Promise<'comprar' | 'status' | 'duvida' | 'humano' | 'saudacao' | 'outro'> {
  const text = message.toLowerCase().trim();

  // Regras simples primeiro
  if (text.match(/^(oi|olá|ola|hi|hello|bom dia|boa tarde|boa noite|menu|cardápio|cardapio|catálogo|catalogo|produtos)$/i)) {
    return 'saudacao';
  }
  if (text.match(/(status|pedido|rastre|onde ta|onde está|chegou)/)) {
    return 'status';
  }
  if (text.match(/(comprar|quero|adicionar|carrinho|pedir|levar)/)) {
    return 'comprar';
  }
  if (text.match(/(atendente|humano|pessoa|atendimento humano|falar com)/)) {
    return 'humano';
  }

  // Fallback: usa IA pra classificar (caro, melhor evitar)
  if (!OPENAI_API_KEY) return 'outro';
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'Classifique a mensagem em UMA dessas: comprar, status, duvida, humano, saudacao, outro. Responda APENAS a palavra.',
          },
          { role: 'user', content: message },
        ],
        max_tokens: 10,
        temperature: 0,
      }),
    });
    if (!response.ok) return 'outro';
    const data = await response.json();
    const intent = data.choices?.[0]?.message?.content?.toLowerCase().trim();
    if (['comprar', 'status', 'duvida', 'humano', 'saudacao', 'outro'].includes(intent)) {
      return intent as any;
    }
    return 'outro';
  } catch {
    return 'outro';
  }
}
