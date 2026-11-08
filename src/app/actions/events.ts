"use server";

import { revalidatePath } from "next/cache";
import { can } from "@/lib/permissions";
import { NO_PERMISSION, NO_SESSION, clean, friendly, getCtx, validDate } from "@/lib/action-helpers";
import type { ActionResult } from "@/lib/types";

export interface EventInput {
  id?: string;
  title: string;
  description?: string;
  starts_on: string;
  ends_on?: string | null;
}

export async function saveEvent(input: EventInput): Promise<ActionResult> {
  const ctx = await getCtx();
  if (!ctx) return NO_SESSION;
  if (!can.manageEvents(ctx.role)) return NO_PERMISSION;

  const title = clean(input.title);
  if (!title) return { error: "Informe o nome do evento." };
  const starts_on = validDate(input.starts_on);
  if (!starts_on) return { error: "Informe a data do evento." };
  const ends_on = validDate(input.ends_on);
  if (ends_on && ends_on < starts_on) return { error: "A data final não pode ser anterior à inicial." };

  const row = { title, description: clean(input.description), starts_on, ends_on };

  if (input.id) {
    const { data, error } = await ctx.supabase.from("events").update(row).eq("id", input.id).select("id");
    if (error) return { error: friendly(error.message) };
    if (!data?.length) return NO_PERMISSION;
  } else {
    const { error } = await ctx.supabase.from("events").insert({ ...row, created_by: ctx.userId });
    if (error) return { error: friendly(error.message) };
  }
  revalidatePath("/calendario");
  revalidatePath("/");
  return { ok: true, message: input.id ? "Evento atualizado." : "Evento criado." };
}

export async function deleteEvent(id: string): Promise<ActionResult> {
  const ctx = await getCtx();
  if (!ctx) return NO_SESSION;
  if (!can.manageEvents(ctx.role)) return NO_PERMISSION;
  const { data, error } = await ctx.supabase.from("events").delete().eq("id", id).select("id");
  if (error) return { error: friendly(error.message) };
  if (!data?.length) return NO_PERMISSION;
  revalidatePath("/calendario");
  return { ok: true, message: "Evento removido." };
}
