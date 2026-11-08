// Datas tratadas como texto "AAAA-MM-DD" para evitar problemas de fuso horário.
export const TZ = "America/Sao_Paulo";

export const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export const WEEKDAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export const WEEKDAYS_LONG = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

export function todayISO(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ });
}

export function parseISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function isValidISO(s: string | null | undefined): s is string {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(parseISO(s).getTime());
}

export function addDays(s: string, n: number): string {
  const d = parseISO(s);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

export function addMonths(s: string, n: number): string {
  const d = parseISO(s);
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  return toISO(d);
}

export function startOfMonth(s: string): string {
  return s.slice(0, 7) + "-01";
}

export function startOfWeek(s: string): string {
  const d = parseISO(s);
  d.setDate(d.getDate() - d.getDay());
  return toISO(d);
}

export function monthLabel(s: string): string {
  const d = parseISO(s);
  return `${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatDateBR(s: string | null | undefined): string {
  if (!s) return "—";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

export function formatDayLong(s: string): string {
  const d = parseISO(s);
  return `${WEEKDAYS_LONG[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
}

export function formatDayShort(s: string): string {
  const d = parseISO(s);
  return `${WEEKDAYS_SHORT[d.getDay()]}, ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function formatTime(t: string | null | undefined): string {
  return t ? t.slice(0, 5) : "";
}

/** Semanas (domingo a sábado) que cobrem o mês da data informada. */
export function monthGrid(s: string): string[][] {
  const first = startOfMonth(s);
  const start = startOfWeek(first);
  const lastDay = addDays(addMonths(first, 1), -1);
  const weeks: string[][] = [];
  let cursor = start;
  while (cursor <= lastDay) {
    const week: string[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(cursor);
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }
  return weeks;
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `há ${d} d`;
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: TZ });
}

export function daysUntil(dateISO: string, from: string = todayISO()): number {
  const a = parseISO(dateISO).getTime();
  const b = parseISO(from).getTime();
  return Math.round((a - b) / 86400000);
}
