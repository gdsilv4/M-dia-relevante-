import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/data";
import { can } from "@/lib/permissions";
import SettingsClient from "./settings-client";

export const metadata = { title: "Configurações" };

export default async function SettingsPage() {
  const profile = await requireProfile();
  if (!can.manageSettings(profile.role_key)) redirect("/");
  return <SettingsClient />;
}
