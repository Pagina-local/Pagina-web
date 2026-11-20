import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Runtime fallback: the published site (universo22.lat) can inject the
 * credentials via window.__SUPABASE_CONFIG__ in index.html when the GitHub
 * Actions build runs without VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.
 */
declare global {
  interface Window {
    __SUPABASE_CONFIG__?: { url?: string; anonKey?: string };
  }
}

const url = import.meta.env.VITE_SUPABASE_URL
  || (typeof window !== 'undefined' ? window.__SUPABASE_CONFIG__?.url : undefined)
  || '';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  || (typeof window !== 'undefined' ? window.__SUPABASE_CONFIG__?.anonKey : undefined)
  || '';

export const isSupabaseConfigured = Boolean(url && anonKey);

const notConfiguredMessage =
  'La base de datos no está configurada en esta instalación. Falta VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY en la compilación.';

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(url, anonKey)
  : (new Proxy({} as SupabaseClient, {
      get() {
        // Chainable no-op: every call returns another no-op that awaits to a
        // controlled error result, never a TypeError crash.
        const noop: unknown = new Proxy(function () {}, {
          get(_t, prop) {
            if (prop === 'then') {
              return (resolve: (v: unknown) => void) => resolve({
                data: null,
                error: { message: notConfiguredMessage, code: 'SUPABASE_NOT_CONFIGURED' },
              });
            }
            return () => noop;
          },
          apply() {
            return noop;
          },
        });
        return noop;
      },
    }) as unknown as SupabaseClient);

if (!isSupabaseConfigured) {
  console.error(
    'Supabase env vars missing. The site will run with fallback data and saving/deleting will not persist. '
    + 'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY at build time (GitHub Actions secrets) '
    + 'or via window.__SUPABASE_CONFIG__ in index.html before the bundle loads.',
  );
}
