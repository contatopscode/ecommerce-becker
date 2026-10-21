import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { MIME_BY_EXT, getUploadDir } from '@/lib/uploads';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SAFE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

function notFound() {
  return new Response('Not found', { status: 404, headers: { 'X-Content-Type-Options': 'nosniff' } });
}

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  if (segments.length !== 1) return notFound();
  const name = segments[0] ?? '';
  if (!SAFE_NAME.test(name) || name.includes('..')) return notFound();

  const ext = path.extname(name).slice(1).toLowerCase();
  const mime = MIME_BY_EXT[ext];
  if (!mime) return notFound();

  const root = getUploadDir();
  const full = path.resolve(root, name);
  if (path.dirname(full) !== root) return notFound();

  try {
    const data = await readFile(full);
    return new Response(new Uint8Array(data), {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Content-Length': String(data.length),
        'Cache-Control': 'public, max-age=86400, immutable',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; sandbox",
      },
    });
  } catch {
    return notFound();
  }
}
