"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { Format, Platform, Profile, Status, TeamMember } from "@/lib/types";

export interface ClientLookups {
  statuses: Status[];
  designStatuses: Status[];
  formats: Format[];
  platforms: Platform[];
  team: TeamMember[];
}

type ToastKind = "info" | "success" | "error";
interface Toast {
  id: number;
  text: string;
  kind: ToastKind;
}

interface Ctx {
  profile: Profile;
  lookups: ClientLookups;
  toast: (text: string, kind?: ToastKind) => void;
}

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({
  profile,
  lookups,
  children,
}: {
  profile: Profile;
  lookups: ClientLookups;
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((text: string, kind: ToastKind = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === "error" ? 6000 : 3200);
  }, []);

  const value = useMemo(() => ({ profile, lookups, toast }), [profile, lookups, toast]);

  return (
    <AppCtx.Provider value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`}>
            {t.text}
          </div>
        ))}
      </div>
    </AppCtx.Provider>
  );
}

export function useApp(): Ctx {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp precisa estar dentro de AppProvider");
  return ctx;
}
