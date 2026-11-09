import Link from "next/link";
import { describeActivity } from "@/lib/activity";
import { getActivity, getLookups, requireProfile } from "@/lib/data";
import { capitalize, daysUntil, formatDateBR, formatTime, monthGrid, monthLabel, parseISO, startOfMonth, addMonths, timeAgo, todayISO, WEEKDAYS_SHORT } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import type { Content, DesignRequest } from "@/lib/types";
import { Badge, Empty } from "@/components/ui";
import { IconBrush, IconCalendar, IconCheck, IconDoc, IconSend, LogoMark } from "@/components/icons";

export const metadata = { title: "Início" };

export default async function DashboardPage() {
  const profile = await requireProfile();
  const lookups = await getLookups();
  const supabase = await createClient();

  const [c, d, activity] = await Promise.all([
    supabase.from("contents").select("*").order("scheduled_date", { ascending: true, nullsFirst: false }).limit(2000),
    supabase.from("design_requests").select("*").order("due_date", { ascending: true, nullsFirst: false }).limit(1000),
    getActivity({ limit: 8 }),
  ]);
  const contents = (c.data ?? []) as Content[];
  const designs = (d.data ?? []) as DesignRequest[];

  const today = todayISO();
  const mStart = startOfMonth(today);
  const mEnd = addMonths(mStart, 1);
  const finalContent = new Set(lookups.statuses.filter((s) => s.is_final).map((s) => s.key));
  const finalDesign = new Set(lookups.designStatuses.filter((s) => s.is_final).map((s) => s.key));
  const statusName = (k: string) => lookups.statuses.find((s) => s.key === k);
  const formatOf = (k: string) => lookups.formats.find((f) => f.key === k);

  const upcoming = contents.filter((x) => x.scheduled_date && x.scheduled_date >= today && !finalContent.has(x.status_key)).slice(0, 6);
  const pendingKeys = new Set(["ideia", "planejado", "em_preparacao", "aguardando_design", "em_revisao"]);
  const pending = contents.filter((x) => pendingKeys.has(x.status_key));
  const openDesign = designs.filter((x) => !finalDesign.has(x.status_key));
  const inProduction = designs.filter((x) => x.status_key === "em_producao");
  const awaitingApproval = designs.filter((x) => x.status_key === "em_revisao");
  const lateDesign = designs.filter((x) => x.due_date && x.due_date < today && !finalDesign.has(x.status_key));
  const lateContent = contents.filter((x) => x.scheduled_date && x.scheduled_date < today && !finalContent.has(x.status_key));
  const monthContents = contents.filter((x) => x.scheduled_date && x.scheduled_date >= mStart && x.scheduled_date < mEnd);
  const publishedMonth = monthContents.filter((x) => x.status_key === "publicado");
  const monthByStatus = lookups.statuses
    .map((s) => ({ s, n: monthContents.filter((x) => x.status_key === s.key).length }))
    .filter((x) => x.n > 0);

  const first = (profile.full_name || "").trim().split(/\s+/)[0];
  const lateTotal = lateDesign.length + lateContent.length;

  const weeks = monthGrid(today);
  const byDate = new Map<string, Content[]>();
  monthContents.forEach((x) => {
    const k = x.scheduled_date!;
    byDate.set(k, [...(byDate.get(k) ?? []), x]);
  });
  const pct = monthContents.length ? Math.round((publishedMonth.length / monthContents.length) * 100) : 0;
  const inProgress = monthContents.filter((x) => !["publicado", "agendado", "ideia", "cancelado"].includes(x.status_key)).length;
  const scheduledN = monthContents.filter((x) => x.status_key === "agendado").length;
  const ideaN = monthContents.filter((x) => x.status_key === "ideia").length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{first ? `Olá, ${first}! 👋` : "Início"}</h1>
          <p>Aqui está um resumo da operação de mídia da Igreja Relevante.</p>
        </div>
        <div className="actions">
          <Link className="btn" href="/calendario">
            <IconCalendar /> Calendário
          </Link>
        </div>
      </div>

      <div className="grid cols-4 dash-stats">
        <Link href="/calendario" className="card stat dark">
          <span className="si blue"><IconSend /></span>
          <div><span className="n">{upcoming.length}</span><b>Publicações próximas</b><span className="l">Em aberto à frente</span></div>
        </Link>
        <Link href="/conteudos" className="card stat dark hl">
          <span className="si amber"><IconDoc /></span>
          <div><span className="n">{pending.length}</span><b>Conteúdos pendentes</b><span className="l">Em planejamento</span></div>
        </Link>
        <Link href="/design" className="card stat dark">
          <span className="si violet"><IconBrush /></span>
          <div><span className="n">{openDesign.length}</span><b>Demandas de design</b><span className="l">{lateTotal > 0 ? `${lateTotal} atrasada(s)` : "Abertas"}</span></div>
        </Link>
        <Link href="/conteudos" className="card stat dark">
          <span className="si green"><IconCheck /></span>
          <div><span className="n">{publishedMonth.length}</span><b>Publicações do mês</b><span className="l">de {monthContents.length} no mês</span></div>
        </Link>
      </div>

      <div className="dash-grid">
        <section className="card dash-cal">
          <div className="card-head">
            <h2><IconCalendar className="hi" /> Calendário Editorial</h2>
            <Link className="btn ghost sm" href="/calendario">Ver calendário completo →</Link>
          </div>
          <div className="mini-cal-title">{capitalize(monthLabel(today))}</div>
          <div className="mini-cal">
            {WEEKDAYS_SHORT.map((w) => (
              <div className="mc-h" key={w}>{w}</div>
            ))}
            {weeks.flat().map((d) => {
              const items = byDate.get(d) ?? [];
              const inMonth = d >= mStart && d < mEnd;
              return (
                <Link key={d} href={`/calendario?v=dia&d=${d}`} className={`mc-d${inMonth ? "" : " out"}${d === today ? " today" : ""}`}>
                  <span className="mc-n">{parseISO(d).getDate()}</span>
                  {items.slice(0, 2).map((x) => {
                    const f = formatOf(x.format_key);
                    return (
                      <span key={x.id} className="mc-pill" style={{ background: `${f?.color ?? "#2457d6"}22`, color: f?.color ?? "#2457d6" }}>
                        {x.title}
                      </span>
                    );
                  })}
                  {items.length > 2 && <span className="mc-more">+{items.length - 2}</span>}
                </Link>
              );
            })}
          </div>
        </section>

        <section className="card dash-next">
          <div className="card-head">
            <h2><IconSend className="hi" /> Próximas Publicações</h2>
            <Link className="btn ghost sm" href="/conteudos">Ver todas →</Link>
          </div>
          {upcoming.length === 0 ? (
            <Empty icon={<IconCalendar />} title="Nada agendado à frente">
              <p className="small">Cadastre conteúdos com data para vê-los aqui.</p>
            </Empty>
          ) : (
            <div className="list">
              {upcoming.map((x) => {
                const st = statusName(x.status_key);
                const dd = daysUntil(x.scheduled_date!, today);
                const dt = parseISO(x.scheduled_date!);
                return (
                  <Link key={x.id} className="list-item" href={`/calendario?v=dia&d=${x.scheduled_date}`}>
                    <div className="datebox">
                      <b>{dt.getDate()}</b>
                      <span>{["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"][dt.getMonth()]}</span>
                    </div>
                    <div className="grow">
                      <div className="t">{x.title}</div>
                      <div className="meta">
                        <span>{formatOf(x.format_key)?.name}</span>
                        {x.scheduled_time && <span>{formatTime(x.scheduled_time)}</span>}
                        <span>{dd === 0 ? "hoje" : dd === 1 ? "amanhã" : `em ${dd} dias`}</span>
                      </div>
                    </div>
                    <Badge color={st?.color}>{st?.name}</Badge>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <div className="dash-grid two">
        <section className="card">
          <div className="card-head"><h2>Resumo do Mês</h2></div>
          <div className="donut-wrap">
            <div className="donut" style={{ background: `conic-gradient(var(--blue) ${pct * 3.6}deg, #e6e9f3 0)` }}>
              <div><b>{pct}%</b><span>do planejamento</span></div>
            </div>
            <ul className="legend-list">
              <li><i style={{ background: "#2457d6" }} />Publicadas <b>{publishedMonth.length}</b></li>
              <li><i style={{ background: "#8b5cf6" }} />Agendadas <b>{scheduledN}</b></li>
              <li><i style={{ background: "#f5a524" }} />Em andamento <b>{inProgress}</b></li>
              <li><i style={{ background: "#c9cfdf" }} />Ideias <b>{ideaN}</b></li>
            </ul>
          </div>
        </section>

        <section className="card">
          <div className="card-head"><h2>Atividades Recentes</h2></div>
          {activity.length === 0 ? (
            <Empty title="Sem atividades ainda">
              <p className="small">As alterações da equipe aparecem aqui.</p>
            </Empty>
          ) : (
            <div className="timeline">
              {activity.map((a) => {
                const dsc = describeActivity(a, lookups.team, lookups.statuses, lookups.designStatuses);
                return (
                  <div className="ev" key={a.id}>
                    <span className="dot" />
                    <div>
                      <b>{dsc.actor}</b> {dsc.text}
                      <div className="muted small">{timeAgo(a.created_at)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

    </>
  );
}
