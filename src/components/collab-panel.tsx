"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { addComment, deleteComment, deleteFile, loadExtras, registerFile, type Extras, type Kind } from "@/app/actions/collab";
import { describeActivity } from "@/lib/activity";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/client";
import { STORAGE_BUCKET } from "@/lib/supabase/config";
import { timeAgo } from "@/lib/dates";
import type { FileCategory } from "@/lib/types";
import { useApp } from "./app-provider";
import { IconTrash, IconUpload } from "./icons";
import { Avatar, formatBytes, memberName } from "./ui";

type Tab = "comentarios" | "arquivos" | "historico";

export function safeFileName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .slice(-90);
}

export default function CollabPanel({ kind, id }: { kind: Kind; id: string }) {
  const { profile, lookups, toast } = useApp();
  const [tab, setTab] = useState<Tab>("comentarios");
  const [extras, setExtras] = useState<Extras | null>(null);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [category, setCategory] = useState<FileCategory>(kind === "design" ? "referencia" : "imagem");
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(async () => {
    const r = await loadExtras(kind, id);
    if ("error" in r) {
      toast(r.error, "error");
    } else {
      setExtras(r);
    }
    setLoading(false);
  }, [kind, id, toast]);

  useEffect(() => {
    setLoading(true);
    reload();
  }, [reload]);

  async function send() {
    if (!body.trim()) return;
    setBusy(true);
    const r = await addComment(kind, id, body);
    setBusy(false);
    if ("error" in r) return toast(r.error, "error");
    setBody("");
    reload();
  }

  async function removeComment(cid: string) {
    const r = await deleteComment(cid);
    if ("error" in r) return toast(r.error, "error");
    reload();
  }

  async function onFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    setBusy(true);
    const supabase = createClient();
    let okCount = 0;
    for (const file of Array.from(list)) {
      if (file.size > 50 * 1024 * 1024) {
        toast(`“${file.name}” passa de 50 MB.`, "error");
        continue;
      }
      const path = `${kind}/${id}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
      const up = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, { contentType: file.type || undefined });
      if (up.error) {
        toast(`Não foi possível enviar “${file.name}”: ${up.error.message}`, "error");
        continue;
      }
      const r = await registerFile({
        storage_path: path,
        name: file.name,
        mime_type: file.type || null,
        size_bytes: file.size,
        category,
        content_id: kind === "content" ? id : null,
        design_request_id: kind === "design" ? id : null,
      });
      if ("error" in r) {
        await supabase.storage.from(STORAGE_BUCKET).remove([path]);
        toast(r.error, "error");
      } else okCount++;
    }
    if (fileRef.current) fileRef.current.value = "";
    setBusy(false);
    if (okCount) toast(okCount === 1 ? "Arquivo enviado." : `${okCount} arquivos enviados.`, "success");
    reload();
  }

  async function removeFile(fid: string) {
    if (!confirm("Remover este arquivo?")) return;
    const r = await deleteFile(fid);
    if ("error" in r) return toast(r.error, "error");
    reload();
  }

  return (
    <div style={{ marginTop: 18 }}>
      <div className="tabs" role="tablist">
        {(
          [
            ["comentarios", `Comentários${extras ? ` (${extras.comments.length})` : ""}`],
            ["arquivos", `Arquivos${extras ? ` (${extras.files.length})` : ""}`],
            ["historico", "Histórico"],
          ] as [Tab, string][]
        ).map(([k, label]) => (
          <button key={k} type="button" className={tab === k ? "on" : ""} onClick={() => setTab(k)} role="tab">
            {label}
          </button>
        ))}
      </div>

      {loading && <p className="muted small">Carregando…</p>}

      {!loading && extras && tab === "comentarios" && (
        <div>
          {extras.comments.length === 0 && <p className="muted small">Nenhum comentário ainda.</p>}
          {extras.comments.map((c) => (
            <div className="comment" key={c.id}>
              <Avatar small name={memberName(lookups.team, c.author_id, "?")} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="small">
                  <b>{memberName(lookups.team, c.author_id, "Alguém")}</b> <span className="muted">· {timeAgo(c.created_at)}</span>
                </div>
                <div className="body">{c.body}</div>
              </div>
              {(c.author_id === profile.id || profile.role_key === "admin") && (
                <button type="button" className="btn ghost icon" aria-label="Excluir comentário" onClick={() => removeComment(c.id)}>
                  <IconTrash />
                </button>
              )}
            </div>
          ))}
          {can.comment(profile.role_key) && (
            <div style={{ marginTop: 10 }}>
              <textarea className="input" placeholder="Escreva um comentário ou observação…" value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} style={{ minHeight: 70 }} />
              <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
                <button type="button" className="btn sm" onClick={send} disabled={busy || !body.trim()}>
                  Comentar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && extras && tab === "arquivos" && (
        <div>
          {can.uploadFiles(profile.role_key) && (
            <div className="dropzone" style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", alignItems: "center" }}>
                <select className="input" style={{ width: "auto" }} value={category} onChange={(e) => setCategory(e.target.value as FileCategory)} aria-label="Categoria">
                  <option value="imagem">Imagem</option>
                  <option value="arte_final">Arte final</option>
                  <option value="referencia">Referência</option>
                  <option value="documento">Documento</option>
                  <option value="apoio">Arquivo de apoio</option>
                </select>
                <input ref={fileRef} type="file" multiple hidden onChange={(e) => onFiles(e.target.files)} />
                <button type="button" className="btn secondary" disabled={busy} onClick={() => fileRef.current?.click()}>
                  <IconUpload /> {busy ? "Enviando…" : "Enviar arquivos"}
                </button>
              </div>
              <p className="hint" style={{ marginTop: 8 }}>Imagens, PDF, documentos e vídeos curtos. Até 50 MB por arquivo.</p>
            </div>
          )}
          {extras.files.length === 0 && <p className="muted small">Nenhum arquivo anexado.</p>}
          <div className="files" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
            {extras.files.map((f) => (
              <div className="file" key={f.id}>
                <a className="thumb" href={f.url ?? "#"} target="_blank" rel="noreferrer">
                  {f.url && f.mime_type?.startsWith("image/") ? <img src={f.url} alt={f.name} /> : (f.name.split(".").pop() || "ARQ").toUpperCase()}
                </a>
                <div className="info">
                  <span className="nm" title={f.name}>{f.name}</span>
                  <span className="muted" style={{ fontSize: 12 }}>{formatBytes(f.size_bytes)}</span>
                  {can.deleteFile(profile.role_key, profile.id, f) && (
                    <button type="button" className="btn danger sm" onClick={() => removeFile(f.id)}>Remover</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && extras && tab === "historico" && (
        <div className="timeline">
          {extras.activity.length === 0 && <p className="muted small">Sem alterações registradas.</p>}
          {extras.activity.map((a) => {
            const d = describeActivity(a, lookups.team, lookups.statuses, lookups.designStatuses);
            return (
              <div className="ev" key={a.id}>
                <span className="dot" />
                <div>
                  <b>{d.actor}</b> {d.text}
                  <div className="muted small">{timeAgo(a.created_at)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
