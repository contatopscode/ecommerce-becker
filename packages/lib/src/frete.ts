// ============================================================
// Cálculo de frete
// Por enquanto mockado. Em produção, integrar com Melhor Envio.
// ============================================================

interface ShippingOption {
  id: 'pac' | 'sedex' | 'free';
  name: string;
  description: string;
  price: number;
  days: string;
  carrier?: string;
}

/**
 * Calcula opções de frete baseado no CEP e valor do pedido
 * TODO: integrar com Melhor Envio API
 */
export async function calculateShipping(
  cep: string,
  orderTotal: number
): Promise<ShippingOption[]> {
  const cleanedCep = cep.replace(/\D/g, '');

  // Regras simples de mock
  // SP capital (01000-19999) = mais barato
  // Capitais (20000-99999) = médio
  // Interior = mais caro
  const isSPCapital = cleanedCep.startsWith('01');
  const isCapital = /^(20|30|40|50|60|70|80|90)/.test(cleanedCep);

  // Regra de frete grátis
  if (orderTotal >= 199) {
    return [
      {
        id: 'free',
        name: 'Frete Grátis',
        description: 'Entrega padrão (PAC)',
        price: 0,
        days: isSPCapital ? '4 a 6 dias úteis' : '6 a 9 dias úteis',
        carrier: 'Correios',
      },
    ];
  }

  const pacPrice = isSPCapital ? 14.9 : isCapital ? 22.9 : 32.9;
  const sedexPrice = isSPCapital ? 24.9 : isCapital ? 39.9 : 54.9;

  return [
    {
      id: 'pac',
      name: 'PAC',
      description: 'Entrega econômica',
      price: pacPrice,
      days: isSPCapital ? '4 a 6 dias úteis' : '6 a 9 dias úteis',
      carrier: 'Correios',
    },
    {
      id: 'sedex',
      name: 'SEDEX',
      description: 'Entrega expressa',
      price: sedexPrice,
      days: isSPCapital ? '1 a 2 dias úteis' : '2 a 4 dias úteis',
      carrier: 'Correios',
    },
  ];
}
