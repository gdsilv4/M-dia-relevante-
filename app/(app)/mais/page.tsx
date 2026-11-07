import type { Metadata } from 'next'
import Link from 'next/link'
import { Icon, type IconName } from '@/components/icons'
import { signOut } from '@/app/actions/auth'

export const metadata: Metadata = { title: 'Mais' }

const ITENS: { href: string; label: string; texto: string; icon: IconName }[] = [
  { href: '/eventos', label: 'Eventos', texto: 'Cultos, conferências e programações', icon: 'event' },
  { href: '/equipe', label: 'Equipe', texto: 'Membros, funções e permissões', icon: 'team' },
  { href: '/compartilhar', label: 'Compartilhar', texto: 'Link do planejamento para o designer', icon: 'share' },
]

export default function MaisPage() {
  return (
    <>
      <header className="page-head">
        <h1>Mais</h1>
      </header>

      <nav className="lista-menu" aria-label="Outras áreas">
        {ITENS.map((item) => (
          <Link key={item.href} href={item.href} className="lista-item">
            <span className="lista-icone">
              <Icon name={item.icon} />
            </span>
            <span className="lista-texto">
              <strong>{item.label}</strong>
              <span>{item.texto}</span>
            </span>
          </Link>
        ))}
      </nav>

      <form action={signOut} className="mais-sair">
        <button type="submit" className="btn-secundario">
          <Icon name="logout" size={18} />
          <span>Sair da conta</span>
        </button>
      </form>
    </>
  )
}
