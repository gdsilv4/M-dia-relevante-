import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types'

// Usuário logado + perfil (função e se a conta está ativa).
// "cache" evita consultar o banco duas vezes na mesma requisição.
export const getCurrentUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { user: null, profile: null, failed: false }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role_key, is_active')
    .eq('id', user.id)
    .maybeSingle()

  return { user, profile: (data as Profile | null) ?? null, failed: Boolean(error) }
})
