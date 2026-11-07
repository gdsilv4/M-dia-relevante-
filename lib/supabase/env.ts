// Lê as variáveis públicas do Supabase. Devolve null se ainda não foram configuradas,
// para o app mostrar um aviso em vez de quebrar.
export function getSupabaseEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) return null
  return { url, key }
}
