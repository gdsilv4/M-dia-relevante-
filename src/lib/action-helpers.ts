import { createClient } from "@/lib/supabase/server";
import type { RoleKey } from "@/lib/types";

export async function getCtx() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: p } = await supabase.from("profiles").select("role_key,is_active").eq("id", user.id).maybeSingle();
  if (!p?.is_active || !p.role_key) return null;
  return { supabase, userId: user.id, role: p.role_key as RoleKey };
}

export type Ctx = NonNullable<Awaited<ReturnType<typeof getCtx>>>;

export const NO_SESSION = { error: "Sessão expirada. Entre novamente." } as const;
export const NO_PERMISSION = { error: "Você não tem permissão para esta ação." } as const;

export function friendly(message: string): string {
  if (/row-level security|permission denied/i.test(message)) return NO_PERMISSION.error;
  if (/violates foreign key constraint/i.test(message)) return "Este item está em uso e não pode ser removido ou alterado assim.";
  if (/duplicate key/i.test(message)) return "Já existe um registro com este identificador.";
  return message;
}

export function clean(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t : null;
}

export function validDate(v: unknown): string | null {
  const s = clean(v);
  if (!s) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

export function validTime(v: unknown): string | null {
  const s = clean(v);
  if (!s) return null;
  return /^\d{2}:\d{2}(:\d{2})?$/.test(s) ? s.slice(0, 5) : null;
}

export function parseHashtags(v: unknown): string[] {
  if (typeof v !== "string") return [];
  const tags = v
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => (t.startsWith("#") ? t : `#${t}`));
  return Array.from(new Set(tags)).slice(0, 40);
}

export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}
