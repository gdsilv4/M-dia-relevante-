"use server";

import { revalidatePath } from "next/cache";
import { ASSIGNABLE_ROLES, can } from "@/lib/permissions";
import { NO_PERMISSION, NO_SESSION, clean, friendly, getCtx } from "@/lib/action-helpers";
import type { ActionResult, RoleKey } from "@/lib/types";

async function callAdminFn(ctx: NonNullable<Awaited<ReturnType<typeof getCtx>>>, body: Record<string, unknown>) {
  const { data, error } = await ctx.supabase.functions.invoke("admin-users", { body });
  if (error) {
    // Tenta extrair a mensagem devolvida pela função
    const resp = (error as { context?: Response }).context;
    if (resp && typeof resp.json === "function") {
      try {
        const j = await resp.json();
        if (j?.error) return { error: String(j.error) };
      } catch {
        /* ignora */
      }
    }
    return { error: "Não foi possível concluir a ação. Tente novamente." };
  }
  if (data?.error) return { error: String(data.error) };
  return { ok: true as const };
}

export async function inviteUser(input: {
  full_name: string;
  email: string;
  password: string;
  role_key: RoleKey;
}): Promise<ActionResult> {
  const ctx = await getCtx();
  if (!ctx) return NO_SESSION;
  if (!can.manageTeam(ctx.role)) return NO_PERMISSION;
  if (!clean(input.full_name)) return { error: "Informe o nome." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.email.trim())) return { error: "E-mail inválido." };
  if (input.password.length < 8) return { error: "A senha temporária precisa ter pelo menos 8 caracteres." };
  if (!ASSIGNABLE_ROLES.includes(input.role_key)) return { error: "Função inválida." };

  const r = await callAdminFn(ctx, { action: "invite", ...input });
  if ("error" in r) return r;
  revalidatePath("/equipe");
  return { ok: true, message: "Usuário criado. Envie o e-mail e a senha temporária para a pessoa." };
}

export async function updateMember(input: {
  id: string;
  role_key?: RoleKey;
  is_active?: boolean;
  full_name?: string;
}): Promise<ActionResult> {
  const ctx = await getCtx();
  if (!ctx) return NO_SESSION;
  if (!can.manageTeam(ctx.role)) return NO_PERMISSION;

  const patch: Record<string, unknown> = {};
  if (input.role_key !== undefined) {
    if (!ASSIGNABLE_ROLES.includes(input.role_key)) return { error: "Função inválida." };
    patch.role_key = input.role_key;
  }
  if (input.is_active !== undefined) patch.is_active = input.is_active;
  if (input.full_name !== undefined) {
    const n = clean(input.full_name);
    if (!n) return { error: "Informe o nome." };
    patch.full_name = n;
  }
  if (Object.keys(patch).length === 0) return { ok: true };

  const { data, error } = await ctx.supabase.from("profiles").update(patch).eq("id", input.id).select("id");
  if (error) return { error: friendly(error.message) };
  if (!data?.length) return NO_PERMISSION;
  revalidatePath("/equipe");
  return { ok: true, message: "Usuário atualizado." };
}

export async function resetPassword(id: string, password: string): Promise<ActionResult> {
  const ctx = await getCtx();
  if (!ctx) return NO_SESSION;
  if (!can.manageTeam(ctx.role)) return NO_PERMISSION;
  if (password.length < 8) return { error: "A senha precisa ter pelo menos 8 caracteres." };
  const r = await callAdminFn(ctx, { action: "reset_password", id, password });
  if ("error" in r) return r;
  return { ok: true, message: "Senha redefinida. A pessoa deverá trocá-la no próximo acesso." };
}
