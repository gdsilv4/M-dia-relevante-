import type { Activity, Status, TeamMember } from "./types";

const ENTITY_LABEL: Record<string, string> = {
  content: "o conteúdo",
  design_request: "a demanda de design",
  event: "o evento",
  comment: "um comentário em",
  file: "o arquivo",
  share_link: "o link de compartilhamento",
  profile: "o acesso de",
};

const VERBS: Record<string, string> = {
  created: "criou",
  updated: "atualizou",
  deleted: "removeu",
  revoked: "revogou",
  access_changed: "alterou",
};

export function describeActivity(
  a: Activity,
  team: TeamMember[],
  statuses: Status[],
  designStatuses: Status[],
): { actor: string; text: string } {
  const actor = a.actor_id ? team.find((t) => t.id === a.actor_id)?.full_name?.trim() || "Alguém" : "Sistema";
  const title = a.entity_title ? `“${a.entity_title}”` : "";
  const label = ENTITY_LABEL[a.entity_type] ?? "um item";

  if (a.action === "status_changed") {
    const list = a.entity_type === "design_request" ? designStatuses : statuses;
    const to = list.find((s) => s.key === a.details?.to)?.name ?? String(a.details?.to ?? "");
    return { actor, text: `mudou o status ${label === "o conteúdo" ? "do conteúdo" : "da demanda"} ${title} para ${to}` };
  }
  if (a.entity_type === "comment") {
    return { actor, text: a.action === "deleted" ? "removeu um comentário" : `comentou: ${title}` };
  }
  if (a.entity_type === "file") {
    return { actor, text: `${a.action === "deleted" ? "removeu" : "enviou"} o arquivo ${title}` };
  }
  const verb = VERBS[a.action] ?? a.action;
  return { actor, text: `${verb} ${label} ${title}`.trim() };
}
