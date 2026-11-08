import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/data";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import TeamClient from "./team-client";

export const metadata = { title: "Equipe" };

export default async function TeamPage() {
  const profile = await requireProfile();
  if (!can.manageTeam(profile.role_key)) redirect("/");
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").order("created_at");
  return <TeamClient members={(data ?? []) as Profile[]} />;
}
