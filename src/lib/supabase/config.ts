// Valores públicos do projeto Supabase "painel-midia." (a URL e a chave publicável
// são feitas para ficar no frontend; a segurança vem das políticas RLS no banco).
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wgpaclwumzlijupdriik.supabase.co";

export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_qKHD7tJb_oKZ23r1CCnChw_RHExaMiE";

export const STORAGE_BUCKET = "midia";
