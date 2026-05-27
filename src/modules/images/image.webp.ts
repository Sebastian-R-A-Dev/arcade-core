import sharp from 'sharp';
import { HttpError } from '../../shared/constants/httpError.js';
import { AppError } from '../../shared/utils/AppError.js';

/** MIME y extensión finales en Storage (todo upload termina como WebP). */
export const STORAGE_WEBP_MIME = 'image/webp' as const;
export const STORAGE_WEBP_EXT = 'webp' as const;

/**
 * Codificación WebP: prioriza tamaño en bucket free sin degradación fuerte.
 * - quality ~78: buen equilibrio visual/peso frente a 85+ “premium”.
 * - effort 6: mejor compresión (más CPU en upload, poco tráfico).
 * - alphaQuality: transparencias PNG siguen viéndose limpias.
 */
const WEBP_OUTPUT = {
  quality: 78,
  effort: 6,
  smartSubsample: true,
  alphaQuality: 88,
} as const;

export type NormalizeWebpResult = {
  buffer: Buffer;
  contentType: typeof STORAGE_WEBP_MIME;
  /** true si la entrada era PNG (no WebP) */
  convertedFromPng: boolean;
};

export async function normalizeUploadToWebp(
  buffer: Buffer,
  sourceMime: string,
): Promise<NormalizeWebpResult> {
  if (sourceMime !== 'image/png' && sourceMime !== 'image/webp') {
    throw new AppError('Unsupported image type', HttpError.BAD_REQUEST);
  }

  try {
    // Sharp detecta PNG/WebP; siempre re-encode a WebP para recomprimir también uploads ya WebP.
    const out = await sharp(buffer).webp(WEBP_OUTPUT).toBuffer();

    console.info('[images] normalized to WebP', {
      sourceMime,
      inBytes: buffer.length,
      outBytes: out.length,
      savedApprox:
        buffer.length > out.length ? `${(((buffer.length - out.length) / buffer.length) * 100).toFixed(1)}%` : '0%',
    });

    return {
      buffer: out,
      contentType: STORAGE_WEBP_MIME,
      convertedFromPng: sourceMime === 'image/png',
    };
  } catch (err) {
    console.error('[images] WebP normalization failed:', err);
    const hint = sourceMime === 'image/png' ? 'PNG' : 'WebP';
    throw new AppError(`Invalid or corrupted ${hint} image`, HttpError.BAD_REQUEST);
  }
}
