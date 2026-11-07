import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabaseEnv } from '@/lib/supabase/env'

// Cliente do Supabase para uso no servidor (páginas, layouts e ações).
// A sessão fica em cookies; as regras de acesso do banco (RLS) valem para este cliente.
export async function createClient() {
  const env = getSupabaseEnv()
  if (!env) {
    throw new Error('Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }

  const cookieStore = await cookies()

  return createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Chamado a partir de um Server Component: o middleware já renova a sessão.
        }
      },
    },
  })
}
