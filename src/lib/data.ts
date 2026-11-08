import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { STORAGE_BUCKET } from "@/lib/supabase/config";
import type {
  Activity,
  Format,
  FileRow,
  FileWithUrl,
  Platform,
  Profile,
  Status,
  TeamMember,
} from "@/lib/types";

export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return (data as Profile | null) ?? null;
});

/** Garante um usuário ativo com função definida; caso contrário redireciona. */
export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (!profile.is_active || !profile.role_key) redirect("/sem-acesso");
  if (profile.must_change_password) redirect("/trocar-senha");
  return profile;
}

export const getLookups = cache(async () => {
  const supabase = await createClient();
  const [st, ds, fm, pl, team] = await Promise.all([
    supabase.from("content_statuses").select("*").order("sort_order"),
    supabase.from("design_statuses").select("*").order("sort_order"),
    supabase.from("content_formats").select("*").order("sort_order"),
    supabase.from("platforms").select("*").order("name"),
    supabase.rpc("team_directory"),
  ]);
  return {
    statuses: (st.data ?? []) as Status[],
    designStatuses: (ds.data ?? []) as Status[],
    formats: (fm.data ?? []) as Format[],
    platforms: (pl.data ?? []) as Platform[],
    team: ((team.data ?? []) as TeamMember[]).sort((a, b) =>
      (a.full_name ?? "").localeCompare(b.full_name ?? "", "pt-BR"),
    ),
  };
});

export type Lookups = Awaited<ReturnType<typeof getLookups>>;

export async function withSignedUrls(files: FileRow[], expiresIn = 3600): Promise<FileWithUrl[]> {
  if (files.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrls(
      files.map((f) => f.storage_path),
      expiresIn,
    );
  const map = new Map<string, string>();
  (data ?? []).forEach((d) => {
    if (d.path && d.signedUrl) map.set(d.path, d.signedUrl);
  });
  return files.map((f) => ({ ...f, url: map.get(f.storage_path) ?? null }));
}

export async function getAvatarUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const supabase = await createClient();
  const { data } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export async function getActivity(opts: { limit?: number; entityType?: string; entityId?: string } = {}) {
  const supabase = await createClient();
  let q = supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(opts.limit ?? 10);
  if (opts.entityType) q = q.eq("entity_type", opts.entityType);
  if (opts.entityId) q = q.eq("entity_id", opts.entityId);
  const { data } = await q;
  return (data ?? []) as Activity[];
}

export function nameOf(team: TeamMember[], id: string | null | undefined): string {
  if (!id) return "";
  return team.find((t) => t.id === id)?.full_name?.trim() || "Sem nome";
}
