import type { Metadata } from "next";
import { signOut } from "@/app/actions/auth";

export const metadata: Metadata = { title: "Sem acesso" };

export default function NoAccessPage() {
  return (
    <div className="center-page">
      <div className="card">
        <h2>Acesso não liberado</h2>
        <p className="muted" style={{ margin: "6px 0 18px" }}>
          Sua conta existe, mas está desativada ou ainda não tem uma função. Fale com o administrador do Painel de Mídia.
        </p>
        <form action={signOut}>
          <button className="btn secondary" style={{ width: "100%" }}>Sair</button>
        </form>
      </div>
    </div>
  );
}
