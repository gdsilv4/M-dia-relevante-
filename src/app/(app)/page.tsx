import Link from "next/link";
import { describeActivity } from "@/lib/activity";
import { getActivity, getLookups, requireProfile } from "@/lib/data";
import { capitalize, daysUntil, formatDateBR, formatTime, monthLabel, parseISO, startOfMonth, addMonths, timeAgo, todayISO } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import type { Content, DesignRequest } from "@/lib/types";
import { Badge, Empty } from "@/components/ui";
import { IconCalendar } from "@/components/icons";

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

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{first ? `Olá, ${first}` : "Início"}</h1>
          <p>{capitalize(monthLabel(today))} · visão geral da mídia</p>
        </div>
        <div className="actions">
          <Link className="btn" href="/calendario">
            <IconCalendar /> Abrir calendário
          </Link>
        </div>
      </div>

      <div className="grid cols-4" style={{ marginBottom: 16 }}>
        <Link href="/conteudos" className="card stat blue">
          <span className="n">{pending.length}</span>
          <span className="l">Conteúdos pendentes</span>
        </Link>
        <Link href="/design" className="card stat">
          <span className="n">{openDesign.length}</span>
          <span className="l">Demandas de design abertas</span>
        </Link>
        <Link href="/design" className="card stat">
          <span className="n">{inProduction.length}</span>
          <span className="l">Artes em produção</span>
        </Link>
        <Link href="/design" className="card stat">
          <span className="n">{awaitingApproval.length}</span>
          <span className="l">Artes aguardando aprovação</span>
        </Link>
        <div className={`card stat${lateTotal > 0 ? " warn" : ""}`}>
          <span className="n">{lateTotal}</span>
          <span className="l">Entregas atrasadas</span>
        </div>
        <div className="card stat">
          <span className="n">{publishedMonth.length}</span>
          <span className="l">Publicados no mês</span>
        </div>
        <div className="card stat">
          <span className="n">{monthContents.length}</span>
          <span className="l">Conteúdos no mês</span>
        </div>
        <div className="card stat">
          <span className="n">{upcoming.length}</span>
          <span className="l">Próximas publicações</span>
        </div>
      </div>

      <div className="grid cols-2 stack">
        <section className="card">
          <div className="card-head">
            <h2>Próximas publicações</h2>
            <Link className="btn ghost sm" href="/calendario">Ver calendário</Link>
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

        <section className="card">
          <div className="card-head">
            <h2>Atrasos e prazos</h2>
          </div>
          {lateTotal === 0 && openDesign.filter((x) => x.due_date).length === 0 ? (
            <Empty title="Tudo em dia">
              <p className="small">Sem entregas atrasadas ou prazos de design à vista.</p>
            </Empty>
          ) : (
            <div className="list">
              {[...lateDesign, ...lateContent].slice(0, 4).map((x) => {
                const isDesign = "due_date" in x;
                const date = isDesign ? (x as DesignRequest).due_date : (x as Content).scheduled_date;
                return (
                  <Link key={x.id} className="list-item" href={isDesign ? "/design" : `/calendario?v=dia&d=${date}`}>
                    <div className="grow">
                      <div className="t">{x.title}</div>
                      <div className="meta">
                        <span className="late">Atrasado desde {formatDateBR(date)}</span>
                        <span>{isDesign ? "Design" : "Publicação"}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
              {openDesign
                .filter((x) => x.due_date && x.due_date >= today)
                .slice(0, 4)
                .map((x) => (
                  <Link key={x.id} className="list-item" href="/design">
                    <div className="grow">
                      <div className="t">{x.title}</div>
                      <div className="meta">
                        <span>Prazo: {formatDateBR(x.due_date)}</span>
                        <span>Design</span>
                      </div>
                    </div>
                    <Badge color={lookups.designStatuses.find((s) => s.key === x.status_key)?.color}>
                      {lookups.designStatuses.find((s) => s.key === x.status_key)?.name}
                    </Badge>
                  </Link>
                ))}
            </div>
          )}
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Resumo de {monthLabel(today)}</h2>
          </div>
          {monthByStatus.length === 0 ? (
            <Empty title="Mês sem conteúdos">
              <p className="small">Os conteúdos com data neste mês aparecem aqui, por status.</p>
            </Empty>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {monthByStatus.map(({ s, n }) => (
                <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 130 }} className="small">{s.name}</span>
                  <div style={{ flex: 1, background: "#f3efe3", borderRadius: 999, height: 10, overflow: "hidden" }}>
                    <div style={{ width: `${(n / monthContents.length) * 100}%`, background: s.color, height: "100%" }} />
                  </div>
                  <b style={{ width: 26, textAlign: "right" }}>{n}</b>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Atividades recentes</h2>
          </div>
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
