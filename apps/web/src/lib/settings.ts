// ============================================================
// Settings tipados sobre a tabela Setting (chave/valor)
// ============================================================

import { prisma } from '@becker/db';
import { z } from 'zod';

const CATEGORY_STORE = 'store';
const PREFIX_STORE = 'store.';

const optionalText = (max: number) => z.string().trim().max(max).default('');

export const storeSettingsSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome da loja').max(120),
  cnpj: z
    .string()
    .trim()
    .max(18)
    .default('')
    .refine((v) => v === '' || v.replace(/\D/g, '').length === 14, 'CNPJ deve ter 14 dígitos'),
  email: z
    .string()
    .trim()
    .max(160)
    .default('')
    .refine((v) => v === '' || z.string().email().safeParse(v).success, 'E-mail inválido'),
  telefone: optionalText(30),
  whatsapp: optionalText(30),
  endereco: optionalText(300),
  logoUrl: z
    .string()
    .trim()
    .max(300)
    .default('')
    .refine((v) => v === '' || /^\/uploads\/[A-Za-z0-9._-]+$/.test(v) || /^https:\/\/\S+$/.test(v), 'URL de logo inválida'),
  corPrimaria: z
    .string()
    .trim()
    .default('')
    .refine((v) => v === '' || /^#[0-9a-fA-F]{6}$/.test(v), 'Cor deve ser hexadecimal (#RRGGBB)'),
  freteGratisAPartirDe: z.coerce.number().min(0, 'Valor inválido').max(1_000_000).default(0),
  textoLegalCurto: optionalText(500),
  textoPrivacidade: optionalText(500),
});

export type StoreSettings = z.infer<typeof storeSettingsSchema>;

const STORE_KEYS = Object.keys(storeSettingsSchema.shape) as Array<keyof StoreSettings>;

export function emptyStoreSettings(): StoreSettings {
  return storeSettingsSchema.parse({ nome: 'Loja' });
}

export async function getStoreSettings(): Promise<StoreSettings> {
  const rows = await prisma.setting.findMany({ where: { key: { startsWith: PREFIX_STORE } } });
  const raw: Record<string, string> = {};
  for (const row of rows) raw[row.key.slice(PREFIX_STORE.length)] = row.value;
  const parsed = storeSettingsSchema.safeParse({ nome: 'Loja', ...raw });
  return parsed.success ? parsed.data : emptyStoreSettings();
}

export async function setStoreSettings(values: StoreSettings): Promise<void> {
  await prisma.$transaction(
    STORE_KEYS.map((k) => {
      const key = PREFIX_STORE + k;
      const value = String(values[k]);
      const type = k === 'freteGratisAPartirDe' ? 'number' : 'text';
      return prisma.setting.upsert({
        where: { key },
        create: { key, value, category: CATEGORY_STORE, label: k, type },
        update: { value, category: CATEGORY_STORE, type },
      });
    })
  );
}
