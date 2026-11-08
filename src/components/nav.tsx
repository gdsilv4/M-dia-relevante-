"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/app/actions/auth";
import { can, ROLE_LABELS } from "@/lib/permissions";
import { Avatar } from "./ui";
import { useApp } from "./app-provider";
import {
  IconBrush,
  IconCalendar,
  IconDoc,
  IconFolder,
  IconHome,
  IconLogout,
  IconMore,
  IconSettings,
  IconShare,
  IconUsers,
  LogoMark,
} from "./icons";

interface Item {
  href: string;
  label: string;
  icon: React.ReactNode;
  show: boolean;
}

export default function Nav({ avatarUrl }: { avatarUrl: string | null }) {
  const { profile, lookups } = useApp();
  const pathname = usePathname();
  const [sheet, setSheet] = useState(false);
  const role = profile.role_key;

  const items: Item[] = [
    { href: "/", label: "Início", icon: <IconHome />, show: true },
    { href: "/calendario", label: "Calendário", icon: <IconCalendar />, show: true },
    { href: "/conteudos", label: "Conteúdos", icon: <IconDoc />, show: true },
    { href: "/design", label: "Designers", icon: <IconBrush />, show: true },
    { href: "/arquivos", label: "Arquivos", icon: <IconFolder />, show: true },
    { href: "/compartilhar", label: "Compartilhar", icon: <IconShare />, show: can.manageShare(role) },
    { href: "/equipe", label: "Equipe", icon: <IconUsers />, show: can.manageTeam(role) },
    { href: "/configuracoes", label: "Configurações", icon: <IconSettings />, show: can.manageSettings(role) },
  ].filter((i) => i.show);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const primary = items.slice(0, 4);
  const more = items.slice(4);
  const moreActive = more.some((i) => isActive(i.href));

  return (
    <>
      <aside className="sidebar">
        <div className="brand">
          <LogoMark size={36} />
          <div>
            <div className="brand-text">
              <span>IGREJA</span> <b>RELEVANTE</b>
            </div>
            <div className="brand-sub">Painel de Mídia</div>
          </div>
        </div>
        <nav className="nav" aria-label="Principal">
          {items.map((i) => (
            <Link key={i.href} href={i.href} className={isActive(i.href) ? "active" : ""}>
              {i.icon}
              {i.label}
            </Link>
          ))}
        </nav>
        <div className="side-sections">
          <div className="side-title">
            <span>Equipe</span>
            {can.manageTeam(role) && <Link href="/equipe" title="Adicionar pessoa">+</Link>}
          </div>
          <div className="mini-list">
            {lookups.team.slice(0, 6).map((m) => (
              <div className="mini" key={m.id}>
                <Avatar small name={m.full_name || "?"} />
                <span>{m.full_name || "Sem nome"}</span>
              </div>
            ))}
            {lookups.team.length > 6 && <span className="mini-more">+{lookups.team.length - 6} pessoas</span>}
          </div>
          <div className="side-title" style={{ marginTop: 18 }}><span>Plataformas</span></div>
          <div className="mini-list">
            {lookups.platforms.filter((p) => p.is_active).map((p) => (
              <div className="mini" key={p.key}>
                <i className="dot" />
                <span>{p.name}</span>
              </div>
            ))}
          </div>
          {can.manageTeam(role) && (
            <Link href="/equipe" className="side-invite">Convidar pessoa</Link>
          )}
        </div>
        <div className="me">
          <Link href="/perfil" style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }} title="Meu perfil">
            <Avatar name={profile.full_name || profile.email} url={avatarUrl} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="me-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {profile.full_name || profile.email}
              </div>
              <div className="me-role">{role ? ROLE_LABELS[role] : ""}</div>
            </div>
          </Link>
          <form action={signOut}>
            <button className="btn ghost icon" style={{ color: "#fff" }} aria-label="Sair" title="Sair">
              <IconLogout />
            </button>
          </form>
        </div>
      </aside>

      <nav className="bottom-nav" aria-label="Principal">
        {primary.map((i) => (
          <Link key={i.href} href={i.href} className={isActive(i.href) ? "active" : ""}>
            {i.icon}
            {i.label}
          </Link>
        ))}
        <button className={moreActive || sheet ? "active" : ""} onClick={() => setSheet(true)} type="button">
          <IconMore />
          Mais
        </button>
      </nav>

      {sheet && (
        <>
          <div className="sheet-bg" onClick={() => setSheet(false)} />
          <div className="sheet" role="menu">
            {more.map((i) => (
              <Link key={i.href} href={i.href} onClick={() => setSheet(false)}>
                {i.icon}
                {i.label}
              </Link>
            ))}
            <Link href="/perfil" onClick={() => setSheet(false)}>
              <Avatar small name={profile.full_name || profile.email} url={avatarUrl} />
              Meu perfil · {role ? ROLE_LABELS[role] : ""}
            </Link>
            <form action={signOut}>
              <button style={{ width: "100%" }}>
                <IconLogout />
                Sair
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
}
