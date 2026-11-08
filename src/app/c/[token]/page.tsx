import type { Metadata } from "next";
import { LogoMark } from "@/components/icons";
import {
  WEEKDAYS_SHORT,
  capitalize,
  formatDateBR,
  formatDayLong,
  formatTime,
  monthGrid,
  monthLabel,
  parseISO,
  todayISO,
} from "@/lib/dates";
import { createPublicClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Calendário compartilhado",
  robots: { index: false, follow: false },
};

interface SharedItem {
  title: string;
  description: string | null;
  date: string;
  time: string | null;
  format: string;
  format_color: string;
  platform: string;
}
interface SharedDesign {
  title: string;
  description: string | null;
  art_text: string | null;
  format: string | null;
  dimensions: string | null;
  due_date: string | null;
  status: string;
  status_color: string;
}
interface Shared {
  label: string;
  month: string;
  items: SharedItem[];
  design: SharedDesign[];
}

export default async function SharedCalendarPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = createPublicClient();
  const { data } = await supabase.rpc("get_shared_calendar", { p_token: token });
  const cal = data as Shared | null;

  if (!cal) {
    return (
      <div className="center-page">
        <div className="card" style={{ textAlign: "center" }}>
          <h2>Link indisponível</h2>
          <p className="muted" style={{ marginTop: 8 }}>
            Este link não existe, expirou ou foi revogado. Peça um novo link a quem compartilhou.
          </p>
        </div>
      </div>
    );
  }

  const today = todayISO();
  const weeks = monthGrid(cal.month);
  const byDay = new Map<string, SharedItem[]>();
  cal.items.forEach((i) => byDay.set(i.date, [...(byDay.get(i.date) ?? []), i]));
  const days = Array.from(byDay.keys()).sort();
  const formats = Array.from(new Map(cal.items.map((i) => [i.format, i.format_color])).entries());

  return (
    <>
      <header className="pub-head">
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", gap: 14 }}>
          <LogoMark size={40} />
          <div>
            <div style={{ fontSize: 13, opacity: 0.7, letterSpacing: "0.06em" }}>
              <span style={{ fontWeight: 300 }}>IGREJA</span> <b>RELEVANTE</b> · MÍDIA
            </div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{cal.label}</div>
          </div>
        </div>
      </header>

      <div className="pub-wrap">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          <h1>{capitalize(monthLabel(cal.month))}</h1>
          <span className="muted small">Visualização somente leitura</span>
        </div>

        <div className="cal">
          <div className="cal-head">
            {WEEKDAYS_SHORT.map((w) => <div key={w}>{w}</div>)}
          </div>
          {weeks.map((w) => (
            <div className="cal-week" key={w[0]}>
              {w.map((day) => {
                const items = byDay.get(day) ?? [];
                const outside = day.slice(0, 7) !== cal.month.slice(0, 7);
                return (
                  <div key={day} className={`cal-day${outside ? " out" : ""}${day === today ? " today" : ""}`} style={{ cursor: "default" }}>
                    <span className="dn">{parseISO(day).getDate()}</span>
                    {!outside &&
                      items.slice(0, 4).map((i, idx) => (
                        <div key={idx} className="chip" style={{ background: i.format_color, cursor: "default" }} title={`${i.title} · ${i.format}`}>
                          <span className="nm-txt">{i.time ? `${formatTime(i.time)} ` : ""}{i.title}</span>
                        </div>
                      ))}
                    {!outside && items.length > 4 && <span className="more">+{items.length - 4} mais</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {formats.length > 0 && (
          <div className="legend">
            {formats.map(([name, color]) => (
              <span key={name}><i style={{ background: color }} />{name}</span>
            ))}
          </div>
        )}

        <section className="card" style={{ marginTop: 20 }}>
          <h2 style={{ marginBottom: 8 }}>Conteúdos do mês</h2>
          {days.length === 0 ? (
            <p className="muted">Nenhum conteúdo liberado para este mês ainda.</p>
          ) : (
            days.map((day) => (
              <div className="day-block" key={day}>
                <h3>{formatDayLong(day)}</h3>
                <div className="list">
                  {(byDay.get(day) ?? []).map((i, idx) => (
                    <div className="list-item" key={idx} style={{ cursor: "default", alignItems: "flex-start" }}>
                      <i style={{ width: 5, alignSelf: "stretch", borderRadius: 3, background: i.format_color }} />
                      <div className="grow">
                        <div className="t" style={{ whiteSpace: "normal" }}>{i.title}</div>
                        <div className="meta">
                          <span>{i.format}</span>
                          <span>{i.platform}</span>
                          {i.time && <span>{formatTime(i.time)}</span>}
                        </div>
                        {i.description && <p className="small muted" style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>{i.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </section>

        {cal.design.length > 0 && (
          <section className="card" style={{ marginTop: 16 }}>
            <h2 style={{ marginBottom: 8 }}>Artes a produzir</h2>
            <div className="list">
              {cal.design.map((d, idx) => (
                <div className="list-item" key={idx} style={{ cursor: "default", alignItems: "flex-start" }}>
                  <div className="grow">
                    <div className="t" style={{ whiteSpace: "normal" }}>{d.title}</div>
                    <div className="meta">
                      <span>Prazo: {formatDateBR(d.due_date)}</span>
                      {d.format && <span>{d.format}</span>}
                      {d.dimensions && <span>{d.dimensions}</span>}
                      <span style={{ color: d.status_color, fontWeight: 600 }}>{d.status}</span>
                    </div>
                    {d.description && <p className="small" style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>{d.description}</p>}
                    {d.art_text && (
                      <p className="small" style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>
                        <b>Texto da arte:</b> {d.art_text}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
