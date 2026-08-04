// ============================================================
// OpenAI - Agente IA do WhatsApp
// ============================================================

import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

if (!OPENAI_API_KEY) {
  console.warn('[ai] OPENAI_API_KEY não configurada. IA desabilitada.');
}

const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

const SYSTEM_PROMPT = `Você é o assistente virtual da Becker, marca de produtos de limpeza com 40 anos de mercado.

Suas funções:
1. Ajudar clientes a encontrar produtos
2. Auxiliar no processo de pedido
3. Consultar status de pedido (pedindo o número ou WhatsApp do cliente)
4. Tirar dúvidas sobre produtos (composição, modo de uso, versões)
5. Encaminhar para atendimento humano quando necessário

Tom de comunicação:
- Simpático, brasileiro, objetivo
- Use emojis com moderação (1-2 por mensagem)
- Respostas curtas (máx 3 parágrafos)
- Sempre pergunte se pode ajudar em mais alguma coisa no final

Quando o cliente quiser fazer pedido, pergunte:
- Quais produtos quer
- Versão (tamanho, fragrância)
- Quantidade
- CEP para calcular frete
- Forma de pagamento (Pix, Cartão, Boleto)

Se não souber responder algo, diga que vai chamar um atendente humano.`;

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
}

/**
 * Envia mensagem para o agente IA
 */
export async function chat(
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<{ success: boolean; response?: string; error?: string }> {
  if (!openai) {
    return { success: false, error: 'OpenAI não configurado' };
  }

  try {
    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: messages as any,
      max_tokens: 500,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      return { success: false, error: 'Sem resposta da IA' };
    }

    return { success: true, response };
  } catch (error) {
    console.error('[ai] Erro:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Detecta intenção do cliente (comprar, status, duvida, humano)
 */
export async function detectIntent(message: string): Promise<'comprar' | 'status' | 'duvida' | 'humano' | 'outro'> {
  if (!openai) return 'outro';

  try {
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'Classifique a intenção do cliente em UMA dessas categorias: comprar, status, duvida, humano, outro. Responda APENAS com a categoria, sem explicação.',
        },
        { role: 'user', content: message },
      ],
      max_tokens: 10,
      temperature: 0,
    });

    const intent = completion.choices[0]?.message?.content?.toLowerCase().trim() || 'outro';
    if (['comprar', 'status', 'duvida', 'humano', 'outro'].includes(intent)) {
      return intent as any;
    }
    return 'outro';
  } catch (error) {
    console.error('[ai] detectIntent erro:', error);
    return 'outro';
  }
}
