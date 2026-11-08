import { getLookups, requireProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { DesignRequest } from "@/lib/types";
import DesignClient from "./design-client";

export const metadata = { title: "Designers" };

export default async function DesignPage({ searchParams }: { searchParams: Promise<{ resp?: string; mine?: string }> }) {
  const profile = await requireProfile();
  await getLookups();
  const sp = await searchParams;
  const supabase = await createClient();

  let q = supabase.from("design_requests").select("*").order("due_date", { ascending: true, nullsFirst: false }).limit(500);
  if (sp.resp) q = q.eq("designer_id", sp.resp);
  if (sp.mine === "1") q = q.eq("designer_id", profile.id);

  const [d, c] = await Promise.all([
    q,
    supabase.from("contents").select("id,title").order("created_at", { ascending: false }).limit(300),
  ]);

  return (
    <DesignClient
      requests={(d.data ?? []) as DesignRequest[]}
      contents={(c.data ?? []) as { id: string; title: string }[]}
      resp={sp.resp ?? ""}
      mine={sp.mine === "1"}
    />
  );
}
