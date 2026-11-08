"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { inviteUser, resetPassword, updateMember } from "@/app/actions/team";
import { useApp } from "@/components/app-provider";
import { IconPlus } from "@/components/icons";
import { Avatar, Badge, Modal } from "@/components/ui";
import { ASSIGNABLE_ROLES, ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/lib/permissions";
import type { Profile, RoleKey } from "@/lib/types";

function tempPassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = new Uint32Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export default function TeamClient({ members }: { members: Profile[] }) {
  const { profile, toast } = useApp();
  const router = useRouter();
  const [invite, setInvite] = useState(false);
  const [reset, setReset] = useState<Profile | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function patch(m: Profile, p: { role_key?: RoleKey; is_active?: boolean }) {
    setBusyId(m.id);
    const r = await updateMember({ id: m.id, ...p });
    setBusyId(null);
    if ("error" in r) return toast(r.error, "error");
    toast(r.message ?? "Atualizado.", "success");
    router.refresh();
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Equipe</h1>
          <p>Usuários, funções e acessos. Não há cadastro público: só você cria contas.</p>
        </div>
        <button className="btn" type="button" onClick={() => setInvite(true)}>
          <IconPlus /> Adicionar pessoa
        </button>
      </div>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Pessoa</th>
              <th>Função</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const self = m.id === profile.id;
              return (
                <tr key={m.id}>
                  <td>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <Avatar name={m.full_name || m.email} />
                      <div>
                        <div style={{ fontWeight: 600 }}>{m.full_name || "Sem nome"}{self && " (você)"}</div>
                        <div className="muted small">{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <select
                      className="input"
                      style={{ minWidth: 150 }}
                      value={m.role_key ?? ""}
                      disabled={busyId === m.id}
                      onChange={(e) => patch(m, { role_key: e.target.value as RoleKey })}
                      aria-label={`Função de ${m.full_name ?? m.email}`}
                    >
                      {!m.role_key && <option value="">Sem função</option>}
                      {ASSIGNABLE_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </select>
                  </td>
                  <td>
                    <Badge color={m.is_active ? "#15803D" : "#6B7280"}>{m.is_active ? "Ativo" : "Desativado"}</Badge>
                    {m.must_change_password && <div className="hint">Ainda não trocou a senha</div>}
                  </td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <button className="btn secondary sm" type="button" onClick={() => setReset(m)} disabled={self}>
                      Nova senha
                    </button>{" "}
                    <button
                      className={`btn sm ${m.is_active ? "danger" : ""}`}
                      type="button"
                      disabled={busyId === m.id || self}
                      onClick={() => patch(m, { is_active: !m.is_active })}
                    >
                      {m.is_active ? "Desativar" : "Ativar"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ marginBottom: 10 }}>O que cada função pode fazer</h2>
        <div className="grid cols-2 stack">
          {ASSIGNABLE_ROLES.map((r) => (
            <div key={r}>
              <b>{ROLE_LABELS[r]}</b>
              <p className="muted small">{ROLE_DESCRIPTIONS[r]}</p>
            </div>
          ))}
        </div>
      </div>

      {invite && <InviteModal onClose={() => setInvite(false)} />}
      {reset && <ResetModal member={reset} onClose={() => setReset(null)} />}
    </>
  );
}

function InviteModal({ onClose }: { onClose: () => void }) {
  const { toast } = useApp();
  const router = useRouter();
  const [f, setF] = useState({ full_name: "", email: "", role_key: "colaborador" as RoleKey, password: tempPassword() });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function save() {
    setError(null);
    setBusy(true);
    const r = await inviteUser(f);
    setBusy(false);
    if ("error" in r) return setError(r.error);
    router.refresh();
    setDone(true);
  }

  if (done) {
    return (
      <Modal title="Pessoa adicionada" onClose={onClose} footer={<button className="btn" type="button" onClick={onClose}>Concluir</button>}>
        <p>Envie estes dados para <b>{f.full_name}</b> (por um canal seguro):</p>
        <div className="card" style={{ background: "var(--cream)", boxShadow: "none", margin: "12px 0" }}>
          <div><span className="muted small">E-mail</span><br /><b>{f.email}</b></div>
          <div style={{ marginTop: 8 }}><span className="muted small">Senha temporária</span><br /><b style={{ fontFamily: "monospace", fontSize: 17 }}>{f.password}</b></div>
        </div>
        <p className="hint">No primeiro acesso, a pessoa será obrigada a criar uma senha própria. Esta senha não será exibida de novo.</p>
        <button
          className="btn secondary sm"
          type="button"
          style={{ marginTop: 10 }}
          onClick={() => {
            navigator.clipboard?.writeText(`Painel de Mídia\nE-mail: ${f.email}\nSenha temporária: ${f.password}`).then(
              () => toast("Copiado.", "success"),
              () => toast("Não foi possível copiar.", "error"),
            );
          }}
        >
          Copiar dados
        </button>
      </Modal>
    );
  }

  return (
    <Modal
      title="Adicionar pessoa"
      onClose={onClose}
      footer={
        <>
          <button className="btn secondary" type="button" onClick={onClose}>Cancelar</button>
          <button className="btn" type="button" onClick={save} disabled={busy}>{busy ? "Criando…" : "Criar acesso"}</button>
        </>
      }
    >
      <div className="field">
        <label htmlFor="u-name">Nome</label>
        <input id="u-name" className="input" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} autoFocus />
      </div>
      <div className="field">
        <label htmlFor="u-email">E-mail</label>
        <input id="u-email" className="input" type="email" autoCapitalize="none" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      </div>
      <div className="field">
        <label htmlFor="u-role">Função</label>
        <select id="u-role" className="input" value={f.role_key} onChange={(e) => setF({ ...f, role_key: e.target.value as RoleKey })}>
          {ASSIGNABLE_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
        <span className="hint">{ROLE_DESCRIPTIONS[f.role_key]}</span>
      </div>
      <div className="field">
        <label htmlFor="u-pw">Senha temporária</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input id="u-pw" className="input" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
          <button type="button" className="btn secondary" onClick={() => setF({ ...f, password: tempPassword() })}>Gerar</button>
        </div>
        <span className="hint">A pessoa precisará trocá-la no primeiro acesso.</span>
      </div>
      {error && <p className="err" role="alert">{error}</p>}
    </Modal>
  );
}

function ResetModal({ member, onClose }: { member: Profile; onClose: () => void }) {
  const { toast } = useApp();
  const router = useRouter();
  const [password, setPassword] = useState(tempPassword());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function save() {
    setError(null);
    setBusy(true);
    const r = await resetPassword(member.id, password);
    setBusy(false);
    if ("error" in r) return setError(r.error);
    router.refresh();
    setDone(true);
  }

  return (
    <Modal
      title={`Nova senha · ${member.full_name || member.email}`}
      onClose={onClose}
      footer={
        done ? (
          <button className="btn" type="button" onClick={onClose}>Concluir</button>
        ) : (
          <>
            <button className="btn secondary" type="button" onClick={onClose}>Cancelar</button>
            <button className="btn" type="button" onClick={save} disabled={busy}>{busy ? "Salvando…" : "Redefinir senha"}</button>
          </>
        )
      }
    >
      {done ? (
        <>
          <p>Senha redefinida. Envie à pessoa por um canal seguro:</p>
          <p style={{ margin: "10px 0" }}><b style={{ fontFamily: "monospace", fontSize: 17 }}>{password}</b></p>
          <button className="btn secondary sm" type="button" onClick={() => navigator.clipboard?.writeText(password).then(() => toast("Copiado.", "success"), () => {})}>Copiar</button>
          <p className="hint" style={{ marginTop: 10 }}>No próximo acesso, será pedido que ela crie uma senha própria.</p>
        </>
      ) : (
        <div className="field">
          <label htmlFor="r-pw">Senha temporária</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input id="r-pw" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" className="btn secondary" onClick={() => setPassword(tempPassword())}>Gerar</button>
          </div>
          {error && <p className="err" role="alert">{error}</p>}
        </div>
      )}
    </Modal>
  );
}
