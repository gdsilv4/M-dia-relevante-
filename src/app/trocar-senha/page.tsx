import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/data";
import PasswordForm from "./password-form";

export const metadata: Metadata = { title: "Nova senha" };

export default async function ChangePasswordPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  return (
    <div className="center-page">
      <div className="card">
        <h2>Defina sua senha</h2>
        <p className="muted" style={{ margin: "6px 0 18px" }}>
          {profile.must_change_password
            ? "Por segurança, troque a senha temporária por uma só sua."
            : "Escolha uma nova senha."}
        </p>
        <PasswordForm />
      </div>
    </div>
  );
}
