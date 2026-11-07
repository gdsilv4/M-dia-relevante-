export type LoginState = { error: string | null }

export type Profile = {
  id: string
  email: string | null
  full_name: string | null
  role_key: string | null
  is_active: boolean
}
