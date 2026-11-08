import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/data";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import type { ShareLink } from "@/lib/types";
import ShareClient from "./share-client";

export const metadata = { title: "Compartilhar" };

export default async function SharePage() {
  const profile = await requireProfile();
  if (!can.manageShare(profile.role_key)) redirect("/");
  const supabase = await createClient();
  const { data } = await supabase.from("share_links").select("*").order("created_at", { ascending: false }).limit(100);
  return <ShareClient links={(data ?? []) as ShareLink[]} />;
}
