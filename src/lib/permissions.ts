import type { RoleKey } from "./types";

export const ROLE_LABELS: Record<RoleKey, string> = {
  admin: "Administrador",
  planejamento: "Planejamento",
  designer: "Designer",
  colaborador: "Colaborador",
  visualizador: "Visualizador",
};

export const ROLE_DESCRIPTIONS: Record<RoleKey, string> = {
  admin: "Acesso total: equipe, configurações, status e tudo que os demais podem fazer.",
  planejamento: "Cria e edita conteúdos, eventos, demandas de design e links de compartilhamento.",
  designer: "Vê conteúdos e demandas, atualiza o status das próprias demandas, comenta e envia artes.",
  colaborador: "Cria conteúdos e demandas, edita os que criou ou que são dele, comenta e envia arquivos.",
  visualizador: "Somente leitura.",
};

export const ASSIGNABLE_ROLES: RoleKey[] = ["admin", "planejamento", "designer", "colaborador", "visualizador"];

type Role = RoleKey | null | undefined;

const isAny = (role: Role, list: RoleKey[]) => !!role && list.includes(role);

export const can = {
  manageTeam: (role: Role) => role === "admin",
  manageSettings: (role: Role) => role === "admin",
  manageShare: (role: Role) => isAny(role, ["admin", "planejamento"]),
  manageEvents: (role: Role) => isAny(role, ["admin", "planejamento"]),
  createContent: (role: Role) => isAny(role, ["admin", "planejamento", "colaborador"]),
  deleteContent: (role: Role) => isAny(role, ["admin", "planejamento"]),
  editContent: (role: Role, userId: string, c: { assignee_id: string | null; created_by: string | null }) =>
    isAny(role, ["admin", "planejamento"]) ||
    (role === "colaborador" && (c.assignee_id === userId || c.created_by === userId)),
  createDesign: (role: Role) => isAny(role, ["admin", "planejamento", "colaborador"]),
  editDesign: (role: Role) => isAny(role, ["admin", "planejamento"]),
  deleteDesign: (role: Role) => isAny(role, ["admin", "planejamento"]),
  changeDesignStatus: (role: Role, userId: string, d: { designer_id: string | null }) =>
    isAny(role, ["admin", "planejamento"]) || (role === "designer" && d.designer_id === userId),
  comment: (role: Role) => isAny(role, ["admin", "planejamento", "colaborador", "designer"]),
  uploadFiles: (role: Role) => isAny(role, ["admin", "planejamento", "colaborador", "designer"]),
  deleteFile: (role: Role, userId: string, f: { uploaded_by: string | null }) =>
    isAny(role, ["admin", "planejamento"]) || f.uploaded_by === userId,
};
