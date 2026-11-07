import type { Metadata } from 'next'
import { getCurrentUser } from '@/lib/auth'
import { dataPorExtenso, primeiroNome, saudacao } from '@/lib/format'

export const metadata: Metadata = { title: 'Início' }

const SECOES = [
  { titulo: 'Esta semana', texto: 'Nenhum evento nesta semana.' },
  { titulo: 'Próxima semana', texto: 'Nenhum evento na próxima semana.' },
  { titulo: 'Eventos anteriores', texto: 'Nenhum evento anterior registrado.' },
]

export default async function InicioPage() {
  const { user, profile } = await getCurrentUser()
  const nome = primeiroNome(profile?.full_name ?? null, profile?.email ?? user?.email ?? null)

  return (
    <>
      <header className="page-head">
        <p className="page-data">{dataPorExtenso()}</p>
        <h1>
          {saudacao()}, {nome}
        </h1>
        <p>Aqui você vai acompanhar os eventos, os conteúdos do mês e as demandas de design.</p>
      </header>

      <div className="grid">
        {SECOES.map((secao) => (
          <section key={secao.titulo} className="card">
            <h2>{secao.titulo}</h2>
            <p className="vazio">{secao.texto}</p>
          </section>
        ))}
      </div>

      <div className="grid grid-2">
        <section className="card">
          <h2>Conteúdos do mês</h2>
          <p className="vazio">O planejamento de conteúdo chega na Etapa 3.</p>
        </section>
        <section className="card">
          <h2>Demandas de design</h2>
          <p className="vazio">As demandas e os prazos chegam na Etapa 4.</p>
        </section>
      </div>
    </>
  )
}
