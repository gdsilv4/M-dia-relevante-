import type { CookieOptions } from '@supabase/ssr'

export type LoginState = { error: string | null }

// Cookie que o Supabase pede para gravar (usado nas funções setAll).
export type CookieParaGravar = { name: string; value: string; options?: CookieOptions }

export type Profile = {
  id: string
  email: string | null
  full_name: string | null
  role_key: string | null
  is_active: boolean
}
