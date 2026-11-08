import { redirect } from 'next/navigation'
import { AppNav } from '@/components/app-nav'
import { Wordmark } from '@/components/brand'
import { getCurrentUser } from '@/lib/auth'
import { getSupabaseEnv } from '@/lib/supabase/env'
import { primeiroNome } from '@/lib/format'

// Toda a área logada depende do usuário de cada requisição: nunca gerar de forma estática.
export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!getSupabaseEnv()) redirect('/login')

  const { user, profile } = await getCurrentUser()
  if (!user) redirect('/login')
  // Só entra quem tem perfil ativo. Contas novas ficam inativas até o administrador liberar.
  if (!profile || !profile.is_active) redirect('/sem-acesso')

  const nome = primeiroNome(profile.full_name, profile.email ?? user.email ?? null)

  return (
    <div className="shell">
      <AppNav nome={nome} email={profile.email ?? user.email ?? ''} />
      <div className="main">
        <header className="topbar">
          <Wordmark size={22} />
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  )
}
