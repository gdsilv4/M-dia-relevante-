"use client";

import { useEffect } from "react";
import { IconClose } from "./icons";
import type { Format, Status, TeamMember } from "@/lib/types";

export function Modal({
  title,
  onClose,
  children,
  footer,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal${wide ? " wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="btn ghost icon" onClick={onClose} aria-label="Fechar" type="button">
            <IconClose />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Badge({ color, children }: { color?: string; children: React.ReactNode }) {
  const style = color ? { background: hexA(color, 0.14), color } : undefined;
  return (
    <span className="badge" style={style}>
      <i />
      {children}
    </span>
  );
}

export function StatusBadge({ list, keyName }: { list: Status[]; keyName: string }) {
  const s = list.find((x) => x.key === keyName);
  return <Badge color={s?.color}>{s?.name ?? keyName}</Badge>;
}

export function FormatDot({ format }: { format?: Format }) {
  return <i style={{ background: format?.color ?? "#64748B", width: 9, height: 9, borderRadius: 3, display: "inline-block" }} />;
}

export function Avatar({ name, url, small }: { name?: string | null; url?: string | null; small?: boolean }) {
  const initials = (name ?? "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span className={`avatar${small ? " sm" : ""}`} title={name ?? undefined}>
      {url ? <img src={url} alt="" /> : initials || "?"}
    </span>
  );
}

export function Empty({ icon, title, children }: { icon?: React.ReactNode; title: string; children?: React.ReactNode }) {
  return (
    <div className="empty">
      {icon}
      <b>{title}</b>
      {children}
    </div>
  );
}

export function memberName(team: TeamMember[], id: string | null | undefined, fallback = "Sem responsável") {
  if (!id) return fallback;
  return team.find((t) => t.id === id)?.full_name?.trim() || "Sem nome";
}

export function hexA(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return `rgba(36,87,214,${alpha})`;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export function formatBytes(n: number | null | undefined): string {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
