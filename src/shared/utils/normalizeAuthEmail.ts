/** Normaliza email para login/registro (trim + minúsculas). */
export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase();
}
