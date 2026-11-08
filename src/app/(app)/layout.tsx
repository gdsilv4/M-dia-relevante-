import { AppProvider } from "@/components/app-provider";
import Nav from "@/components/nav";
import { getAvatarUrl, getLookups, requireProfile } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  const [lookups, avatarUrl] = await Promise.all([getLookups(), getAvatarUrl(profile.avatar_path)]);
  return (
    <AppProvider profile={profile} lookups={lookups}>
      <div className="shell">
        <Nav avatarUrl={avatarUrl} />
        <main className="main">{children}</main>
      </div>
    </AppProvider>
  );
}
