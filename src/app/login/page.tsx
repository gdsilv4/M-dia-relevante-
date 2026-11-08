import type { Metadata } from "next";
import { LogoMark } from "@/components/icons";
import LoginForm from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return (
    <div className="login">
      <section className="login-art">
        <LogoMark size={64} />
        <h1>
          <span className="thin">IGREJA</span> <b>RELEVANTE</b>
        </h1>
        <p>Painel de Mídia: planejamento de conteúdo, demandas de design e publicações em um só lugar.</p>
      </section>
      <section className="login-form">
        <div className="login-box">
          <h2>Entrar</h2>
          <p className="muted">Acesso restrito à equipe de mídia.</p>
          <LoginForm next={safeNext} />
          <p className="small muted" style={{ marginTop: 18 }}>
            Não há cadastro público. Se precisa de acesso, fale com o administrador.
          </p>
        </div>
      </section>
    </div>
  );
}
