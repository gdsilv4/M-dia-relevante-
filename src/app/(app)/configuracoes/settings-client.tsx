"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteLookup, saveLookup, type LookupTable } from "@/app/actions/settings";
import { useApp } from "@/components/app-provider";
import { IconPlus, IconTrash } from "@/components/icons";
import type { Format, Platform, Status } from "@/lib/types";

type Tab = "content_statuses" | "design_statuses" | "content_formats" | "platforms" | "integracoes";

const TABS: { key: Tab; label: string }[] = [
  { key: "content_statuses", label: "Status de conteúdo" },
  { key: "design_statuses", label: "Status de design" },
  { key: "content_formats", label: "Formatos" },
  { key: "platforms", label: "Plataformas" },
  { key: "integracoes", label: "Integrações" },
];

export default function SettingsClient() {
  const { lookups } = useApp();
  const [tab, setTab] = useState<Tab>("content_statuses");

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Configurações</h1>
          <p>Status, formatos e plataformas usados em todo o painel.</p>
        </div>
      </div>
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.key} type="button" role="tab" className={tab === t.key ? "on" : ""} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "content_statuses" && <LookupEditor table="content_statuses" rows={lookups.statuses} withFinal withShare />}
      {tab === "design_statuses" && <LookupEditor table="design_statuses" rows={lookups.designStatuses} withFinal />}
      {tab === "content_formats" && <LookupEditor table="content_formats" rows={lookups.formats} />}
      {tab === "platforms" && <LookupEditor table="platforms" rows={lookups.platforms} plain />}
      {tab === "integracoes" && <Integrations />}
    </>
  );
}

type Row = Status | Format | Platform;

function LookupEditor({
  table,
  rows,
  withFinal,
  withShare,
  plain,
}: {
  table: LookupTable;
  rows: Row[];
  withFinal?: boolean;
  withShare?: boolean;
  plain?: boolean;
}) {
  const { toast } = useApp();
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function update(row: Row, patch: Partial<Status> & Partial<Format>) {
    setBusy(row.key);
    const r = await saveLookup({ table, key: row.key, name: patch.name ?? row.name, ...patch });
    setBusy(null);
    if ("error" in r) return toast(r.error, "error");
    router.refresh();
  }

  async function add() {
    if (!newName.trim()) return;
    setBusy("new");
    const next = rows.length ? Math.max(...rows.map((r) => ("sort_order" in r ? r.sort_order : 0))) + 1 : 0;
    const r = await saveLookup({ table, name: newName, color: "#2457D6", sort_order: next, is_active: true });
    setBusy(null);
    if ("error" in r) return toast(r.error, "error");
    setNewName("");
    toast("Adicionado.", "success");
    router.refresh();
  }

  async function remove(row: Row) {
    if (!confirm(`Remover “${row.name}”? Se estiver em uso, desative em vez de remover.`)) return;
    const r = await deleteLookup(table, row.key);
    if ("error" in r) return toast(r.error, "error");
    toast("Removido.", "success");
    router.refresh();
  }

  return (
    <div className="card">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {!plain && <th>Ordem</th>}
              {!plain && <th>Cor</th>}
              <th>Nome</th>
              {withFinal && <th>Etapa final</th>}
              {withShare && <th>No link público</th>}
              <th>Ativo</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const s = r as Status;
              return (
                <tr key={r.key}>
                  {!plain && (
                    <td>
                      <input
                        className="input"
                        type="number"
                        style={{ width: 70 }}
                        defaultValue={s.sort_order}
                        aria-label="Ordem"
                        onBlur={(e) => Number(e.target.value) !== s.sort_order && update(r, { sort_order: Number(e.target.value) })}
                      />
                    </td>
                  )}
                  {!plain && (
                    <td>
                      <input type="color" defaultValue={s.color} aria-label="Cor" style={{ width: 42, height: 36, border: 0, background: "none", padding: 0 }} onBlur={(e) => e.target.value !== s.color && update(r, { color: e.target.value })} />
                    </td>
                  )}
                  <td>
                    <input
                      className="input"
                      defaultValue={r.name}
                      maxLength={60}
                      aria-label="Nome"
                      onBlur={(e) => e.target.value.trim() && e.target.value !== r.name && update(r, { name: e.target.value })}
                    />
                  </td>
                  {withFinal && (
                    <td><input type="checkbox" checked={!!s.is_final} disabled={busy === r.key} onChange={(e) => update(r, { is_final: e.target.checked })} aria-label="Etapa final" /></td>
                  )}
                  {withShare && (
                    <td><input type="checkbox" checked={s.share_visible !== false} disabled={busy === r.key} onChange={(e) => update(r, { share_visible: e.target.checked })} aria-label="Aparece no link público" /></td>
                  )}
                  <td><input type="checkbox" checked={r.is_active} disabled={busy === r.key} onChange={(e) => update(r, { is_active: e.target.checked })} aria-label="Ativo" /></td>
                  <td style={{ textAlign: "right" }}>
                    <button className="btn ghost icon" type="button" onClick={() => remove(r)} aria-label={`Remover ${r.name}`}><IconTrash /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
        <input className="input" style={{ maxWidth: 300 }} placeholder="Adicionar novo…" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} aria-label="Nome do novo item" />
        <button className="btn" type="button" onClick={add} disabled={busy === "new" || !newName.trim()}><IconPlus /> Adicionar</button>
      </div>
      <p className="hint" style={{ marginTop: 12 }}>
        {withShare && "“Etapa final” marca o fim do fluxo (some de pendentes e atrasos). “No link público” define se publicações neste status aparecem para quem recebe o link. "}
        {plain && "Instagram é a plataforma inicial. Outras plataformas ficam disponíveis para planejamento; a publicação automática não está ativa."}
      </p>
    </div>
  );
}

function Integrations() {
  return (
    <div className="grid cols-2 stack">
      <section className="card">
        <h2>Instagram / Meta</h2>
        <p style={{ margin: "8px 0" }}><span className="badge" style={{ background: "#eceff4", color: "#5d6781" }}><i />Não conectado</span></p>
        <p className="muted">
          O painel hoje <b>planeja e organiza</b> as publicações; ele <b>não publica sozinho</b> no Instagram. A publicação automática exige um app na Meta (Graph API), conta profissional do Instagram vinculada a uma Página do Facebook, permissões aprovadas e revisão do app. Quando isso for contratado e autorizado, a integração é ligada aqui, sem refazer o que já existe.
        </p>
      </section>
      <section className="card">
        <h2>Outras plataformas</h2>
        <p className="muted" style={{ marginTop: 8 }}>
          A estrutura já aceita várias plataformas (aba Plataformas). Cada integração futura dependerá da API oficial e das permissões da respectiva rede.
        </p>
      </section>
    </div>
  );
}
