import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { guardAdmin } from '@/lib/auth/admin-guard';
import { MAX_UPLOAD_BYTES, detectImage, getUploadDir } from '@/lib/uploads';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const guard = await guardAdmin();
  if (!guard.ok) return guard.response;

  const declared = Number(request.headers.get('content-length') ?? '0');
  if (declared > MAX_UPLOAD_BYTES + 64 * 1024) {
    return NextResponse.json({ error: 'Arquivo maior que 5 MB' }, { status: 413 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Envie multipart/form-data' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Campo "file" ausente' }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'Arquivo vazio' }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: 'Arquivo maior que 5 MB' }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = detectImage(bytes);
  if (!kind) {
    return NextResponse.json({ error: 'Formato não permitido (use JPEG, PNG ou WebP)' }, { status: 415 });
  }

  const name = `${randomBytes(16).toString('hex')}.${kind.ext}`;
  const dir = getUploadDir();
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), bytes, { flag: 'wx' });

  return NextResponse.json({ url: `/uploads/${name}`, tamanho: bytes.length, tipo: kind.mime }, { status: 201 });
}
