// ============================================================
// Cálculo de frete Becker — por peso, configurável pelo Admin
// ============================================================

import { prisma } from '@becker/db';

export interface ShippingOption {
  id: 'free' | 'standard' | 'express';
  name: string;
  description: string;
  price: number;
  days: string;
  carrier: string;
  weight: number;
}

export interface ShippingConfig {
  freeShippingUpToKg: number;      // até X kg é grátis
  freeShippingMinOrder: number;    // pedido mínimo pra ganhar grátis (0 = sem mínimo)
  standardPricePerKg: number;      // R$ por kg no modo standard
  expressPricePerKg: number;       // R$ por kg no modo express
  expressDays: string;             // prazo entrega express
  standardDays: string;            // prazo entrega standard
}

// Config padrão (caso não tenha no banco)
const DEFAULT_CONFIG: ShippingConfig = {
  freeShippingUpToKg: 5,
  freeShippingMinOrder: 0,
  standardPricePerKg: 3.5,
  expressPricePerKg: 8.9,
  expressDays: '2 a 4 dias úteis',
  standardDays: '5 a 8 dias úteis',
};

/**
 * Busca config de frete do banco (tabela Setting) ou usa default
 */
export async function getShippingConfig(): Promise<ShippingConfig> {
  try {
    const settings = await prisma.setting.findMany({
      where: { key: { startsWith: 'shipping_' } },
    });

    const cfg: any = { ...DEFAULT_CONFIG };
    for (const s of settings) {
      const key = s.key.replace('shipping_', '');
      const val = isNaN(Number(s.value)) ? s.value : Number(s.value);
      if (key in cfg) cfg[key] = val;
    }
    return cfg as ShippingConfig;
  } catch {
    return DEFAULT_CONFIG;
  }
}

/**
 * Calcula opções de frete baseado em CEP e peso total do pedido
 */
export async function calculateShipping(
  cep: string,
  items: { weight: number; qty: number }[],
  orderTotal: number,
  config?: ShippingConfig
): Promise<ShippingOption[]> {
  const cleaned = (cep || '').replace(/\D/g, '');
  if (cleaned.length !== 8) return [];

  const cfg = config || (await getShippingConfig());

  // Soma peso total (em kg)
  const totalWeight = items.reduce((sum, item) => sum + (item.weight / 1000) * item.qty, 0);

  // Define se frete grátis
  const isFree = totalWeight <= cfg.freeShippingUpToKg &&
                 (cfg.freeShippingMinOrder === 0 || orderTotal >= cfg.freeShippingMinOrder);

  // Calcula CEP pra estimativa de prazo
  const isSPCapital = cleaned.startsWith('01');
  const isCapital = /^(20|30|40|50|60|70|80|90)/.test(cleaned);
  const daysSuffix = isSPCapital ? ' (SP Capital)' : isCapital ? ' (Capital)' : ' (Interior)';

  const options: ShippingOption[] = [];

  if (isFree) {
    options.push({
      id: 'free',
      name: '🚚 Frete Grátis',
      description: `Entrega padrão${daysSuffix}`,
      price: 0,
      days: cfg.standardDays,
      carrier: 'Becker Entregas',
      weight: totalWeight,
    });
  } else {
    // Standard
    const standardPrice = Math.max(15, totalWeight * cfg.standardPricePerKg);
    options.push({
      id: 'standard',
      name: 'Entrega Padrão',
      description: `Entrega econômica${daysSuffix}`,
      price: Math.round(standardPrice * 100) / 100,
      days: cfg.standardDays,
      carrier: 'Becker Entregas',
      weight: totalWeight,
    });

    // Express (só se CEP for capital)
    if (isSPCapital || isCapital) {
      const expressPrice = Math.max(25, totalWeight * cfg.expressPricePerKg);
      options.push({
        id: 'express',
        name: '⚡ Entrega Expressa',
        description: `Entrega rápida${daysSuffix}`,
        price: Math.round(expressPrice * 100) / 100,
        days: cfg.expressDays,
        carrier: 'Becker Entregas',
        weight: totalWeight,
      });
    }
  }

  return options;
}
