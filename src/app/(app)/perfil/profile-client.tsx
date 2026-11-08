"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { saveMyProfile } from "@/app/actions/collab";
import { useApp } from "@/components/app-provider";
import { safeFileName } from "@/components/collab-panel";
import { Avatar } from "@/components/ui";
import { ROLE_LABELS } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/client";
import { STORAGE_BUCKET } from "@/lib/supabase/config";

export default function ProfileClient({ avatarUrl }: { avatarUrl: string | null }) {
  const { profile, toast } = useApp();
  const router = useRouter();
  const [name, setName] = useState(profile.full_name ?? "");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function saveName() {
    setBusy(true);
    const r = await saveMyProfile({ full_name: name });
    setBusy(false);
    if ("error" in r) return toast(r.error, "error");
    toast("Perfil atualizado.", "success");
    router.refresh();
  }

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast("Escolha uma imagem.", "error");
    if (file.size > 5 * 1024 * 1024) return toast("A foto pode ter no máximo 5 MB.", "error");
    setBusy(true);
    const supabase = createClient();
    const path = `avatars/${profile.id}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
    const up = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, { contentType: file.type });
    if (up.error) {
      setBusy(false);
      return toast("Não foi possível enviar a foto.", "error");
    }
    const r = await saveMyProfile({ full_name: name || profile.full_name || "", avatar_path: path });
    setBusy(false);
    if ("error" in r) return toast(r.error, "error");
    toast("Foto atualizada.", "success");
    router.refresh();
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Meu perfil</h1>
          <p>{profile.email} · {profile.role_key ? ROLE_LABELS[profile.role_key] : ""}</p>
        </div>
      </div>
      <div className="card" style={{ maxWidth: 520 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
          <span style={{ transform: "scale(1.8)", transformOrigin: "left center", marginRight: 22 }}>
            <Avatar name={profile.full_name || profile.email} url={avatarUrl} />
          </span>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onPhoto(e.target.files?.[0])} />
          <button className="btn secondary" type="button" onClick={() => fileRef.current?.click()} disabled={busy}>
            Trocar foto
          </button>
        </div>
        <div className="field">
          <label htmlFor="p-name">Nome</label>
          <input id="p-name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="actions">
          <button className="btn" type="button" onClick={saveName} disabled={busy || !name.trim()}>Salvar</button>
          <Link className="btn secondary" href="/trocar-senha">Alterar senha</Link>
        </div>
      </div>
    </>
  );
}
