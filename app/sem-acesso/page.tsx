import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Wordmark } from '@/components/brand'
import { getCurrentUser } from '@/lib/auth'
import { getSupabaseEnv } from '@/lib/supabase/env'
import { signOut } from '@/app/actions/auth'

export const metadata: Metadata = { title: 'Sem acesso' }
export const dynamic = 'force-dynamic'

export default async function SemAcessoPage() {
  if (!getSupabaseEnv()) redirect('/login')

  const { user, profile, failed } = await getCurrentUser()
  if (!user) redirect('/login')
  if (profile && profile.is_active) redirect('/')

  return (
    <main className="login-screen">
      <div className="login-top">
        <Wordmark size={34} />
      </div>

      <section className="login-card">
        <h1>Conta sem acesso</h1>
        <p className="login-sub">
          Você entrou, mas esta conta ainda não tem permissão para usar o sistema. Peça ao administrador para ativá-la.
        </p>
        {(failed || !profile) && (
          <p className="form-aviso" role="status">
            Se você é o administrador e acabou de configurar o sistema, confira se o script SQL da pasta
            supabase/migrations foi executado <strong>antes</strong> de criar o seu usuário.
          </p>
        )}
        <form action={signOut}>
          <button type="submit" className="btn-primario">
            Sair
          </button>
        </form>
      </section>

      <p className="login-rodape" />
    </main>
  )
}
