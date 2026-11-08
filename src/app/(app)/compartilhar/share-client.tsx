"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createShareLink, revokeShareLink } from "@/app/actions/share";
import { useApp } from "@/components/app-provider";
import { IconCopy, IconLink } from "@/components/icons";
import { Badge, Empty } from "@/components/ui";
import { capitalize, formatDateBR, monthLabel, todayISO } from "@/lib/dates";
import type { ShareLink } from "@/lib/types";

export default function ShareClient({ links }: { links: ShareLink[] }) {
  const { toast } = useApp();
  const router = useRouter();
  const [month, setMonth] = useState(todayISO().slice(0, 7));
  const [label, setLabel] = useState("");
  const [includeDesign, setIncludeDesign] = useState(true);
  const [expires, setExpires] = useState("");
  const [busy, setBusy] = useState(false);

  const urlOf = (l: ShareLink) => `${window.location.origin}/c/${l.token}`;

  async function create() {
    setBusy(true);
    const r = await createShareLink({
      month: `${month}-01`,
      label: label || `Calendário de ${monthLabel(`${month}-01`)}`,
      include_design: includeDesign,
      expires_at: expires || null,
    });
    setBusy(false);
    if ("error" in r) return toast(r.error, "error");
    toast("Link criado.", "success");
    setLabel("");
    router.refresh();
  }

  async function copy(l: ShareLink) {
    try {
      await navigator.clipboard.writeText(urlOf(l));
      toast("Link copiado.", "success");
    } catch {
      toast("Não foi possível copiar. Selecione o link e copie manualmente.", "error");
    }
  }

  async function revoke(l: ShareLink) {
    if (!confirm("Revogar este link? Quem tiver o endereço deixará de conseguir abrir.")) return;
    const r = await revokeShareLink(l.id);
    if ("error" in r) return toast(r.error, "error");
    toast(r.message ?? "Link revogado.", "success");
    router.refresh();
  }

  const expired = (l: ShareLink) => !!l.expires_at && new Date(l.expires_at) < new Date();

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Compartilhar</h1>
          <p>Gere um link somente leitura do calendário de um mês, ideal para os designers.</p>
        </div>
      </div>

      <div className="grid cols-2 stack" style={{ alignItems: "start" }}>
        <section className="card">
          <h2 style={{ marginBottom: 12 }}>Novo link</h2>
          <div className="row">
            <div className="field">
              <label htmlFor="s-month">Mês compartilhado</label>
              <input id="s-month" className="input" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="s-exp">Válido até (opcional)</label>
              <input id="s-exp" className="input" type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="s-label">Nome do link</label>
            <input id="s-label" className="input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex.: Calendário para designers" />
          </div>
          <label style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 14 }}>
            <input type="checkbox" checked={includeDesign} onChange={(e) => setIncludeDesign(e.target.checked)} style={{ marginTop: 4 }} />
            <span>
              Incluir prazos das demandas de design
              <span className="hint" style={{ display: "block" }}>Mostra nome, texto da arte, formato, dimensões e prazo, sem nomes da equipe.</span>
            </span>
          </label>
          <button className="btn" type="button" onClick={create} disabled={busy || !month}>
            <IconLink /> {busy ? "Gerando…" : "Gerar link"}
          </button>
          <p className="hint" style={{ marginTop: 12 }}>
            O link mostra só publicações com status liberado para compartilhamento (ideias e cancelados ficam de fora). Legendas, observações internas, responsáveis e arquivos nunca aparecem.
          </p>
        </section>

        <section className="card">
          <h2 style={{ marginBottom: 12 }}>Links criados</h2>
          {links.length === 0 ? (
            <Empty icon={<IconLink />} title="Nenhum link ainda">
              <p className="small">Os links gerados aparecem aqui, com opção de copiar e revogar.</p>
            </Empty>
          ) : (
            <div className="list">
              {links.map((l) => {
                const off = !!l.revoked_at || expired(l);
                return (
                  <div className="list-item" key={l.id} style={{ cursor: "default", alignItems: "flex-start", flexWrap: "wrap" }}>
                    <div className="grow">
                      <div className="t">{l.label}</div>
                      <div className="meta">
                        <span>{capitalize(monthLabel(l.month))}</span>
                        {l.expires_at && <span>até {formatDateBR(l.expires_at.slice(0, 10))}</span>}
                        <Badge color={off ? "#6B7280" : "#15803D"}>{l.revoked_at ? "Revogado" : expired(l) ? "Expirado" : "Ativo"}</Badge>
                      </div>
                    </div>
                    {!off && (
                      <div className="actions">
                        <button className="btn secondary sm" type="button" onClick={() => copy(l)}><IconCopy /> Copiar</button>
                        <a className="btn secondary sm" href={`/c/${l.token}`} target="_blank" rel="noreferrer">Abrir</a>
                        <button className="btn danger sm" type="button" onClick={() => revoke(l)}>Revogar</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
