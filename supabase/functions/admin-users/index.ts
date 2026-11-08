import { createClient } from "jsr:@supabase/supabase-js@2";

// Criação e redefinição de senha de usuários. Só administradores ativos podem chamar.
// A chave service_role fica apenas aqui (variável de ambiente do Supabase), nunca no frontend.

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ROLES = ["admin", "planejamento", "designer", "colaborador", "visualizador"];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    const caller = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: isAdmin } = await caller.rpc("is_admin");
    if (isAdmin !== true) return json({ error: "Apenas administradores podem executar esta ação." }, 403);

    const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
    const body = await req.json();

    if (body.action === "invite") {
      const email = String(body.email ?? "").trim().toLowerCase();
      const fullName = String(body.full_name ?? "").trim();
      const password = String(body.password ?? "");
      const role = String(body.role_key ?? "");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "E-mail inválido." }, 400);
      if (!fullName) return json({ error: "Informe o nome." }, 400);
      if (password.length < 8) return json({ error: "A senha temporária precisa ter pelo menos 8 caracteres." }, 400);
      if (!ROLES.includes(role)) return json({ error: "Função inválida." }, 400);

      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
        app_metadata: { invited_by_admin: true, role_key: role },
      });
      if (error) {
        const msg = /already|registered|exists/i.test(error.message)
          ? "Já existe um usuário com este e-mail."
          : error.message;
        return json({ error: msg }, 400);
      }
      return json({ ok: true, id: data.user?.id });
    }

    if (body.action === "reset_password") {
      const id = String(body.id ?? "");
      const password = String(body.password ?? "");
      if (!id) return json({ error: "Usuário inválido." }, 400);
      if (password.length < 8) return json({ error: "A senha precisa ter pelo menos 8 caracteres." }, 400);
      const { error } = await admin.auth.admin.updateUserById(id, { password });
      if (error) return json({ error: error.message }, 400);
      await admin.from("profiles").update({ must_change_password: true }).eq("id", id);
      return json({ ok: true });
    }

    return json({ error: "Ação desconhecida." }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Erro inesperado." }, 500);
  }
});
