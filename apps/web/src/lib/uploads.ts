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
