"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateDesignStatus } from "@/app/actions/design";
import { useApp } from "@/components/app-provider";
import DesignModal from "@/components/design-modal";
import { IconBrush, IconPlus } from "@/components/icons";
import { Avatar, memberName } from "@/components/ui";
import { daysUntil, formatDateBR, todayISO } from "@/lib/dates";
import { can } from "@/lib/permissions";
import type { DesignRequest } from "@/lib/types";

export default function DesignClient({
  requests,
  contents,
  resp,
  mine,
}: {
  requests: DesignRequest[];
  contents: { id: string; title: string }[];
  resp: string;
  mine: boolean;
}) {
  const { profile, lookups, toast } = useApp();
  const router = useRouter();
  const [modal, setModal] = useState<{ req: DesignRequest | null; status?: string } | null>(null);
  const [moving, setMoving] = useState<string | null>(null);
  const today = todayISO();

  const go = (patch: { resp?: string; mine?: boolean }) => {
    const p = new URLSearchParams();
    const r = patch.resp ?? resp;
    const m = patch.mine ?? mine;
    if (r) p.set("resp", r);
    if (m) p.set("mine", "1");
    router.push(`/design${p.toString() ? `?${p}` : ""}`);
  };

  async function move(r: DesignRequest, status: string) {
    setMoving(r.id);
    const res = await updateDesignStatus(r.id, status);
    setMoving(null);
    if ("error" in res) return toast(res.error, "error");
    toast("Status atualizado.", "success");
    router.refresh();
  }

  const columns = lookups.designStatuses.filter((s) => s.is_active || requests.some((r) => r.status_key === s.key));
  const isDesigner = profile.role_key === "designer";

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Designers</h1>
          <p>Solicitações de artes, briefings, prazos e entregas.</p>
        </div>
        {can.createDesign(profile.role_key) && (
          <button className="btn" type="button" onClick={() => setModal({ req: null })}>
            <IconPlus /> Nova demanda
          </button>
        )}
      </div>

      <div className="filters">
        <select className="input" aria-label="Designer" value={resp} onChange={(e) => go({ resp: e.target.value })}>
          <option value="">Todos os designers</option>
          {lookups.team.filter((t) => t.role_key === "designer").map((t) => (
            <option key={t.id} value={t.id}>{t.full_name || "Sem nome"}</option>
          ))}
        </select>
        {isDesigner && (
          <button type="button" className={`btn sm ${mine ? "" : "secondary"}`} onClick={() => go({ mine: !mine })}>
            Só as minhas
          </button>
        )}
      </div>

      {requests.length === 0 ? (
        <div className="card empty">
          <IconBrush />
          <b>Nenhuma demanda de design</b>
          <p className="small">Crie uma solicitação com briefing, prazo e referências para o designer.</p>
        </div>
      ) : (
        <div className="board">
          {columns.map((col) => {
            const items = requests.filter((r) => r.status_key === col.key);
            return (
              <div className="col" key={col.key}>
                <div className="col-head">
                  <span style={{ color: col.color }}>● {col.name}</span>
                  <span className="count">{items.length}</span>
                </div>
                {items.length === 0 && <p className="muted small" style={{ padding: "6px 2px" }}>Nenhuma demanda</p>}
                {items.map((r) => {
                  const late = r.due_date && r.due_date < today && !col.is_final;
                  const left = r.due_date ? daysUntil(r.due_date, today) : null;
                  const allowMove = can.changeDesignStatus(profile.role_key, profile.id, r);
                  return (
                    <div className="kcard" key={r.id} style={{ opacity: moving === r.id ? 0.6 : 1 }}>
                      <button type="button" style={{ all: "unset", cursor: "pointer", display: "flex", flexDirection: "column", gap: 8 }} onClick={() => setModal({ req: r })}>
                        <span className="t">{r.title}</span>
                        <span className="meta">
                          {r.due_date && (
                            <span className={late ? "late" : ""}>
                              {late ? "Atrasada · " : "Prazo "}
                              {formatDateBR(r.due_date)}
                              {!late && left !== null && left <= 3 && !col.is_final ? ` (${left === 0 ? "hoje" : `${left}d`})` : ""}
                            </span>
                          )}
                          {r.dimensions && <span>{r.dimensions}</span>}
                          {r.format_label && <span>{r.format_label}</span>}
                        </span>
                        <span className="meta">
                          <Avatar small name={memberName(lookups.team, r.designer_id, "?")} />
                          {memberName(lookups.team, r.designer_id, "Sem designer")}
                        </span>
                      </button>
                      {allowMove && (
                        <select
                          className="input"
                          style={{ minHeight: 34, padding: "4px 8px", fontSize: 13 }}
                          value={r.status_key}
                          aria-label="Mudar status"
                          onChange={(e) => move(r, e.target.value)}
                          disabled={moving === r.id}
                        >
                          {lookups.designStatuses.filter((s) => s.is_active || s.key === r.status_key).map((s) => (
                            <option key={s.key} value={s.key}>{s.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <DesignModal
          key={modal.req?.id ?? "new"}
          request={modal.req}
          contents={contents}
          defaultStatus={modal.status}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
