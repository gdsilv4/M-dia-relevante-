import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { dataPorExtenso, primeiroNome, saudacao } from '@/lib/format'
import { TIME_ZONE } from '@/lib/config'

export const metadata: Metadata = { title: 'Início' }
export const dynamic = 'force-dynamic'

function hojeLocal() {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const valor = (tipo: string) => partes.find((parte) => parte.type === tipo)?.value ?? ''
  return `${valor('year')}-${valor('month')}-${valor('day')}`
}

export default async function InicioPage() {
  const { user, profile } = await getCurrentUser()
  const nome = primeiroNome(profile?.full_name ?? null, profile?.email ?? user?.email ?? null)
  const supabase = await createClient()
  const [escalaResult, equipeResult] = await Promise.all([
    supabase
      .from('media_schedule_assignments')
      .select('id, activity, responsibility, team_member_id')
      .eq('shift_date', hojeLocal())
      .order('activity'),
    supabase.from('media_team_members').select('id, full_name, area').eq('is_active', true),
  ])
  const pessoas = new Map((equipeResult.data ?? []).map((pessoa) => [pessoa.id, pessoa]))

  return (
    <>
      <header className="page-head">
        <p className="page-data">{dataPorExtenso()}</p>
        <h1>
          {saudacao()}, {nome}
        </h1>
        <p>Veja a escala de hoje ou organize quem fica responsável por cada atividade.</p>
      </header>

      <div className="grid grid-2">
        <section className="card">
          <h2>Escala de hoje</h2>
          {escalaResult.error ? (
            <p className="vazio">A escala precisa da migração 0002 no Supabase antes de aparecer aqui.</p>
          ) : escalaResult.data?.length ? (
            <ul className="member-list">
              {escalaResult.data.map((item) => {
                const pessoa = pessoas.get(item.team_member_id)
                return (
                  <li key={item.id} className="member-row">
                    <div>
                      <strong>{item.activity} · {item.responsibility}</strong>
                      <span>{pessoa ? `${pessoa.full_name} · ${pessoa.area}` : 'Responsável não encontrado'}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="vazio">Nenhuma responsabilidade cadastrada para hoje.</p>
          )}
          <Link className="btn-secundario btn-link" href="/calendario">Montar ou ajustar a escala</Link>
        </section>
        <section className="card">
          <h2>Equipe ativa</h2>
          <p className="vazio">
            {equipeResult.error ? 'Não foi possível carregar a equipe.' : `${equipeResult.data?.length ?? 0} integrante(s) ativo(s).`}
          </p>
          <Link className="btn-secundario btn-link" href="/equipe">Gerenciar integrantes</Link>
        </section>
      </div>
    </>
  )
}
