import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { guardAdmin } from '@/lib/auth/admin-guard';
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_DIR_BYTES, detectImage, getUploadDir, readBodyLimited, uploadDirSize } from '@/lib/uploads';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const guard = await guardAdmin(request);
  if (!guard.ok) return guard.response;

  const limit = MAX_UPLOAD_BYTES + 64 * 1024;
  const lengthHeader = request.headers.get('content-length');
  if (lengthHeader === null || !/^\d+$/.test(lengthHeader)) {
    return NextResponse.json({ error: 'Content-Length obrigatório' }, { status: 411 });
  }
  if (Number(lengthHeader) > limit) {
    return NextResponse.json({ error: 'Arquivo maior que 5 MB' }, { status: 413 });
  }
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
    return NextResponse.json({ error: 'Envie multipart/form-data' }, { status: 400 });
  }

  const raw = await readBodyLimited(request, limit);
  if (raw === null) {
    return NextResponse.json({ error: 'Arquivo maior que 5 MB' }, { status: 413 });
  }

  let form: FormData;
  try {
    form = await new Response(raw, { headers: { 'content-type': contentType } }).formData();
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
  if (bytes.length > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: 'Arquivo maior que 5 MB' }, { status: 413 });
  }
  const kind = detectImage(bytes);
  if (!kind) {
    return NextResponse.json({ error: 'Formato não permitido (use JPEG, PNG ou WebP)' }, { status: 415 });
  }

  const dir = getUploadDir();
  if ((await uploadDirSize(dir)) + bytes.length > MAX_UPLOAD_DIR_BYTES) {
    return NextResponse.json({ error: 'Limite de armazenamento de uploads atingido' }, { status: 507 });
  }

  const name = `${randomBytes(16).toString('hex')}.${kind.ext}`;
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), bytes, { flag: 'wx' });

  return NextResponse.json({ url: `/uploads/${name}`, tamanho: bytes.length, tipo: kind.mime }, { status: 201 });
}
