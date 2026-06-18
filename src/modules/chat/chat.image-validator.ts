import { env } from '../../shared/config/env.js';

const DEFAULT_MAX_BYTES = 10 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 5_000;
const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp']);
const FETCH_HEADERS = {
  Accept: 'image/*,*/*',
  'User-Agent': 'ArcadeCore-Chat/1.0 (image validation)',
} as const;

export type ImageValidationResult =
  | { ok: true }
  | { ok: false; message: string; code: string };

function maxBytes(): number {
  return env.chatImageMaxBytes ?? DEFAULT_MAX_BYTES;
}

function isAllowedImageUrl(raw: string): boolean {
  try {
    const u = new URL(raw.trim());
    if (env.nodeEnv === 'production') {
      return u.protocol === 'https:';
    }
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

function isImageContentType(contentType: string): boolean {
  const ct = contentType.toLowerCase().split(';')[0]?.trim() ?? '';
  return ct.startsWith('image/');
}

function extensionFromUrl(imageUrl: string): string | null {
  try {
    const pathname = new URL(imageUrl).pathname;
    const match = /\.([a-z0-9]+)$/i.exec(pathname);
    return match ? match[1].toLowerCase() : null;
  } catch {
    return null;
  }
}

function hasKnownImageExtension(imageUrl: string): boolean {
  const ext = extensionFromUrl(imageUrl);
  return ext != null && IMAGE_EXTENSIONS.has(ext);
}

function parseContentLength(header: string | null): number | null {
  if (!header) return null;
  const size = Number.parseInt(header, 10);
  return Number.isFinite(size) ? size : null;
}

function checkSize(size: number | null): ImageValidationResult | null {
  if (size != null && size > maxBytes()) {
    return {
      ok: false,
      message: 'La imagen supera el límite de 10 MB.',
      code: 'image_too_large',
    };
  }
  return null;
}

function looksLikeImageBytes(buf: Uint8Array): boolean {
  if (buf.length < 12) return false;

  // PNG
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return true;
  }
  // GIF
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) {
    return true;
  }
  // JPEG
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return true;
  }
  // WebP (RIFF....WEBP)
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return true;
  }

  return false;
}

async function sniffImageBytes(imageUrl: string, signal: AbortSignal): Promise<boolean> {
  const res = await fetch(imageUrl, {
    method: 'GET',
    headers: { ...FETCH_HEADERS, Range: 'bytes=0-15' },
    signal,
    redirect: 'follow',
  });

  if (!res.ok && res.status !== 206) {
    return false;
  }

  const buf = new Uint8Array(await res.arrayBuffer());
  return looksLikeImageBytes(buf);
}

async function headImage(imageUrl: string, signal: AbortSignal): Promise<Response> {
  return fetch(imageUrl, {
    method: 'HEAD',
    headers: FETCH_HEADERS,
    signal,
    redirect: 'follow',
  });
}

export async function validateImageUrl(imageUrl: string): Promise<ImageValidationResult> {
  if (!isAllowedImageUrl(imageUrl)) {
    return { ok: false, message: 'URL de imagen no válida.', code: 'invalid_image_url' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const headRes = await headImage(imageUrl, controller.signal);

    if (headRes.ok) {
      const size = parseContentLength(headRes.headers.get('content-length'));
      const sizeError = checkSize(size);
      if (sizeError) return sizeError;

      const contentType = headRes.headers.get('content-type') ?? '';
      if (isImageContentType(contentType)) {
        return { ok: true };
      }

      if (hasKnownImageExtension(imageUrl)) {
        const sniffed = await sniffImageBytes(imageUrl, controller.signal);
        if (sniffed) return { ok: true };

        // Some CDNs omit Content-Type but still serve a valid file (HEAD 200 + size).
        if (size != null && size > 0) {
          return { ok: true };
        }
      }

      return { ok: false, message: 'La URL no apunta a una imagen.', code: 'invalid_content_type' };
    }

    if (headRes.status === 405 || headRes.status === 501) {
      if (!hasKnownImageExtension(imageUrl)) {
        return { ok: false, message: 'La URL no apunta a una imagen.', code: 'invalid_content_type' };
      }

      const sniffed = await sniffImageBytes(imageUrl, controller.signal);
      if (sniffed) return { ok: true };
    }

    return { ok: false, message: 'No se pudo verificar la imagen.', code: 'image_unreachable' };
  } catch {
    return { ok: false, message: 'No se pudo verificar la imagen.', code: 'image_unreachable' };
  } finally {
    clearTimeout(timer);
  }
}
