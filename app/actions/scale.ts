'use server'

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile?.is_active) redirect('/login')
  if (profile.role_key !== 'admin') redirect('/sem-acesso')
  return { supabase: await createClient(), user }
}

export async function addMember(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  const area = String(formData.get('area') ?? '').trim() || 'Mídia'
  if (!name || name.length > 100 || area.length > 60) redirect('/equipe?erro=validacao')

  const { supabase, user } = await requireAdmin()
  const { error } = await supabase.from('media_team_members').insert({
    full_name: name,
    area,
    created_by: user.id,
  })
  redirect(error ? '/equipe?erro=banco' : '/equipe?ok=integrante')
}

export async function setMemberActive(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  const isActive = String(formData.get('is_active')) === 'true'
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect('/equipe?erro=validacao')

  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('media_team_members').update({ is_active: isActive }).eq('id', id)
  redirect(error ? '/equipe?erro=banco' : '/equipe?ok=integrante')
}

export async function addScheduleAssignment(formData: FormData) {
  const shiftDate = String(formData.get('shift_date') ?? '')
  const activity = String(formData.get('activity') ?? '').trim()
  const responsibility = String(formData.get('responsibility') ?? '').trim()
  const memberId = String(formData.get('team_member_id') ?? '')
  const notes = String(formData.get('notes') ?? '').trim()
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(shiftDate) ||
    !activity ||
    activity.length > 120 ||
    !responsibility ||
    responsibility.length > 100 ||
    !/^[0-9a-f-]{36}$/i.test(memberId) ||
    notes.length > 300
  ) {
    redirect(`/calendario?date=${encodeURIComponent(shiftDate)}&erro=validacao`)
  }

  const { supabase, user } = await requireAdmin()
  const { data: member } = await supabase
    .from('media_team_members')
    .select('id')
    .eq('id', memberId)
    .eq('is_active', true)
    .maybeSingle()
  if (!member) redirect(`/calendario?date=${encodeURIComponent(shiftDate)}&erro=integrante`)

  const { error } = await supabase.from('media_schedule_assignments').insert({
    shift_date: shiftDate,
    activity,
    responsibility,
    team_member_id: memberId,
    notes,
    created_by: user.id,
  })
  redirect(
    error
      ? `/calendario?date=${encodeURIComponent(shiftDate)}&erro=banco`
      : `/calendario?date=${encodeURIComponent(shiftDate)}&ok=escala`,
  )
}

export async function removeScheduleAssignment(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  const shiftDate = String(formData.get('shift_date') ?? '')
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect('/calendario?erro=validacao')

  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('media_schedule_assignments').delete().eq('id', id)
  redirect(
    error
      ? `/calendario?date=${encodeURIComponent(shiftDate)}&erro=banco`
      : `/calendario?date=${encodeURIComponent(shiftDate)}&ok=removido`,
  )
}
