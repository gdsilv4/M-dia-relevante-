import type { Metadata } from 'next'
import { addScheduleAssignment, removeScheduleAssignment } from '@/app/actions/scale'
import { createClient } from '@/lib/supabase/server'
import { TIME_ZONE } from '@/lib/config'

export const metadata: Metadata = { title: 'Calendário' }
export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<{ date?: string; ok?: string; erro?: string }> }

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

function dataLegivel(date: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeZone: 'UTC' }).format(
    new Date(`${date}T12:00:00Z`),
  )
}

export default async function CalendarioPage({ searchParams }: Props) {
  const params = await searchParams
  const data = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : hojeLocal()
  const supabase = await createClient()
  const [{ data: integrantes, error: erroEquipe }, { data: escala, error: erroEscala }] = await Promise.all([
    supabase
      .from('media_team_members')
      .select('id, full_name, area')
      .eq('is_active', true)
      .order('full_name'),
    supabase
      .from('media_schedule_assignments')
      .select('id, shift_date, activity, responsibility, team_member_id, notes')
      .eq('shift_date', data)
      .order('activity')
      .order('responsibility'),
  ])
  const erroBanco = Boolean(erroEquipe || erroEscala)
  const nomes = new Map((integrantes ?? []).map((pessoa) => [pessoa.id, pessoa]))

  return (
    <>
      <header className="page-head">
        <p className="page-data">Escala de mídia · {dataLegivel(data)}</p>
        <h1>Organize a equipe</h1>
        <p>Cadastre cada responsabilidade e quem ficará responsável por ela.</p>
      </header>

      <form method="get" className="date-filter">
        <label className="campo">
          <span>Ver escala de outra data</span>
          <input type="date" name="date" defaultValue={data} />
        </label>
        <button className="btn-secundario btn-compact" type="submit">Ver data</button>
      </form>

      {erroBanco && (
        <p className="form-aviso" role="status">
          O banco ainda não está preparado. Execute a migração 0002_escala_midia.sql no SQL Editor do Supabase
          para salvar integrantes e escala.
        </p>
      )}
      {!erroBanco && params.ok && <p className="success-notice">Escala atualizada.</p>}
      {params.erro && (
        <p className="form-erro" role="alert">
          {params.erro === 'integrante'
            ? 'Escolha um integrante ativo. Para incluir pessoas, use a página Equipe.'
            : 'Não foi possível salvar. Confira os campos e tente novamente.'}
        </p>
      )}

      <section className="card form-card">
        <h2>Adicionar responsabilidade</h2>
        {integrantes && integrantes.length > 0 ? (
          <form action={addScheduleAssignment} className="form-grid">
            <input type="hidden" name="shift_date" value={data} />
            <label className="campo">
              <span>Atividade</span>
              <input name="activity" required maxLength={120} placeholder="Ex.: Culto de domingo" />
            </label>
            <label className="campo">
              <span>Responsabilidade</span>
              <input name="responsibility" required maxLength={100} placeholder="Ex.: Projeção, câmera, áudio" />
            </label>
            <label className="campo">
              <span>Responsável</span>
              <select name="team_member_id" required defaultValue="">
                <option value="" disabled>Selecione alguém</option>
                {integrantes.map((pessoa) => (
                  <option key={pessoa.id} value={pessoa.id}>{pessoa.full_name} · {pessoa.area}</option>
                ))}
              </select>
            </label>
            <label className="campo">
              <span>Observação (opcional)</span>
              <input name="notes" maxLength={300} placeholder="Horário de chegada ou orientação" />
            </label>
            <button className="btn-primario" type="submit" disabled={erroBanco}>Adicionar à escala</button>
          </form>
        ) : (
          <p className="vazio">
            {erroBanco
              ? 'Aplique a migração do Supabase e recarregue esta página.'
              : 'Cadastre pelo menos um integrante na página Equipe antes de montar a escala.'}
          </p>
        )}
      </section>

      <section className="card form-card">
        <h2>Responsabilidades do dia</h2>
        {!erroBanco && (!escala || escala.length === 0) ? (
          <p className="vazio">Nenhuma responsabilidade cadastrada para esta data.</p>
        ) : (
          <ul className="member-list">
            {(escala ?? []).map((item) => {
              const pessoa = nomes.get(item.team_member_id)
              return (
                <li key={item.id} className="member-row">
                  <div>
                    <strong>{item.activity} · {item.responsibility}</strong>
                    <span>{pessoa ? `${pessoa.full_name} · ${pessoa.area}` : 'Integrante não encontrado'}</span>
                    {item.notes && <span>{item.notes}</span>}
                  </div>
                  <form action={removeScheduleAssignment}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="shift_date" value={data} />
                    <button className="btn-secundario btn-compact" type="submit">Remover</button>
                  </form>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </>
  )
}
