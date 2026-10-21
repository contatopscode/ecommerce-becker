import { readdir, stat, unlink } from 'node:fs/promises';
import path from 'node:path';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export function getUploadDir(): string {
  const configured = process.env.UPLOAD_DIR;
  if (configured && configured.trim() !== '') return path.resolve(configured);
  return path.resolve(process.env.NODE_ENV === 'production' ? '/app/uploads' : './uploads');
}

export type ImageKind = { ext: 'jpg' | 'png' | 'webp'; mime: string };

export const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

/** Detecta o tipo pelos magic bytes; ignora nome e Content-Type enviados. */
export function detectImage(buf: Uint8Array): ImageKind | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { ext: 'jpg', mime: 'image/jpeg' };
  }
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (buf.length >= 8 && png.every((b, i) => buf[i] === b)) {
    return { ext: 'png', mime: 'image/png' };
  }
  const ascii = (start: number, s: string) => s.split('').every((c, i) => buf[start + i] === c.charCodeAt(0));
  if (buf.length >= 12 && ascii(0, 'RIFF') && ascii(8, 'WEBP')) {
    return { ext: 'webp', mime: 'image/webp' };
  }
  return null;
}

export const MAX_UPLOAD_DIR_BYTES = 200 * 1024 * 1024;

/** Nome gerado pelo upload: 32 hex + extensão permitida. */
export const UPLOAD_NAME_RE = /^[0-9a-f]{32}\.(jpg|png|webp)$/;
export const UPLOAD_URL_RE = /^\/uploads\/[0-9a-f]{32}\.(jpg|png|webp)$/;

export async function uploadDirSize(dir: string): Promise<number> {
  let total = 0;
  let names: string[];
  try {
    names = await readdir(dir);
  } catch {
    return 0;
  }
  for (const n of names) {
    try {
      const st = await stat(path.join(dir, n));
      if (st.isFile()) total += st.size;
    } catch {
      // arquivo removido durante a leitura
    }
  }
  return total;
}

/** Remove um arquivo da loja a partir da URL /uploads/<nome>; ignora qualquer outro valor. */
export async function removeUpload(url: string): Promise<void> {
  if (!UPLOAD_URL_RE.test(url)) return;
  try {
    await unlink(path.join(getUploadDir(), url.slice('/uploads/'.length)));
  } catch {
    // já removido
  }
}

/** Lê o corpo com limite rígido; devolve null se exceder. */
export async function readBodyLimited(request: Request, limit: number): Promise<Uint8Array<ArrayBuffer> | null> {
  if (!request.body) return new Uint8Array(new ArrayBuffer(0));
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.length;
  }
  return out;
}
