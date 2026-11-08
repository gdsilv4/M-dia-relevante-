"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { deleteEvent, saveEvent } from "@/app/actions/events";
import { useApp } from "@/components/app-provider";
import ContentModal from "@/components/content-modal";
import { IconChevronL, IconChevronR, IconPlus } from "@/components/icons";
import { Avatar, Badge, Modal, memberName } from "@/components/ui";
import {
  WEEKDAYS_SHORT,
  addDays,
  addMonths,
  capitalize,
  formatDayLong,
  formatTime,
  monthGrid,
  monthLabel,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "@/lib/dates";
import { can } from "@/lib/permissions";
import type { Content, DesignRequest, EventRow } from "@/lib/types";

type View = "mes" | "semana" | "dia";
interface Filters {
  plataforma: string;
  formato: string;
  resp: string;
  status: string;
}

export default function CalendarClient({
  view,
  date,
  today,
  filters,
  contents,
  events,
  designs,
  eventChoices,
}: {
  view: View;
  date: string;
  today: string;
  filters: Filters;
  contents: Content[];
  events: EventRow[];
  designs: DesignRequest[];
  eventChoices: EventRow[];
}) {
  const { profile, lookups } = useApp();
  const router = useRouter();
  const [modal, setModal] = useState<{ content: Content | null; date?: string } | null>(null);
  const [eventModal, setEventModal] = useState<{ event: EventRow | null; date?: string } | null>(null);

  const href = (patch: Partial<{ v: string; d: string } & Filters>) => {
    const p = new URLSearchParams();
    const next = { v: view, d: date, ...filters, ...patch };
    Object.entries(next).forEach(([k, v]) => v && p.set(k, v));
    return `/calendario?${p.toString()}`;
  };

  const step = (dir: 1 | -1) => {
    if (view === "mes") return addMonths(startOfMonth(date), dir);
    if (view === "semana") return addDays(date, 7 * dir);
    return addDays(date, dir);
  };

  const title = useMemo(() => {
    if (view === "mes") return capitalize(monthLabel(date));
    if (view === "dia") return capitalize(formatDayLong(date));
    const s = startOfWeek(date);
    const e = addDays(s, 6);
    const fmt = (x: string) => `${parseISO(x).getDate()}/${String(parseISO(x).getMonth() + 1).padStart(2, "0")}`;
    return `Semana de ${fmt(s)} a ${fmt(e)}`;
  }, [view, date]);

  const byDay = useMemo(() => {
    const m = new Map<string, Content[]>();
    contents.forEach((c) => {
      if (!c.scheduled_date) return;
      m.set(c.scheduled_date, [...(m.get(c.scheduled_date) ?? []), c]);
    });
    return m;
  }, [contents]);

  const eventsOn = (day: string) => events.filter((e) => e.starts_on <= day && (e.ends_on ?? e.starts_on) >= day);
  const designsOn = (day: string) => designs.filter((d) => d.due_date === day);

  const formatOf = (k: string) => lookups.formats.find((f) => f.key === k);
  const statusOf = (k: string) => lookups.statuses.find((s) => s.key === k);
  const canCreate = can.createContent(profile.role_key);

  function openDay(day: string) {
    if (canCreate) setModal({ content: null, date: day });
    else router.push(href({ v: "dia", d: day }));
  }

  function chip(c: Content, full: boolean) {
    const f = formatOf(c.format_key);
    const st = statusOf(c.status_key);
    return (
      <button
        key={c.id}
        type="button"
        className={`chip${c.status_key === "cancelado" ? " cancelled" : ""}`}
        style={{ background: f?.color ?? "#2457D6" }}
        title={`${c.title} · ${f?.name ?? ""} · ${st?.name ?? ""}`}
        onClick={(e) => {
          e.stopPropagation();
          setModal({ content: c });
        }}
      >
        <span className="nm-txt">
          {c.scheduled_time ? `${formatTime(c.scheduled_time)} ` : ""}
          {c.title}
        </span>
        {full && st && <span style={{ opacity: 0.85, fontWeight: 500 }}>· {st.name}</span>}
      </button>
    );
  }

  function dayCell(day: string, opts: { outside?: boolean; tall?: boolean; full?: boolean; max?: number }) {
    const items = byDay.get(day) ?? [];
    const evs = eventsOn(day);
    const ds = designsOn(day);
    const max = opts.max ?? 3;
    const shown = items.slice(0, max);
    const rest = items.length - shown.length;
    const n = parseISO(day).getDate();
    return (
      <div
        key={day}
        role="button"
        tabIndex={0}
        aria-label={`${formatDayLong(day)}${items.length ? `, ${items.length} publicações` : ""}`}
        className={`cal-day${opts.outside ? " out" : ""}${day === today ? " today" : ""}${opts.tall ? " tall" : ""}`}
        onClick={() => openDay(day)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openDay(day);
          }
        }}
      >
        <span className="dn">{n}</span>
        {evs.map((ev) => (
          <button
            key={ev.id}
            type="button"
            className="chip event"
            title={`Evento: ${ev.title}`}
            onClick={(e) => {
              e.stopPropagation();
              setEventModal({ event: ev });
            }}
          >
            <span className="nm-txt">◆ {ev.title}</span>
          </button>
        ))}
        {shown.map((c) => chip(c, !!opts.full))}
        {rest > 0 && <span className="more">+{rest} mais</span>}
        {ds.map((d) => (
          <button
            key={d.id}
            type="button"
            className="chip design"
            title={`Prazo de arte: ${d.title}`}
            onClick={(e) => {
              e.stopPropagation();
              router.push("/design");
            }}
          >
            <span className="nm-txt">🎨 {d.title}</span>
          </button>
        ))}
      </div>
    );
  }

  const weeks = view === "mes" ? monthGrid(startOfMonth(date)) : [];
  const weekDays = view === "semana" ? Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(date), i)) : [];
  const agendaDays = Array.from(new Set([...byDay.keys()])).sort();
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <>
      <div className="page-head">
        <div>
          <h1><span className="live-dot" /> Calendário editorial</h1>
          <p>Planejamento da mídia da Igreja Relevante.</p>
        </div>
        <div className="avatars" aria-label="Equipe">
          {lookups.team.slice(0, 4).map((m) => (
            <Avatar key={m.id} small name={m.full_name || "?"} />
          ))}
        </div>
        <div className="actions">
          {can.manageEvents(profile.role_key) && (
            <button className="btn secondary" onClick={() => setEventModal({ event: null, date })} type="button">
              <IconPlus /> Evento
            </button>
          )}
          {canCreate && (
            <button className="btn" onClick={() => setModal({ content: null, date: view === "dia" ? date : undefined })} type="button">
              <IconPlus /> Novo conteúdo
            </button>
          )}
        </div>
      </div>

      <div className="cal-bar">
        <Link className="btn secondary icon" href={href({ d: step(-1) })} aria-label="Anterior" prefetch={false}>
          <IconChevronL />
        </Link>
        <div className="cal-title">{title}</div>
        <Link className="btn secondary icon" href={href({ d: step(1) })} aria-label="Próximo" prefetch={false}>
          <IconChevronR />
        </Link>
        <Link className="btn secondary sm" href={href({ d: today })} prefetch={false}>
          Hoje
        </Link>
        <div className="view-tabs" style={{ marginLeft: "auto" }}>
          {(["mes", "semana", "dia"] as View[]).map((v) => (
            <Link key={v} href={href({ v })} className={view === v ? "on" : ""} prefetch={false}>
              {v === "mes" ? "Mês" : v === "semana" ? "Semana" : "Dia"}
            </Link>
          ))}
        </div>
      </div>

      <div className="filters">
        <select className="input" aria-label="Plataforma" value={filters.plataforma} onChange={(e) => router.push(href({ plataforma: e.target.value }))}>
          <option value="">Todas as plataformas</option>
          {lookups.platforms.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
        </select>
        <select className="input" aria-label="Formato" value={filters.formato} onChange={(e) => router.push(href({ formato: e.target.value }))}>
          <option value="">Todos os formatos</option>
          {lookups.formats.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
        </select>
        <select className="input" aria-label="Responsável" value={filters.resp} onChange={(e) => router.push(href({ resp: e.target.value }))}>
          <option value="">Todos os responsáveis</option>
          {lookups.team.map((p) => <option key={p.id} value={p.id}>{p.full_name || "Sem nome"}</option>)}
        </select>
        <select className="input" aria-label="Status" value={filters.status} onChange={(e) => router.push(href({ status: e.target.value }))}>
          <option value="">Todos os status</option>
          {lookups.statuses.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
        </select>
        {hasFilters && (
          <Link className="btn ghost sm" href={`/calendario?v=${view}&d=${date}`} prefetch={false}>
            Limpar filtros
          </Link>
        )}
      </div>

      {view === "mes" && (
        <div className="cal">
          <div className="cal-head">
            {WEEKDAYS_SHORT.map((w) => <div key={w}>{w}</div>)}
          </div>
          {weeks.map((w) => (
            <div className="cal-week" key={w[0]}>
              {w.map((day) => dayCell(day, { outside: day.slice(0, 7) !== date.slice(0, 7) }))}
            </div>
          ))}
        </div>
      )}

      {view === "semana" && (
        <div className="cal">
          <div className="week-cols">
            {weekDays.map((day) => (
              <div key={day} style={{ borderRight: "1px solid var(--cream)" }}>
                <div style={{ padding: "8px 8px 0", fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>
                  {WEEKDAYS_SHORT[parseISO(day).getDay()]}
                </div>
                {dayCell(day, { tall: true, full: true, max: 20 })}
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "dia" && (
        <div>
          <div className="day-strip" role="tablist" aria-label="Dias da semana">
            {Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(date), i)).map((day) => {
              const d = parseISO(day);
              const count = (byDay.get(day) ?? []).length;
              return (
                <Link key={day} href={href({ v: "dia", d: day })} prefetch={false} className={`day-pill${day === date ? " on" : ""}${day === today ? " today" : ""}`}>
                  <b>{d.getDate()}</b>
                  <span>{WEEKDAYS_SHORT[d.getDay()]}</span>
                  {count > 0 && <i className="day-count">{count}</i>}
                </Link>
              );
            })}
          </div>

          {(byDay.get(date) ?? []).length === 0 && eventsOn(date).length === 0 && designsOn(date).length === 0 ? (
            <div className="card empty">
              <b>Nada planejado para este dia</b>
              {canCreate && (
                <button className="btn" style={{ marginTop: 12 }} type="button" onClick={() => setModal({ content: null, date })}>
                  <IconPlus /> Adicionar conteúdo
                </button>
              )}
            </div>
          ) : (
            <div className="tcards">
              {eventsOn(date).map((ev) => (
                <button key={ev.id} className="tcard" type="button" onClick={() => setEventModal({ event: ev })}>
                  <span className="tag" style={{ background: "var(--navy)" }}>Evento</span>
                  <b className="tt">{ev.title}</b>
                  {ev.description && <p className="td">{ev.description}</p>}
                </button>
              ))}
              {(byDay.get(date) ?? []).map((c) => {
                const f = formatOf(c.format_key);
                const st = statusOf(c.status_key);
                return (
                  <button key={c.id} className="tcard" type="button" onClick={() => setModal({ content: c })}>
                    <div className="tcard-top">
                      <span className="tag" style={{ background: f?.color }}>{f?.name}</span>
                      <Badge color={st?.color}>{st?.name}</Badge>
                    </div>
                    <b className="tt">{c.title}</b>
                    {c.description && <p className="td">{c.description}</p>}
                    <div className="tfoot">
                      <span className="muted small">{c.scheduled_time ? formatTime(c.scheduled_time) : "Sem horário"}</span>
                      <span className="who"><Avatar small name={memberName(lookups.team, c.assignee_id, "?")} /> <span className="small">{memberName(lookups.team, c.assignee_id)}</span></span>
                    </div>
                  </button>
                );
              })}
              {designsOn(date).map((d) => (
                <Link key={d.id} className="tcard" href="/design">
                  <span className="tag" style={{ background: "#7C3AED" }}>Prazo de arte</span>
                  <b className="tt">{d.title}</b>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="legend">
        {lookups.formats.filter((f) => f.is_active).map((f) => (
          <span key={f.key}><i style={{ background: f.color }} />{f.name}</span>
        ))}
        <span><i style={{ background: "var(--navy)" }} />Evento</span>
        <span>🎨 Prazo de arte</span>
      </div>

      {view !== "dia" && (
        <div className="agenda card">
          <h2 style={{ marginBottom: 8 }}>Lista do período</h2>
          {agendaDays.length === 0 ? (
            <p className="muted small">Nenhum conteúdo neste período.</p>
          ) : (
            agendaDays.map((day) => (
              <div className="day-block" key={day}>
                <h3>{formatDayLong(day)}</h3>
                <div className="list">
                  {(byDay.get(day) ?? []).map((c) => {
                    const f = formatOf(c.format_key);
                    const st = statusOf(c.status_key);
                    return (
                      <button key={c.id} className="list-item" type="button" onClick={() => setModal({ content: c })}>
                        <i style={{ width: 5, alignSelf: "stretch", borderRadius: 3, background: f?.color }} />
                        <div className="grow">
                          <div className="t">{c.title}</div>
                          <div className="meta">
                            <span>{f?.name}</span>
                            {c.scheduled_time && <span>{formatTime(c.scheduled_time)}</span>}
                          </div>
                        </div>
                        <Badge color={st?.color}>{st?.name}</Badge>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {modal && (
        <ContentModal
          key={modal.content?.id ?? `new-${modal.date ?? ""}`}
          content={modal.content}
          defaultDate={modal.date}
          events={eventChoices}
          onClose={() => setModal(null)}
        />
      )}
      {eventModal && (
        <EventModal
          key={eventModal.event?.id ?? "new"}
          event={eventModal.event}
          defaultDate={eventModal.date ?? date}
          onClose={() => setEventModal(null)}
        />
      )}
    </>
  );
}

function EventModal({ event, defaultDate, onClose }: { event: EventRow | null; defaultDate: string; onClose: () => void }) {
  const { profile, toast } = useApp();
  const router = useRouter();
  const [f, setF] = useState({
    title: event?.title ?? "",
    description: event?.description ?? "",
    starts_on: event?.starts_on ?? defaultDate,
    ends_on: event?.ends_on ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editable = can.manageEvents(profile.role_key);

  async function save() {
    setError(null);
    setBusy(true);
    const r = await saveEvent({ id: event?.id, ...f, ends_on: f.ends_on || null });
    setBusy(false);
    if ("error" in r) return setError(r.error);
    toast(r.message ?? "Salvo.", "success");
    router.refresh();
    onClose();
  }

  async function remove() {
    if (!event || !confirm("Excluir este evento? Os conteúdos ligados a ele serão mantidos.")) return;
    setBusy(true);
    const r = await deleteEvent(event.id);
    setBusy(false);
    if ("error" in r) return setError(r.error);
    toast("Evento excluído.", "success");
    router.refresh();
    onClose();
  }

  return (
    <Modal
      title={event ? "Evento" : "Novo evento"}
      onClose={onClose}
      footer={
        <>
          {event && editable && (
            <button className="btn danger" type="button" onClick={remove} disabled={busy} style={{ marginRight: "auto" }}>
              Excluir
            </button>
          )}
          <button className="btn secondary" type="button" onClick={onClose}>Fechar</button>
          {editable && (
            <button className="btn" type="button" onClick={save} disabled={busy}>
              {busy ? "Salvando…" : "Salvar"}
            </button>
          )}
        </>
      }
    >
      <fieldset disabled={!editable} style={{ border: 0, padding: 0, margin: 0 }}>
        <div className="field">
          <label htmlFor="e-title">Nome do evento</label>
          <input id="e-title" className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} autoFocus />
        </div>
        <div className="row">
          <div className="field">
            <label htmlFor="e-start">Data</label>
            <input id="e-start" className="input" type="date" value={f.starts_on} onChange={(e) => setF({ ...f, starts_on: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="e-end">Até (opcional)</label>
            <input id="e-end" className="input" type="date" value={f.ends_on} onChange={(e) => setF({ ...f, ends_on: e.target.value })} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="e-desc">Descrição</label>
          <textarea id="e-desc" className="input" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        </div>
      </fieldset>
      {error && <p className="err" role="alert">{error}</p>}
    </Modal>
  );
}
