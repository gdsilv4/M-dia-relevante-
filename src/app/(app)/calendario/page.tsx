import { getLookups, requireProfile } from "@/lib/data";
import { addDays, isValidISO, monthGrid, startOfMonth, startOfWeek, todayISO } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import type { Content, DesignRequest, EventRow } from "@/lib/types";
import CalendarClient from "./calendar-client";

export const metadata = { title: "Calendário" };

type SP = { v?: string; d?: string; plataforma?: string; formato?: string; resp?: string; status?: string };

export default async function CalendarPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireProfile();
  await getLookups();
  const sp = await searchParams;
  const today = todayISO();
  const view = sp.v === "semana" || sp.v === "dia" ? sp.v : "mes";
  const date = isValidISO(sp.d) ? sp.d : today;

  let start: string;
  let end: string;
  if (view === "mes") {
    const weeks = monthGrid(startOfMonth(date));
    start = weeks[0][0];
    end = weeks[weeks.length - 1][6];
  } else if (view === "semana") {
    start = startOfWeek(date);
    end = addDays(start, 6);
  } else {
    start = date;
    end = date;
  }

  const filters = {
    plataforma: sp.plataforma ?? "",
    formato: sp.formato ?? "",
    resp: sp.resp ?? "",
    status: sp.status ?? "",
  };
  const hasFilters = Object.values(filters).some(Boolean);

  const supabase = await createClient();
  let cq = supabase
    .from("contents")
    .select("*")
    .gte("scheduled_date", start)
    .lte("scheduled_date", end)
    .order("scheduled_date")
    .order("scheduled_time", { nullsFirst: false });
  if (filters.plataforma) cq = cq.eq("platform_key", filters.plataforma);
  if (filters.formato) cq = cq.eq("format_key", filters.formato);
  if (filters.status) cq = cq.eq("status_key", filters.status);
  if (filters.resp) cq = cq.eq("assignee_id", filters.resp);

  const [c, e, d, allEvents] = await Promise.all([
    cq,
    supabase
      .from("events")
      .select("*")
      .lte("starts_on", end)
      .or(`ends_on.gte.${start},and(ends_on.is.null,starts_on.gte.${start})`)
      .order("starts_on"),
    supabase.from("design_requests").select("*").gte("due_date", start).lte("due_date", end).order("due_date"),
    supabase.from("events").select("*").gte("starts_on", addDays(today, -60)).order("starts_on"),
  ]);

  return (
    <CalendarClient
      view={view}
      date={date}
      today={today}
      filters={filters}
      contents={(c.data ?? []) as Content[]}
      events={(e.data ?? []) as EventRow[]}
      designs={hasFilters ? [] : ((d.data ?? []) as DesignRequest[])}
      eventChoices={(allEvents.data ?? []) as EventRow[]}
    />
  );
}
