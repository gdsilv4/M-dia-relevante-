"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteDesign, saveDesign, updateDesignStatus } from "@/app/actions/design";
import { can } from "@/lib/permissions";
import type { DesignRequest } from "@/lib/types";
import { useApp } from "./app-provider";
import CollabPanel from "./collab-panel";
import { Modal } from "./ui";

export default function DesignModal({
  request,
  contents,
  defaultStatus,
  onClose,
}: {
  request: DesignRequest | null;
  contents: { id: string; title: string }[];
  defaultStatus?: string;
  onClose: () => void;
}) {
  const { profile, lookups, toast } = useApp();
  const router = useRouter();
  const [id, setId] = useState<string | null>(request?.id ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [f, setF] = useState({
    title: request?.title ?? "",
    description: request?.description ?? "",
    reference_notes: request?.reference_notes ?? "",
    art_text: request?.art_text ?? "",
    format_label: request?.format_label ?? "",
    dimensions: request?.dimensions ?? "",
    due_date: request?.due_date ?? "",
    designer_id: request?.designer_id ?? "",
    status_key: request?.status_key ?? defaultStatus ?? lookups.designStatuses[0]?.key ?? "nova",
    content_id: request?.content_id ?? "",
  });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  const justCreated = !request && !!id;
  const fullEdit = id ? justCreated || can.editDesign(profile.role_key) : can.createDesign(profile.role_key);
  const statusOnly = !fullEdit && !!request && can.changeDesignStatus(profile.role_key, profile.id, request);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setBusy(true);
    let r;
    if (statusOnly && id) {
      r = await updateDesignStatus(id, f.status_key);
    } else {
      if (!f.title.trim()) {
        setBusy(false);
        return setError("Informe o nome da demanda.");
      }
      r = await saveDesign({
        id: id ?? undefined,
        ...f,
        due_date: f.due_date || null,
        designer_id: f.designer_id || null,
        content_id: f.content_id || null,
      });
    }
    setBusy(false);
    if ("error" in r) return setError(r.error);
    toast(r.message ?? "Salvo.", "success");
    router.refresh();
    if (!id && r.data?.id) setId(String(r.data.id));
    else onClose();
  }

  async function remove() {
    if (!id || !confirm("Excluir esta demanda? Esta ação não pode ser desfeita.")) return;
    setBusy(true);
    const r = await deleteDesign(id);
    setBusy(false);
    if ("error" in r) return setError(r.error);
    toast("Demanda excluída.", "success");
    router.refresh();
    onClose();
  }

  const designers = lookups.team.filter((t) => t.role_key === "designer");
  const designerOptions = designers.length > 0 ? designers : lookups.team;
  const canSave = fullEdit || statusOnly;

  return (
    <Modal
      title={id ? (canSave ? "Demanda de design" : "Demanda de design") : "Nova demanda de design"}
      onClose={onClose}
      wide
      footer={
        <>
          {id && can.deleteDesign(profile.role_key) && (
            <button type="button" className="btn danger" onClick={remove} disabled={busy} style={{ marginRight: "auto" }}>
              Excluir
            </button>
          )}
          <button type="button" className="btn secondary" onClick={onClose}>
            {canSave ? "Cancelar" : "Fechar"}
          </button>
          {canSave && (
            <button type="button" className="btn" onClick={() => submit()} disabled={busy}>
              {busy ? "Salvando…" : id ? "Salvar" : "Criar demanda"}
            </button>
          )}
        </>
      }
    >
      <form onSubmit={submit} noValidate>
        {statusOnly && <p className="hint" style={{ marginBottom: 10 }}>Como designer, você pode atualizar o status desta demanda e comentar.</p>}
        <fieldset disabled={!fullEdit} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
          <div className="field">
            <label htmlFor="d-title">Nome da demanda</label>
            <input id="d-title" className="input" value={f.title} maxLength={200} onChange={(e) => set("title", e.target.value)} autoFocus={!id} />
          </div>
          <div className="field">
            <label htmlFor="d-desc">Descrição / briefing</label>
            <textarea id="d-desc" className="input" value={f.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="d-text">Texto que deve aparecer na arte</label>
            <textarea id="d-text" className="input" value={f.art_text} onChange={(e) => set("art_text", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="d-ref">Referências visuais</label>
            <textarea id="d-ref" className="input" value={f.reference_notes} onChange={(e) => set("reference_notes", e.target.value)} placeholder="Links e inspirações. Imagens podem ser anexadas na aba Arquivos." />
          </div>
          <div className="row">
            <div className="field">
              <label htmlFor="d-format">Formato</label>
              <input id="d-format" className="input" list="d-formats" value={f.format_label} onChange={(e) => set("format_label", e.target.value)} placeholder="Ex.: Post feed" />
              <datalist id="d-formats">
                {lookups.formats.map((x) => <option key={x.key} value={x.name} />)}
              </datalist>
            </div>
            <div className="field">
              <label htmlFor="d-dim">Dimensões</label>
              <input id="d-dim" className="input" list="d-dims" value={f.dimensions} onChange={(e) => set("dimensions", e.target.value)} placeholder="1080x1350" />
              <datalist id="d-dims">
                <option value="1080x1350" />
                <option value="1080x1920" />
                <option value="1080x1080" />
              </datalist>
            </div>
          </div>
          <div className="row">
            <div className="field">
              <label htmlFor="d-due">Prazo de entrega</label>
              <input id="d-due" className="input" type="date" value={f.due_date} onChange={(e) => set("due_date", e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="d-designer">Designer responsável</label>
              <select id="d-designer" className="input" value={f.designer_id} onChange={(e) => set("designer_id", e.target.value)}>
                <option value="">Sem designer</option>
                {designerOptions.map((t) => <option key={t.id} value={t.id}>{t.full_name || "Sem nome"}</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="d-content">Conteúdo relacionado (opcional)</label>
            <select id="d-content" className="input" value={f.content_id} onChange={(e) => set("content_id", e.target.value)}>
              <option value="">Nenhum</option>
              {contents.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
        </fieldset>
        <fieldset disabled={!canSave} style={{ border: 0, padding: 0, margin: 0 }}>
          <div className="field">
            <label htmlFor="d-status">Status</label>
            <select id="d-status" className="input" value={f.status_key} onChange={(e) => set("status_key", e.target.value)}>
              {lookups.designStatuses.filter((s) => s.is_active || s.key === f.status_key).map((s) => (
                <option key={s.key} value={s.key}>{s.name}</option>
              ))}
            </select>
          </div>
        </fieldset>
        {error && <p className="err" role="alert">{error}</p>}
      </form>
      {id ? <CollabPanel kind="design" id={id} /> : <p className="hint">Salve a demanda para anexar referências e comentar.</p>}
    </Modal>
  );
}
