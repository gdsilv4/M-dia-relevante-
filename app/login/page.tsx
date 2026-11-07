import type { Metadata } from 'next'
import { Wordmark } from '@/components/brand'
import { APP_NAME } from '@/lib/config'
import { getSupabaseEnv } from '@/lib/supabase/env'
import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Entrar' }

export default function LoginPage() {
  const configurado = getSupabaseEnv() !== null

  return (
    <main className="login-screen">
      <div className="login-top">
        <Wordmark size={34} />
        <p>{APP_NAME}</p>
      </div>

      <section className="login-card">
        <h1>Entrar</h1>
        <p className="login-sub">Acesso restrito à equipe. Não há cadastro público.</p>
        <LoginForm configurado={configurado} />
      </section>

      <p className="login-rodape">Se precisar de acesso, fale com o administrador.</p>
    </main>
  )
}
