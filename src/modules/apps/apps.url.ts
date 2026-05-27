/** Absolute http(s) URL with host — shared by Zod and service layer. */
export function parseAbsoluteHttpUrl(raw: string): string {
  const trimmed = raw.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error('Invalid app URL');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('App URL must use http or https');
  }
  if (!parsed.host) {
    throw new Error('Invalid app URL');
  }
  return trimmed;
}
