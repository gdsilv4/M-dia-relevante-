import type { Metadata } from 'next'
import { addMember, setMemberActive } from '@/app/actions/scale'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Equipe' }
export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<{ ok?: string; erro?: string }> }

export default async function EquipePage({ searchParams }: Props) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: membros, error } = await supabase
    .from('media_team_members')
    .select('id, full_name, area, is_active')
    .order('is_active', { ascending: false })
    .order('full_name')

  return (
    <>
      <header className="page-head">
        <p className="page-data">Igreja Relevante</p>
        <h1>Equipe de mídia</h1>
        <p>Cadastre quem pode assumir uma responsabilidade na escala.</p>
      </header>

      {error && (
        <p className="form-aviso" role="status">
          O banco ainda não está preparado para a escala. A migração 0002_escala_midia.sql precisa ser executada
          no SQL Editor do Supabase.
        </p>
      )}
      {!error && params.ok && <p className="success-notice">Integrante atualizado.</p>}
      {params.erro && <p className="form-erro" role="alert">Não foi possível salvar. Confira os campos e tente novamente.</p>}

      <section className="card form-card">
        <h2>Novo integrante</h2>
        <form action={addMember} className="form-grid">
          <label className="campo">
            <span>Nome</span>
            <input name="name" required maxLength={100} placeholder="Nome da pessoa" />
          </label>
          <label className="campo">
            <span>Área da equipe</span>
            <input name="area" maxLength={60} defaultValue="Mídia" placeholder="Ex.: Câmera, Projeção" />
          </label>
          <button className="btn-primario" type="submit" disabled={Boolean(error)}>Adicionar integrante</button>
        </form>
      </section>

      <section className="card form-card">
        <h2>Integrantes cadastrados</h2>
        {!error && (!membros || membros.length === 0) ? (
          <p className="vazio">Ainda não há integrantes. Cadastre a equipe acima para começar a escala.</p>
        ) : (
          <ul className="member-list">
            {(membros ?? []).map((membro) => (
              <li key={membro.id} className="member-row">
                <div>
                  <strong>{membro.full_name}</strong>
                  <span>{membro.area}{membro.is_active ? '' : ' · Inativo'}</span>
                </div>
                <form action={setMemberActive}>
                  <input type="hidden" name="id" value={membro.id} />
                  <input type="hidden" name="is_active" value={String(!membro.is_active)} />
                  <button className="btn-secundario btn-compact" type="submit">
                    {membro.is_active ? 'Desativar' : 'Reativar'}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
