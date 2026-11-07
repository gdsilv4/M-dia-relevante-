'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseEnv } from '@/lib/supabase/env'
import type { LoginState } from '@/lib/types'

export async function signIn(_estadoAnterior: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { error: 'Informe o e-mail e a senha.' }
  }
  if (!getSupabaseEnv()) {
    return { error: 'O sistema ainda não foi configurado. Veja as instruções de configuração do Supabase.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Mensagem genérica de propósito: não revela se o e-mail existe.
    return { error: 'E-mail ou senha incorretos.' }
  }

  redirect('/')
}

export async function signOut(): Promise<void> {
  if (getSupabaseEnv()) {
    const supabase = await createClient()
    await supabase.auth.signOut()
  }
  redirect('/login')
}
