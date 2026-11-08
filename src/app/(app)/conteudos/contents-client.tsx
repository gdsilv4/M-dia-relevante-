"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/components/app-provider";
import ContentModal from "@/components/content-modal";
import { IconDoc, IconPlus } from "@/components/icons";
import { Badge, Empty, FormatDot, memberName } from "@/components/ui";
import { formatDateBR, formatTime } from "@/lib/dates";
import { can } from "@/lib/permissions";
import type { Content, EventRow } from "@/lib/types";

interface Filters {
  q: string;
  status: string;
  formato: string;
  resp: string;
  plataforma: string;
}

export default function ContentsClient({ contents, events, filters }: { contents: Content[]; events: EventRow[]; filters: Filters }) {
  const { profile, lookups } = useApp();
  const router = useRouter();
  const [modal, setModal] = useState<Content | null | undefined>(undefined);
  const [q, setQ] = useState(filters.q);

  const go = (patch: Partial<Filters>) => {
    const next = { ...filters, ...patch };
    const p = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => v && p.set(k, v));
    router.push(`/conteudos${p.toString() ? `?${p}` : ""}`);
  };
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Conteúdos</h1>
          <p>Posts, carrosséis, Stories e Reels: legenda, referências e responsáveis.</p>
        </div>
        {can.createContent(profile.role_key) && (
          <button className="btn" type="button" onClick={() => setModal(null)}>
            <IconPlus /> Novo conteúdo
          </button>
        )}
      </div>

      <form
        className="filters"
        onSubmit={(e) => {
          e.preventDefault();
          go({ q: q.trim() });
        }}
      >
        <input className="input" type="search" placeholder="Buscar por título ou legenda" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 280 }} aria-label="Buscar" />
        <select className="input" aria-label="Status" value={filters.status} onChange={(e) => go({ status: e.target.value })}>
          <option value="">Todos os status</option>
          {lookups.statuses.map((s) => <option key={s.key} value={s.key}>{s.name}</option>)}
        </select>
        <select className="input" aria-label="Formato" value={filters.formato} onChange={(e) => go({ formato: e.target.value })}>
          <option value="">Todos os formatos</option>
          {lookups.formats.map((s) => <option key={s.key} value={s.key}>{s.name}</option>)}
        </select>
        <select className="input" aria-label="Responsável" value={filters.resp} onChange={(e) => go({ resp: e.target.value })}>
          <option value="">Todos os responsáveis</option>
          {lookups.team.map((s) => <option key={s.id} value={s.id}>{s.full_name || "Sem nome"}</option>)}
        </select>
        {lookups.platforms.length > 1 && (
          <select className="input" aria-label="Plataforma" value={filters.plataforma} onChange={(e) => go({ plataforma: e.target.value })}>
            <option value="">Todas as plataformas</option>
            {lookups.platforms.map((s) => <option key={s.key} value={s.key}>{s.name}</option>)}
          </select>
        )}
        {hasFilters && (
          <button type="button" className="btn ghost sm" onClick={() => { setQ(""); router.push("/conteudos"); }}>
            Limpar filtros
          </button>
        )}
      </form>

      <div className="card">
        {contents.length === 0 ? (
          <Empty icon={<IconDoc />} title={hasFilters ? "Nenhum conteúdo encontrado" : "Nenhum conteúdo cadastrado"}>
            <p className="small">
              {hasFilters ? "Ajuste ou limpe os filtros." : "Crie o primeiro conteúdo para começar o planejamento."}
            </p>
          </Empty>
        ) : (
          <div className="list">
            {contents.map((c) => {
              const f = lookups.formats.find((x) => x.key === c.format_key);
              const st = lookups.statuses.find((x) => x.key === c.status_key);
              return (
                <button key={c.id} type="button" className="list-item" onClick={() => setModal(c)}>
                  <div className="grow">
                    <div className="t">{c.title}</div>
                    <div className="meta">
                      <span><FormatDot format={f} /> {f?.name}</span>
                      <span>{c.scheduled_date ? `${formatDateBR(c.scheduled_date)}${c.scheduled_time ? ` · ${formatTime(c.scheduled_time)}` : ""}` : "Sem data"}</span>
                      <span>{memberName(lookups.team, c.assignee_id)}</span>
                    </div>
                  </div>
                  <Badge color={st?.color}>{st?.name}</Badge>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {modal !== undefined && (
        <ContentModal key={modal?.id ?? "new"} content={modal} events={events} onClose={() => setModal(undefined)} />
      )}
    </>
  );
}
