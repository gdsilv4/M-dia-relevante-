import { getLookups, requireProfile, withSignedUrls } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { FileRow } from "@/lib/types";
import FilesClient from "./files-client";

export const metadata = { title: "Arquivos" };

export default async function FilesPage({ searchParams }: { searchParams: Promise<{ cat?: string; q?: string }> }) {
  await requireProfile();
  await getLookups();
  const sp = await searchParams;
  const supabase = await createClient();
  let q = supabase.from("files").select("*").order("created_at", { ascending: false }).limit(300);
  if (sp.cat) q = q.eq("category", sp.cat);
  if (sp.q) {
    const term = sp.q.replace(/[%,()]/g, " ").trim();
    if (term) q = q.ilike("name", `%${term}%`);
  }
  const { data } = await q;
  const files = await withSignedUrls((data ?? []) as FileRow[]);
  return <FilesClient files={files} cat={sp.cat ?? ""} q={sp.q ?? ""} />;
}
