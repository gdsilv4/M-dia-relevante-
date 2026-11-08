"use server";

import { revalidatePath } from "next/cache";
import { STORAGE_BUCKET } from "@/lib/supabase/config";
import { can } from "@/lib/permissions";
import { NO_PERMISSION, NO_SESSION, clean, friendly, getCtx } from "@/lib/action-helpers";
import { getActivity, withSignedUrls } from "@/lib/data";
import type { ActionResult, Activity, CommentRow, FileCategory, FileRow, FileWithUrl } from "@/lib/types";

export type Kind = "content" | "design";

export interface Extras {
  comments: CommentRow[];
  files: FileWithUrl[];
  activity: Activity[];
}

export async function loadExtras(kind: Kind, id: string): Promise<Extras | { error: string }> {
  const ctx = await getCtx();
  if (!ctx) return NO_SESSION;
  const col = kind === "content" ? "content_id" : "design_request_id";
  const [c, f, activity] = await Promise.all([
    ctx.supabase.from("comments").select("*").eq(col, id).order("created_at"),
    ctx.supabase.from("files").select("*").eq(col, id).order("created_at", { ascending: false }),
    getActivity({ limit: 30, entityType: kind === "content" ? "content" : "design_request", entityId: id }),
  ]);
  const files = await withSignedUrls((f.data ?? []) as FileRow[]);
  return { comments: (c.data ?? []) as CommentRow[], files, activity };
}

export async function addComment(kind: Kind, id: string, body: string): Promise<ActionResult> {
  const ctx = await getCtx();
  if (!ctx) return NO_SESSION;
  if (!can.comment(ctx.role)) return NO_PERMISSION;
  const text = clean(body);
  if (!text) return { error: "Escreva o comentário." };
  if (text.length > 2000) return { error: "O comentário pode ter no máximo 2000 caracteres." };
  const { error } = await ctx.supabase.from("comments").insert({
    content_id: kind === "content" ? id : null,
    design_request_id: kind === "design" ? id : null,
    author_id: ctx.userId,
    body: text,
  });
  if (error) return { error: friendly(error.message) };
  return { ok: true };
}

export async function deleteComment(id: string): Promise<ActionResult> {
  const ctx = await getCtx();
  if (!ctx) return NO_SESSION;
  const { data, error } = await ctx.supabase.from("comments").delete().eq("id", id).select("id");
  if (error) return { error: friendly(error.message) };
  if (!data?.length) return NO_PERMISSION;
  return { ok: true };
}

const CATEGORIES: FileCategory[] = ["imagem", "arte_final", "referencia", "documento", "apoio"];

export async function registerFile(input: {
  storage_path: string;
  name: string;
  mime_type: string | null;
  size_bytes: number | null;
  category: FileCategory;
  content_id?: string | null;
  design_request_id?: string | null;
}): Promise<ActionResult> {
  const ctx = await getCtx();
  if (!ctx) return NO_SESSION;
  if (!can.uploadFiles(ctx.role)) return NO_PERMISSION;
  if (!input.storage_path || input.storage_path.includes("..") || input.storage_path.startsWith("avatars/")) {
    return { error: "Caminho de arquivo inválido." };
  }
  const category = CATEGORIES.includes(input.category) ? input.category : "apoio";
  const { error } = await ctx.supabase.from("files").insert({
    storage_path: input.storage_path,
    name: clean(input.name) ?? "arquivo",
    mime_type: input.mime_type,
    size_bytes: input.size_bytes,
    category,
    content_id: input.content_id || null,
    design_request_id: input.design_request_id || null,
    uploaded_by: ctx.userId,
  });
  if (error) {
    await ctx.supabase.storage.from(STORAGE_BUCKET).remove([input.storage_path]);
    return { error: friendly(error.message) };
  }
  revalidatePath("/arquivos");
  return { ok: true, message: "Arquivo enviado." };
}

export async function deleteFile(id: string): Promise<ActionResult> {
  const ctx = await getCtx();
  if (!ctx) return NO_SESSION;
  const { data: f } = await ctx.supabase.from("files").select("storage_path,uploaded_by").eq("id", id).maybeSingle();
  if (!f) return { error: "Arquivo não encontrado." };
  if (!can.deleteFile(ctx.role, ctx.userId, f)) return NO_PERMISSION;
  const { data, error } = await ctx.supabase.from("files").delete().eq("id", id).select("id");
  if (error) return { error: friendly(error.message) };
  if (!data?.length) return NO_PERMISSION;
  await ctx.supabase.storage.from(STORAGE_BUCKET).remove([f.storage_path]);
  revalidatePath("/arquivos");
  return { ok: true, message: "Arquivo removido." };
}

export async function saveMyProfile(input: { full_name: string; avatar_path?: string | null }): Promise<ActionResult> {
  const ctx = await getCtx();
  if (!ctx) return NO_SESSION;
  const name = clean(input.full_name);
  if (!name) return { error: "Informe seu nome." };
  const patch: Record<string, unknown> = { full_name: name };
  if (input.avatar_path !== undefined) patch.avatar_path = input.avatar_path;
  const { error } = await ctx.supabase.from("profiles").update(patch).eq("id", ctx.userId);
  if (error) return { error: friendly(error.message) };
  revalidatePath("/", "layout");
  return { ok: true, message: "Perfil atualizado." };
}
