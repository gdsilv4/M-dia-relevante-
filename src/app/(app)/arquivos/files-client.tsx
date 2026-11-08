"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { deleteFile, registerFile } from "@/app/actions/collab";
import { useApp } from "@/components/app-provider";
import { safeFileName } from "@/components/collab-panel";
import { IconFolder, IconUpload } from "@/components/icons";
import { Empty, formatBytes, memberName } from "@/components/ui";
import { timeAgo } from "@/lib/dates";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/client";
import { STORAGE_BUCKET } from "@/lib/supabase/config";
import type { FileCategory, FileWithUrl } from "@/lib/types";

const CATS: Record<FileCategory, string> = {
  imagem: "Imagens",
  arte_final: "Artes finais",
  referencia: "Referências",
  documento: "Documentos",
  apoio: "Apoio",
};

export default function FilesClient({ files, cat, q }: { files: FileWithUrl[]; cat: string; q: string }) {
  const { profile, lookups, toast } = useApp();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [category, setCategory] = useState<FileCategory>("imagem");
  const [search, setSearch] = useState(q);
  const fileRef = useRef<HTMLInputElement>(null);

  const go = (c: string, term: string) => {
    const p = new URLSearchParams();
    if (c) p.set("cat", c);
    if (term) p.set("q", term);
    router.push(`/arquivos${p.toString() ? `?${p}` : ""}`);
  };

  async function onFiles(list: FileList | null) {
    if (!list?.length) return;
    setBusy(true);
    const supabase = createClient();
    let ok = 0;
    for (const file of Array.from(list)) {
      if (file.size > 50 * 1024 * 1024) {
        toast(`“${file.name}” passa de 50 MB.`, "error");
        continue;
      }
      const path = `library/${crypto.randomUUID()}-${safeFileName(file.name)}`;
      const up = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, { contentType: file.type || undefined });
      if (up.error) {
        toast(`Falha ao enviar “${file.name}”: ${up.error.message}`, "error");
        continue;
      }
      const r = await registerFile({ storage_path: path, name: file.name, mime_type: file.type || null, size_bytes: file.size, category });
      if ("error" in r) {
        await supabase.storage.from(STORAGE_BUCKET).remove([path]);
        toast(r.error, "error");
      } else ok++;
    }
    if (fileRef.current) fileRef.current.value = "";
    setBusy(false);
    if (ok) toast(ok === 1 ? "Arquivo enviado." : `${ok} arquivos enviados.`, "success");
    router.refresh();
  }

  async function remove(f: FileWithUrl) {
    if (!confirm(`Remover “${f.name}”?`)) return;
    const r = await deleteFile(f.id);
    if ("error" in r) return toast(r.error, "error");
    toast("Arquivo removido.", "success");
    router.refresh();
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Arquivos</h1>
          <p>Imagens, artes finais, referências e documentos da equipe.</p>
        </div>
        {can.uploadFiles(profile.role_key) && (
          <div className="actions">
            <select className="input" style={{ width: "auto" }} value={category} onChange={(e) => setCategory(e.target.value as FileCategory)} aria-label="Categoria do envio">
              {Object.entries(CATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input ref={fileRef} type="file" multiple hidden onChange={(e) => onFiles(e.target.files)} />
            <button className="btn" type="button" onClick={() => fileRef.current?.click()} disabled={busy}>
              <IconUpload /> {busy ? "Enviando…" : "Enviar arquivos"}
            </button>
          </div>
        )}
      </div>

      <form className="filters" onSubmit={(e) => { e.preventDefault(); go(cat, search.trim()); }}>
        <input className="input" type="search" placeholder="Buscar pelo nome" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Buscar" style={{ maxWidth: 280 }} />
        <select className="input" aria-label="Categoria" value={cat} onChange={(e) => go(e.target.value, search.trim())}>
          <option value="">Todas as categorias</option>
          {Object.entries(CATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </form>

      {files.length === 0 ? (
        <div className="card">
          <Empty icon={<IconFolder />} title="Nenhum arquivo por aqui">
            <p className="small">Envie imagens, artes e referências. Os anexos de conteúdos e demandas também aparecem nesta biblioteca.</p>
          </Empty>
        </div>
      ) : (
        <div className="files">
          {files.map((f) => (
            <div className="file" key={f.id}>
              <a className="thumb" href={f.url ?? "#"} target="_blank" rel="noreferrer" aria-label={`Abrir ${f.name}`}>
                {f.url && f.mime_type?.startsWith("image/") ? <img src={f.url} alt={f.name} loading="lazy" /> : (f.name.split(".").pop() || "ARQ").toUpperCase()}
              </a>
              <div className="info">
                <span className="nm" title={f.name}>{f.name}</span>
                <span className="muted" style={{ fontSize: 12 }}>
                  {CATS[f.category]} · {formatBytes(f.size_bytes)}
                </span>
                <span className="muted" style={{ fontSize: 12 }}>
                  {memberName(lookups.team, f.uploaded_by, "—")} · {timeAgo(f.created_at)}
                </span>
                {can.deleteFile(profile.role_key, profile.id, f) && (
                  <button className="btn danger sm" type="button" onClick={() => remove(f)}>Remover</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
