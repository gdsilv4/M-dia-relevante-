"use server";

import { revalidatePath } from "next/cache";
import { can } from "@/lib/permissions";
import { NO_PERMISSION, NO_SESSION, clean, friendly, getCtx, validDate } from "@/lib/action-helpers";
import type { ActionResult } from "@/lib/types";

export interface DesignInput {
  id?: string;
  title: string;
  description?: string;
  reference_notes?: string;
  art_text?: string;
  format_label?: string;
  dimensions?: string;
  due_date?: string | null;
  designer_id?: string | null;
  status_key: string;
  content_id?: string | null;
}

function refresh() {
  ["/", "/design", "/calendario"].forEach((p) => revalidatePath(p));
}

export async function saveDesign(input: DesignInput): Promise<ActionResult> {
  const ctx = await getCtx();
  if (!ctx) return NO_SESSION;

  const title = clean(input.title);
  if (!title) return { error: "Informe o nome da demanda." };
  if (title.length > 200) return { error: "O nome pode ter no máximo 200 caracteres." };
  if (input.due_date && !validDate(input.due_date)) return { error: "Prazo inválido." };
  if (!input.status_key) return { error: "Escolha o status." };

  const row = {
    title,
    description: clean(input.description),
    reference_notes: clean(input.reference_notes),
    art_text: clean(input.art_text),
    format_label: clean(input.format_label),
    dimensions: clean(input.dimensions),
    due_date: validDate(input.due_date),
    designer_id: input.designer_id || null,
    status_key: input.status_key,
    content_id: input.content_id || null,
  };

  if (input.id) {
    if (!can.editDesign(ctx.role)) return NO_PERMISSION;
    const { data, error } = await ctx.supabase.from("design_requests").update(row).eq("id", input.id).select("id");
    if (error) return { error: friendly(error.message) };
    if (!data?.length) return NO_PERMISSION;
    refresh();
    return { ok: true, message: "Demanda atualizada.", data: { id: input.id } };
  }

  if (!can.createDesign(ctx.role)) return NO_PERMISSION;
  const { data, error } = await ctx.supabase
    .from("design_requests")
    .insert({ ...row, created_by: ctx.userId })
    .select("id")
    .single();
  if (error) return { error: friendly(error.message) };
  refresh();
  return { ok: true, message: "Demanda criada.", data: { id: data.id } };
}

export async function updateDesignStatus(id: string, status_key: string): Promise<ActionResult> {
  const ctx = await getCtx();
  if (!ctx) return NO_SESSION;
  const { data: current } = await ctx.supabase.from("design_requests").select("designer_id").eq("id", id).maybeSingle();
  if (!current) return { error: "Demanda não encontrada." };
  if (!can.changeDesignStatus(ctx.role, ctx.userId, current)) return NO_PERMISSION;
  const { data, error } = await ctx.supabase.from("design_requests").update({ status_key }).eq("id", id).select("id");
  if (error) return { error: friendly(error.message) };
  if (!data?.length) return NO_PERMISSION;
  refresh();
  return { ok: true, message: "Status atualizado." };
}

export async function deleteDesign(id: string): Promise<ActionResult> {
  const ctx = await getCtx();
  if (!ctx) return NO_SESSION;
  if (!can.deleteDesign(ctx.role)) return NO_PERMISSION;
  const { data, error } = await ctx.supabase.from("design_requests").delete().eq("id", id).select("id");
  if (error) return { error: friendly(error.message) };
  if (!data?.length) return NO_PERMISSION;
  refresh();
  return { ok: true, message: "Demanda removida." };
}
