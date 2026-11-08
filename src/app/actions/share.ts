"use server";

import { revalidatePath } from "next/cache";
import { can } from "@/lib/permissions";
import { NO_PERMISSION, NO_SESSION, clean, friendly, getCtx } from "@/lib/action-helpers";
import type { ActionResult } from "@/lib/types";

export async function createShareLink(input: {
  month: string;
  label?: string;
  include_design: boolean;
  expires_at?: string | null;
}): Promise<ActionResult> {
  const ctx = await getCtx();
  if (!ctx) return NO_SESSION;
  if (!can.manageShare(ctx.role)) return NO_PERMISSION;
  if (!/^\d{4}-\d{2}$/.test(input.month.slice(0, 7))) return { error: "Escolha o mês." };
  const month = input.month.slice(0, 7) + "-01";

  let expires_at: string | null = null;
  if (input.expires_at) {
    const d = new Date(`${input.expires_at}T23:59:59-03:00`);
    if (Number.isNaN(d.getTime())) return { error: "Data de validade inválida." };
    expires_at = d.toISOString();
  }

  const { error } = await ctx.supabase.from("share_links").insert({
    month,
    label: clean(input.label) ?? "Calendário mensal",
    include_design: input.include_design,
    expires_at,
    created_by: ctx.userId,
  });
  if (error) return { error: friendly(error.message) };
  revalidatePath("/compartilhar");
  return { ok: true, message: "Link criado." };
}

export async function revokeShareLink(id: string): Promise<ActionResult> {
  const ctx = await getCtx();
  if (!ctx) return NO_SESSION;
  if (!can.manageShare(ctx.role)) return NO_PERMISSION;
  const { data, error } = await ctx.supabase
    .from("share_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .is("revoked_at", null)
    .select("id");
  if (error) return { error: friendly(error.message) };
  if (!data?.length) return { error: "Link não encontrado ou já revogado." };
  revalidatePath("/compartilhar");
  return { ok: true, message: "Link revogado. Ele deixou de funcionar." };
}
