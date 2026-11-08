"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("A senha precisa ter pelo menos 8 caracteres.");
    if (password !== confirm) return setError("As senhas não coincidem.");
    setLoading(true);
    const supabase = createClient();
    const { error: upErr } = await supabase.auth.updateUser({ password });
    if (upErr) {
      setLoading(false);
      return setError(/same|different/i.test(upErr.message) ? "Escolha uma senha diferente da atual." : "Não foi possível alterar a senha.");
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) await supabase.from("profiles").update({ must_change_password: false }).eq("id", user.id);
    router.replace("/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="field">
        <label htmlFor="pw">Nova senha</label>
        <input id="pw" className="input" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <span className="hint">Mínimo de 8 caracteres.</span>
      </div>
      <div className="field">
        <label htmlFor="pw2">Repita a senha</label>
        <input id="pw2" className="input" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>
      {error && <p className="err" role="alert">{error}</p>}
      <button className="btn" style={{ width: "100%" }} disabled={loading}>
        {loading ? "Salvando…" : "Salvar senha"}
      </button>
    </form>
  );
}
