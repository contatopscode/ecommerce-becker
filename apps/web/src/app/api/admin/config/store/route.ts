import { NextResponse } from 'next/server';
import { guardAdmin } from '@/lib/auth/admin-guard';
import { getStoreSettings, setStoreSettings, storeSettingsSchema } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  const guard = await guardAdmin();
  if (!guard.ok) return guard.response;
  const settings = await getStoreSettings();
  return NextResponse.json({ settings });
}

export async function PUT(request: Request) {
  const guard = await guardAdmin();
  if (!guard.ok) return guard.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }
  const parsed = storeSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', issues: parsed.error.issues.map((i) => ({ campo: i.path.join('.'), mensagem: i.message })) },
      { status: 400 }
    );
  }
  await setStoreSettings(parsed.data);
  return NextResponse.json({ settings: parsed.data });
}
