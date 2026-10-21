import { NextResponse } from 'next/server';
import { guardAdmin } from '@/lib/auth/admin-guard';
import { removeUpload } from '@/lib/uploads';
import { getStoreSettings, setStoreSettings, storeSettingsSchema } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const guard = await guardAdmin(request);
  if (!guard.ok) return guard.response;
  const settings = await getStoreSettings();
  return NextResponse.json({ settings });
}

export async function PUT(request: Request) {
  const guard = await guardAdmin(request);
  if (!guard.ok) return guard.response;

  if (!(request.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) {
    return NextResponse.json({ error: 'Content-Type deve ser application/json' }, { status: 415 });
  }

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
  const previous = (await getStoreSettings()).logoUrl;
  await setStoreSettings(parsed.data);
  if (previous && previous !== parsed.data.logoUrl) await removeUpload(previous);
  return NextResponse.json({ settings: parsed.data });
}
