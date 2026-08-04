// ============================================================
// Cálculo de frete (server-side, mock por enquanto)
// Em produção: integrar com Melhor Envio
// ============================================================

export interface ShippingOption {
  id: 'pac' | 'sedex' | 'free';
  name: string;
  description: string;
  price: number;
  days: string;
  carrier?: string;
}

export async function calculateShipping(cep: string, orderTotal: number): Promise<ShippingOption[]> {
  const cleaned = (cep || '').replace(/\D/g, '');
  if (cleaned.length !== 8) return [];

  const isSPCapital = cleaned.startsWith('01');
  const isCapital = /^(20|30|40|50|60|70|80|90)/.test(cleaned);

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

  return [
    {
      id: 'pac',
      name: 'PAC',
      description: 'Entrega econômica',
      price: isSPCapital ? 14.9 : isCapital ? 22.9 : 32.9,
      days: isSPCapital ? '4 a 6 dias úteis' : '6 a 9 dias úteis',
      carrier: 'Correios',
    },
    {
      id: 'sedex',
      name: 'SEDEX',
      description: 'Entrega expressa',
      price: isSPCapital ? 24.9 : isCapital ? 39.9 : 54.9,
      days: isSPCapital ? '1 a 2 dias úteis' : '2 a 4 dias úteis',
      carrier: 'Correios',
    },
  ];
}
