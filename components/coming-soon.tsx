export function ComingSoon({
  titulo,
  descricao,
  etapa,
}: {
  titulo: string
  descricao: string
  etapa: string
}) {
  return (
    <>
      <header className="page-head">
        <h1>{titulo}</h1>
        <p>{descricao}</p>
      </header>
      <section className="card empty">
        <span className="badge">Em breve · {etapa}</span>
        <p>Esta área ainda não foi construída. Ela será desenvolvida na {etapa.toLowerCase()} do projeto.</p>
      </section>
    </>
  )
}
