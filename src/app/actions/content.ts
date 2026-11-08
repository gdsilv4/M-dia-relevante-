"use server";

import { revalidatePath } from "next/cache";
import { can } from "@/lib/permissions";
import { NO_PERMISSION, NO_SESSION, clean, friendly, getCtx, parseHashtags, validDate, validTime } from "@/lib/action-helpers";
import type { ActionResult } from "@/lib/types";

export interface ContentInput {
  id?: string;
  title: string;
  description?: string;
  platform_key: string;
  format_key: string;
  status_key: string;
  event_id?: string | null;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  caption?: string;
  hashtags?: string;
  reference_notes?: string;
  internal_notes?: string;
  assignee_id?: string | null;
}

function refresh() {
  ["/", "/calendario", "/conteudos", "/design"].forEach((p) => revalidatePath(p));
}

export async function saveContent(input: ContentInput): Promise<ActionResult> {
  const ctx = await getCtx();
  if (!ctx) return NO_SESSION;

  const title = clean(input.title);
  if (!title) return { error: "Informe o título do conteúdo." };
  if (title.length > 200) return { error: "O título pode ter no máximo 200 caracteres." };
  if (input.scheduled_date && !validDate(input.scheduled_date)) return { error: "Data inválida." };
  if (input.scheduled_time && !validTime(input.scheduled_time)) return { error: "Horário inválido." };
  if (!input.platform_key || !input.format_key || !input.status_key) return { error: "Escolha plataforma, formato e status." };

  const row = {
    title,
    description: clean(input.description),
    platform_key: input.platform_key,
    format_key: input.format_key,
    status_key: input.status_key,
    event_id: input.event_id || null,
    scheduled_date: validDate(input.scheduled_date),
    scheduled_time: validTime(input.scheduled_time),
    caption: clean(input.caption),
    hashtags: parseHashtags(input.hashtags),
    reference_notes: clean(input.reference_notes),
    internal_notes: clean(input.internal_notes),
    assignee_id: input.assignee_id || null,
  };

  if (input.id) {
    const { data: current } = await ctx.supabase
      .from("contents")
      .select("assignee_id,created_by")
      .eq("id", input.id)
      .maybeSingle();
    if (!current) return { error: "Conteúdo não encontrado." };
    if (!can.editContent(ctx.role, ctx.userId, current)) return NO_PERMISSION;
    const { data, error } = await ctx.supabase.from("contents").update(row).eq("id", input.id).select("id");
    if (error) return { error: friendly(error.message) };
    if (!data?.length) return NO_PERMISSION;
    refresh();
    return { ok: true, message: "Conteúdo atualizado.", data: { id: input.id } };
  }

  if (!can.createContent(ctx.role)) return NO_PERMISSION;
  const { data, error } = await ctx.supabase
    .from("contents")
    .insert({ ...row, created_by: ctx.userId })
    .select("id")
    .single();
  if (error) return { error: friendly(error.message) };
  refresh();
  return { ok: true, message: "Conteúdo criado.", data: { id: data.id } };
}

export async function deleteContent(id: string): Promise<ActionResult> {
  const ctx = await getCtx();
  if (!ctx) return NO_SESSION;
  if (!can.deleteContent(ctx.role)) return NO_PERMISSION;
  const { data, error } = await ctx.supabase.from("contents").delete().eq("id", id).select("id");
  if (error) return { error: friendly(error.message) };
  if (!data?.length) return NO_PERMISSION;
  refresh();
  return { ok: true, message: "Conteúdo removido." };
}
