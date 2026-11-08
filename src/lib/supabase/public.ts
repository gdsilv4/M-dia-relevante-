import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "./config";

// Cliente anônimo, sem sessão: usado só pela página pública do calendário compartilhado.
export function createPublicClient() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
