"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteContent, saveContent } from "@/app/actions/content";
import { saveDesign } from "@/app/actions/design";
import { can } from "@/lib/permissions";
import { addDays, isValidISO } from "@/lib/dates";
import type { Content, EventRow } from "@/lib/types";
import { useApp } from "./app-provider";
import CollabPanel from "./collab-panel";
import { Modal } from "./ui";

export default function ContentModal({
  content,
  defaultDate,
  events,
  onClose,
}: {
  content: Content | null;
  defaultDate?: string;
  events: EventRow[];
  onClose: () => void;
}) {
  const { profile, lookups, toast } = useApp();
  const router = useRouter();
  const [id, setId] = useState<string | null>(content?.id ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstStatus = lookups.statuses.find((s) => s.is_active)?.key ?? "ideia";
  const [f, setF] = useState({
    title: content?.title ?? "",
    description: content?.description ?? "",
    platform_key: content?.platform_key ?? lookups.platforms.find((p) => p.is_active)?.key ?? "instagram",
    format_key: content?.format_key ?? lookups.formats.find((x) => x.is_active)?.key ?? "post",
    status_key: content?.status_key ?? (defaultDate ? "planejado" : firstStatus),
    event_id: content?.event_id ?? "",
    scheduled_date: content?.scheduled_date ?? defaultDate ?? "",
    scheduled_time: content?.scheduled_time?.slice(0, 5) ?? "",
    caption: content?.caption ?? "",
    hashtags: (content?.hashtags ?? []).join(" "),
    reference_notes: content?.reference_notes ?? "",
    internal_notes: content?.internal_notes ?? "",
    assignee_id: content?.assignee_id ?? "",
  });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  // Quem criou nesta sessão pode continuar editando
  const justCreated = !content && !!id;
  const canEdit = id
    ? justCreated || (content ? can.editContent(profile.role_key, profile.id, content) : false)
    : can.createContent(profile.role_key);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    if (!f.title.trim()) return setError("Informe o título do conteúdo.");
    if (f.scheduled_date && !isValidISO(f.scheduled_date)) return setError("Data inválida.");
    setBusy(true);
    const r = await saveContent({
      id: id ?? undefined,
      ...f,
      event_id: f.event_id || null,
      scheduled_date: f.scheduled_date || null,
      scheduled_time: f.scheduled_time || null,
      assignee_id: f.assignee_id || null,
    });
    setBusy(false);
    if ("error" in r) return setError(r.error);
    toast(r.message ?? "Salvo.", "success");
    router.refresh();
    if (!id && r.data?.id) {
      setId(String(r.data.id));
    } else {
      onClose();
    }
  }

  async function remove() {
    if (!id || !confirm("Excluir este conteúdo? Esta ação não pode ser desfeita.")) return;
    setBusy(true);
    const r = await deleteContent(id);
    setBusy(false);
    if ("error" in r) return setError(r.error);
    toast("Conteúdo excluído.", "success");
    router.refresh();
    onClose();
  }

  async function requestDesign() {
    if (!id) return;
    setBusy(true);
    const due = f.scheduled_date && isValidISO(f.scheduled_date) ? addDays(f.scheduled_date, -3) : null;
    const r = await saveDesign({
      title: `Arte: ${f.title.trim()}`,
      description: f.description,
      art_text: "",
      status_key: lookups.designStatuses.find((s) => s.key === "nova")?.key ?? lookups.designStatuses[0]?.key ?? "nova",
      due_date: due,
      content_id: id,
      format_label: lookups.formats.find((x) => x.key === f.format_key)?.name ?? "",
    });
    setBusy(false);
    if ("error" in r) return setError(r.error);
    toast("Solicitação criada em Designers (prazo 3 dias antes da publicação, se houver data).", "success");
    router.refresh();
  }

  const dis = !canEdit;

  return (
    <Modal
      title={id ? (canEdit ? "Editar conteúdo" : "Conteúdo") : "Novo conteúdo"}
      onClose={onClose}
      wide
      footer={
        <>
          {id && can.deleteContent(profile.role_key) && (
            <button type="button" className="btn danger" onClick={remove} disabled={busy} style={{ marginRight: "auto" }}>
              Excluir
            </button>
          )}
          {id && can.createDesign(profile.role_key) && (
            <button type="button" className="btn secondary" onClick={requestDesign} disabled={busy}>
              Solicitar arte
            </button>
          )}
          <button type="button" className="btn secondary" onClick={onClose}>
            {canEdit ? "Cancelar" : "Fechar"}
          </button>
          {canEdit && (
            <button type="button" className="btn" onClick={() => submit()} disabled={busy}>
              {busy ? "Salvando…" : id ? "Salvar" : "Criar conteúdo"}
            </button>
          )}
        </>
      }
    >
      <form onSubmit={submit} noValidate>
        <fieldset disabled={dis} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
          <div className="field">
            <label htmlFor="c-title">Título</label>
            <input id="c-title" className="input" value={f.title} maxLength={200} onChange={(e) => set("title", e.target.value)} autoFocus={!id} />
          </div>
          <div className="row three">
            <div className="field">
              <label htmlFor="c-platform">Plataforma</label>
              <select id="c-platform" className="input" value={f.platform_key} onChange={(e) => set("platform_key", e.target.value)}>
                {lookups.platforms.filter((p) => p.is_active || p.key === f.platform_key).map((p) => (
                  <option key={p.key} value={p.key}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="c-format">Formato</label>
              <select id="c-format" className="input" value={f.format_key} onChange={(e) => set("format_key", e.target.value)}>
                {lookups.formats.filter((x) => x.is_active || x.key === f.format_key).map((x) => (
                  <option key={x.key} value={x.key}>{x.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="c-status">Status</label>
              <select id="c-status" className="input" value={f.status_key} onChange={(e) => set("status_key", e.target.value)}>
                {lookups.statuses.filter((s) => s.is_active || s.key === f.status_key).map((s) => (
                  <option key={s.key} value={s.key}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="row three">
            <div className="field">
              <label htmlFor="c-date">Data prevista</label>
              <input id="c-date" className="input" type="date" value={f.scheduled_date} onChange={(e) => set("scheduled_date", e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="c-time">Horário</label>
              <input id="c-time" className="input" type="time" value={f.scheduled_time} onChange={(e) => set("scheduled_time", e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="c-assignee">Responsável</label>
              <select id="c-assignee" className="input" value={f.assignee_id} onChange={(e) => set("assignee_id", e.target.value)}>
                <option value="">Sem responsável</option>
                {lookups.team.map((t) => (
                  <option key={t.id} value={t.id}>{t.full_name || "Sem nome"}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="c-event">Evento relacionado (opcional)</label>
            <select id="c-event" className="input" value={f.event_id} onChange={(e) => set("event_id", e.target.value)}>
              <option value="">Conteúdo independente</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.title} · {ev.starts_on.split("-").reverse().join("/")}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="c-desc">Descrição</label>
            <textarea id="c-desc" className="input" value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="Do que se trata este conteúdo?" />
          </div>
          <div className="field">
            <label htmlFor="c-caption">Legenda</label>
            <textarea id="c-caption" className="input" style={{ minHeight: 120 }} value={f.caption} onChange={(e) => set("caption", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="c-tags">Hashtags</label>
            <input id="c-tags" className="input" value={f.hashtags} onChange={(e) => set("hashtags", e.target.value)} placeholder="#igrejarelevante #culto" />
            <span className="hint">Separe por espaço ou vírgula. O # é adicionado sozinho.</span>
          </div>
          <div className="field">
            <label htmlFor="c-ref">Referências</label>
            <textarea id="c-ref" className="input" value={f.reference_notes} onChange={(e) => set("reference_notes", e.target.value)} placeholder="Links, inspirações, perfis de referência…" />
          </div>
          <div className="field">
            <label htmlFor="c-int">Observações internas</label>
            <textarea id="c-int" className="input" value={f.internal_notes} onChange={(e) => set("internal_notes", e.target.value)} />
            <span className="hint">Não aparecem no link compartilhado.</span>
          </div>
        </fieldset>
        {error && <p className="err" role="alert">{error}</p>}
      </form>
      {id ? <CollabPanel kind="content" id={id} /> : <p className="hint">Salve o conteúdo para anexar arquivos e comentar.</p>}
    </Modal>
  );
}
