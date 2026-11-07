'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon, type IconName } from '@/components/icons'
import { Wordmark } from '@/components/brand'
import { signOut } from '@/app/actions/auth'

type Item = { href: string; label: string; icon: IconName }

// Barra lateral (telas grandes): todas as áreas.
const LATERAL: Item[] = [
  { href: '/', label: 'Início', icon: 'home' },
  { href: '/calendario', label: 'Calendário', icon: 'calendar' },
  { href: '/eventos', label: 'Eventos', icon: 'event' },
  { href: '/conteudo', label: 'Conteúdo', icon: 'content' },
  { href: '/design', label: 'Design', icon: 'design' },
  { href: '/equipe', label: 'Equipe', icon: 'team' },
  { href: '/compartilhar', label: 'Compartilhar', icon: 'share' },
]

// Menu inferior (celular): as quatro áreas principais + "Mais".
const INFERIOR: Item[] = [
  { href: '/', label: 'Início', icon: 'home' },
  { href: '/calendario', label: 'Calendário', icon: 'calendar' },
  { href: '/conteudo', label: 'Conteúdo', icon: 'content' },
  { href: '/design', label: 'Design', icon: 'design' },
]

const DENTRO_DE_MAIS = ['/mais', '/eventos', '/equipe', '/compartilhar']

function ativo(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(href + '/')
}

export function AppNav({ nome, email }: { nome: string; email: string }) {
  const pathname = usePathname()
  const maisAtivo = DENTRO_DE_MAIS.some((href) => ativo(pathname, href))

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Wordmark size={26} />
        </div>
        <nav className="sidebar-nav" aria-label="Navegação principal">
          {LATERAL.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={ativo(pathname, item.href) ? 'page' : undefined}
            >
              <Icon name={item.icon} size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="sidebar-user-info">
            <strong>{nome}</strong>
            <span>{email}</span>
          </div>
          <form action={signOut}>
            <button type="submit" className="btn-sair">
              <Icon name="logout" size={18} />
              <span>Sair</span>
            </button>
          </form>
        </div>
      </aside>

      <nav className="bottom-nav" aria-label="Navegação principal">
        {INFERIOR.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={ativo(pathname, item.href) ? 'page' : undefined}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </Link>
        ))}
        <Link href="/mais" aria-current={maisAtivo ? 'page' : undefined}>
          <Icon name="more" />
          <span>Mais</span>
        </Link>
      </nav>
    </>
  )
}
