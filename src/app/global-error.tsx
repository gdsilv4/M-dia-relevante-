"use client";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <html lang="pt-BR">
      <body style={{ background: "#f0ebdd", color: "#101b35", fontFamily: "sans-serif", padding: 24 }}>
        <h2>Algo deu errado</h2>
        <p>Código: {error.digest ?? error.message}</p>
        <p><a href="/login">Voltar ao login</a></p>
      </body>
    </html>
  );
}
