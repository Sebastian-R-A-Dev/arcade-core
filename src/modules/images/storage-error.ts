/** Añade contexto cuando Storage falla por RLS (clave distinta de service_role). */
export function formatSupabaseStorageError(message: string): string {
  const m = message.toLowerCase();
  if (
    m.includes('row-level security') ||
    m.includes('rls policy') ||
    m.includes('new row violates')
  ) {
    return `${message} — En ArcadeCore usa SUPABASE_KEY con la clave service_role del proyecto (Settings → API), no la publishable/anon.`;
  }
  return message;
}
