import { getLookups, requireProfile } from "@/lib/data";
import { addDays, todayISO } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import type { Content, EventRow } from "@/lib/types";
import ContentsClient from "./contents-client";

export const metadata = { title: "Conteúdos" };

type SP = { q?: string; status?: string; formato?: string; resp?: string; plataforma?: string };

export default async function ContentsPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireProfile();
  await getLookups();
  const sp = await searchParams;
  const supabase = await createClient();

  let q = supabase
    .from("contents")
    .select("*")
    .order("scheduled_date", { ascending: false, nullsFirst: true })
    .order("created_at", { ascending: false })
    .limit(500);
  if (sp.status) q = q.eq("status_key", sp.status);
  if (sp.formato) q = q.eq("format_key", sp.formato);
  if (sp.resp) q = q.eq("assignee_id", sp.resp);
  if (sp.plataforma) q = q.eq("platform_key", sp.plataforma);
  if (sp.q) {
    const term = sp.q.replace(/[%,()]/g, " ").trim();
    if (term) q = q.or(`title.ilike.%${term}%,caption.ilike.%${term}%`);
  }

  const [c, e] = await Promise.all([
    q,
    supabase.from("events").select("*").gte("starts_on", addDays(todayISO(), -60)).order("starts_on"),
  ]);

  return (
    <ContentsClient
      contents={(c.data ?? []) as Content[]}
      events={(e.data ?? []) as EventRow[]}
      filters={{ q: sp.q ?? "", status: sp.status ?? "", formato: sp.formato ?? "", resp: sp.resp ?? "", plataforma: sp.plataforma ?? "" }}
    />
  );
}
