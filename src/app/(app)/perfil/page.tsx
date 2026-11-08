import { getAvatarUrl, requireProfile } from "@/lib/data";
import ProfileClient from "./profile-client";

export const metadata = { title: "Meu perfil" };

export default async function ProfilePage() {
  const profile = await requireProfile();
  const avatarUrl = await getAvatarUrl(profile.avatar_path);
  return <ProfileClient avatarUrl={avatarUrl} />;
}
