import path from 'node:path';

const MAX_LEN = 256;

export function resolveAudioDisplayName(
  labelFromBody: string | undefined,
  originalFilename: string | undefined,
): string {
  const fromBody = labelFromBody?.trim();
  if (fromBody) return fromBody.slice(0, MAX_LEN);

  if (originalFilename?.trim()) {
    const stem = path.parse(originalFilename.trim()).name.trim();
    if (stem) return stem.slice(0, MAX_LEN);
  }

  return 'audio';
}
