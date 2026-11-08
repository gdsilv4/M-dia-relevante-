export type RoleKey = "admin" | "planejamento" | "designer" | "colaborador" | "visualizador";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role_key: RoleKey | null;
  is_active: boolean;
  avatar_path: string | null;
  must_change_password: boolean;
  created_at: string;
}

export interface TeamMember {
  id: string;
  full_name: string | null;
  role_key: RoleKey | null;
  avatar_path: string | null;
}

export interface Status {
  key: string;
  name: string;
  color: string;
  sort_order: number;
  is_final: boolean;
  is_active: boolean;
  share_visible?: boolean;
}

export interface Format {
  key: string;
  name: string;
  color: string;
  sort_order: number;
  is_active: boolean;
}

export interface Platform {
  key: string;
  name: string;
  is_active: boolean;
}

export interface Content {
  id: string;
  title: string;
  description: string | null;
  platform_key: string;
  format_key: string;
  status_key: string;
  event_id: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  caption: string | null;
  hashtags: string[];
  reference_notes: string | null;
  internal_notes: string | null;
  assignee_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DesignRequest {
  id: string;
  title: string;
  description: string | null;
  reference_notes: string | null;
  art_text: string | null;
  format_label: string | null;
  dimensions: string | null;
  requested_on: string;
  due_date: string | null;
  designer_id: string | null;
  status_key: string;
  content_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventRow {
  id: string;
  title: string;
  description: string | null;
  starts_on: string;
  ends_on: string | null;
  created_by: string | null;
}

export interface CommentRow {
  id: string;
  content_id: string | null;
  design_request_id: string | null;
  author_id: string | null;
  body: string;
  created_at: string;
}

export type FileCategory = "imagem" | "arte_final" | "referencia" | "documento" | "apoio";

export interface FileRow {
  id: string;
  storage_path: string;
  name: string;
  mime_type: string | null;
  size_bytes: number | null;
  category: FileCategory;
  content_id: string | null;
  design_request_id: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface FileWithUrl extends FileRow {
  url: string | null;
}

export interface ShareLink {
  id: string;
  token: string;
  label: string;
  month: string;
  include_design: boolean;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

export interface Activity {
  id: number;
  actor_id: string | null;
  entity_type: string;
  entity_id: string | null;
  entity_title: string | null;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface AccessRequest {
  id: string;
  full_name: string;
  email: string;
  message: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export type ActionResult = { ok: true; message?: string; data?: Record<string, unknown> } | { error: string };
