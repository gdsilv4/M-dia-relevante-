"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import LoginForm from "./login-form";

export default function AuthPanel({ next }: { next: string }) {
  const [tab, setTab] = useState<"entrar" | "solicitar">("entrar");
  return (
    <>
      <div className="tabs" role="tablist" style={{ marginTop: 18 }}>
        <button type="button" role="tab" className={tab === "entrar" ? "on" : ""} onClick={() => setTab("entrar")}>
          Entrar
        </button>
        <button type="button" role="tab" className={tab === "solicitar" ? "on" : ""} onClick={() => setTab("solicitar")}>
          Solicitar acesso
        </button>
      </div>
      {tab === "entrar" ? (
        <>
          <LoginForm next={next} />
          <p className="small muted" style={{ marginTop: 18 }}>
            Ainda não tem conta? Use a aba “Solicitar acesso”. O administrador precisa aprovar antes de você entrar.
          </p>
        </>
      ) : (
        <RequestForm onDone={() => setTab("entrar")} />
      )}
    </>
  );
}

function RequestForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // armadilha para robôs: pessoas não preenchem
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) return setError("Informe seu nome.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setError("Informe um e-mail válido.");
    if (website) {
      setSent(true); // finge sucesso para robôs
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.rpc("request_access", {
      p_name: name.trim(),
      p_email: email.trim(),
      p_message: message.trim() || null,
    });
    setLoading(false);
    if (err) return setError(err.message.length < 160 ? err.message : "Não foi possível enviar. Tente novamente.");
    setSent(true);
  }

  if (sent) {
    return (
      <div style={{ padding: "18px 0" }}>
        <h3>Solicitação enviada</h3>
        <p className="muted" style={{ margin: "8px 0 14px" }}>
          O administrador vai analisar o seu pedido. Se for aprovado, ele envia a você o e-mail e uma senha temporária para entrar. Você ainda não tem acesso.
        </p>
        <button type="button" className="btn secondary" onClick={onDone}>Voltar para entrar</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="field" style={{ marginTop: 14 }}>
        <label htmlFor="rq-name">Nome completo</label>
        <input id="rq-name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={100} />
      </div>
      <div className="field">
        <label htmlFor="rq-email">E-mail</label>
        <input id="rq-email" className="input" type="email" inputMode="email" autoCapitalize="none" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="rq-msg">Qual é a sua função na mídia? (opcional)</label>
        <textarea id="rq-msg" className="input" style={{ minHeight: 70 }} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} placeholder="Ex.: designer, social media, fotografia…" />
      </div>
      <div aria-hidden="true" style={{ position: "absolute", left: -9999, height: 0, overflow: "hidden" }}>
        <label>Não preencha<input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
      </div>
      {error && <p className="err" role="alert">{error}</p>}
      <button className="btn" style={{ width: "100%", marginTop: 6 }} disabled={loading}>
        {loading ? "Enviando…" : "Enviar solicitação"}
      </button>
      <p className="hint" style={{ marginTop: 10 }}>Enviar o pedido não cria conta nem libera acesso. Só o administrador aprova.</p>
    </form>
  );
}
