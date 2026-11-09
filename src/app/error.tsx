"use client";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="center-page">
      <div className="card" style={{ color: "#101b35" }}>
        <h2>Algo deu errado</h2>
        <p className="muted" style={{ margin: "8px 0 14px" }}>Não foi possível carregar esta tela. Tente de novo; se continuar, envie este código ao administrador.</p>
        <p className="small" style={{ wordBreak: "break-all", marginBottom: 14 }}>Código: {error.digest ?? error.message}</p>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => reset()}>Tentar de novo</button>
          <a className="btn secondary" href="/login">Voltar ao login</a>
        </div>
      </div>
    </div>
  );
}
