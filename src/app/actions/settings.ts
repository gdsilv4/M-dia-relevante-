"use server";

import { revalidatePath } from "next/cache";
import { can } from "@/lib/permissions";
import { NO_PERMISSION, NO_SESSION, clean, friendly, getCtx, slugify } from "@/lib/action-helpers";
import type { ActionResult } from "@/lib/types";

export type LookupTable = "content_statuses" | "design_statuses" | "content_formats" | "platforms";
const TABLES: LookupTable[] = ["content_statuses", "design_statuses", "content_formats", "platforms"];

export interface LookupInput {
  table: LookupTable;
  key?: string;
  name: string;
  color?: string;
  sort_order?: number;
  is_final?: boolean;
  share_visible?: boolean;
  is_active?: boolean;
}

export async function saveLookup(input: LookupInput): Promise<ActionResult> {
  const ctx = await getCtx();
  if (!ctx) return NO_SESSION;
  if (!can.manageSettings(ctx.role)) return NO_PERMISSION;
  if (!TABLES.includes(input.table)) return { error: "Tabela inválida." };

  const name = clean(input.name);
  if (!name) return { error: "Informe o nome." };
  if (name.length > 60) return { error: "O nome pode ter no máximo 60 caracteres." };
  const color = input.color && /^#[0-9a-fA-F]{6}$/.test(input.color) ? input.color : undefined;

  const row: Record<string, unknown> = { name };
  if (input.table !== "platforms") {
    if (color) row.color = color;
    if (typeof input.sort_order === "number") row.sort_order = Math.trunc(input.sort_order);
  }
  if (typeof input.is_active === "boolean") row.is_active = input.is_active;
  if (input.table === "content_statuses" || input.table === "design_statuses") {
    if (typeof input.is_final === "boolean") row.is_final = input.is_final;
  }
  if (input.table === "content_statuses" && typeof input.share_visible === "boolean") {
    row.share_visible = input.share_visible;
  }

  if (input.key) {
    const { data, error } = await ctx.supabase.from(input.table).update(row).eq("key", input.key).select("key");
    if (error) return { error: friendly(error.message) };
    if (!data?.length) return NO_PERMISSION;
  } else {
    const key = slugify(name);
    if (!key) return { error: "Nome inválido." };
    const { error } = await ctx.supabase.from(input.table).insert({ key, ...row });
    if (error) return { error: friendly(error.message) };
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Salvo." };
}

export async function deleteLookup(table: LookupTable, key: string): Promise<ActionResult> {
  const ctx = await getCtx();
  if (!ctx) return NO_SESSION;
  if (!can.manageSettings(ctx.role)) return NO_PERMISSION;
  if (!TABLES.includes(table)) return { error: "Tabela inválida." };
  const { data, error } = await ctx.supabase.from(table).delete().eq("key", key).select("key");
  if (error) {
    if (/foreign key/i.test(error.message)) {
      return { error: "Este item está em uso. Desative-o em vez de remover." };
    }
    return { error: friendly(error.message) };
  }
  if (!data?.length) return NO_PERMISSION;
  revalidatePath("/", "layout");
  return { ok: true, message: "Removido." };
}
