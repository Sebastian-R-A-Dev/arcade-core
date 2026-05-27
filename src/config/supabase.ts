import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../shared/config/env.js';

let cached: SupabaseClient | null = null;
let warnedWeakSupabaseKey = false;

function warnIfWeakSupabaseKey(key: string): void {
  if (warnedWeakSupabaseKey) return;
  warnedWeakSupabaseKey = true;
  const k = key.trim();
  if (k.startsWith('sb_publishable_')) {
    console.warn(
      '[supabase] SUPABASE_KEY looks like a publishable key. Storage uploads will hit RLS errors; use the service_role secret (Dashboard → Settings → API → service_role).',
    );
  }
}

/**
 * Cliente singleton para Storage (subida/borrado).
 * Usa SUPABASE_URL + SUPABASE_KEY desde env (service_role recomendado en servidor).
 */
export function getSupabaseStorageClient(): SupabaseClient {
  if (!env.supabaseUrl || !env.supabaseKey) {
    throw new Error(
      'Supabase is not configured: set SUPABASE_URL (https://<ref>.supabase.co only) and SUPABASE_KEY (service_role for uploads)',
    );
  }
  warnIfWeakSupabaseKey(env.supabaseKey);
  if (!cached) {
    cached = createClient(env.supabaseUrl, env.supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
