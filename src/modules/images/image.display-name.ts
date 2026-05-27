import path from 'node:path';

const MAX_LEN = 256;

/**
 * Etiqueta humana para la imagen guardada en BD.
 * Prioriza texto enviado en el multipart (`image_name` o `name`);
 * si no hay, usa el nombre base del archivo original (sin extensión).
 */
export function resolveImageDisplayName(
  labelFromBody: string | undefined,
  originalFilename: string | undefined,
): string {
  const fromBody = labelFromBody?.trim();
  if (fromBody) return fromBody.slice(0, MAX_LEN);

  if (originalFilename?.trim()) {
    const stem = path.parse(originalFilename.trim()).name.trim();
    if (stem) return stem.slice(0, MAX_LEN);
  }

  return 'image';
}
