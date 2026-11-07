import { TIME_ZONE } from '@/lib/config'

export function saudacao(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('pt-BR', {
    hour: 'numeric',
    hourCycle: 'h23',
    timeZone: TIME_ZONE,
  }).formatToParts(date)
  const hora = Number(parts.find((p) => p.type === 'hour')?.value ?? '12')
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function dataPorExtenso(date: Date = new Date()): string {
  const texto = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: TIME_ZONE,
  }).format(date)
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function primeiroNome(fullName: string | null, email: string | null): string {
  const nome = (fullName ?? '').trim().split(/\s+/)[0]
  if (nome) return nome
  const local = (email ?? '').split('@')[0]
  return local || 'olá'
}
