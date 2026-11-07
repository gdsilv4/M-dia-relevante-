import type { Metadata } from 'next'
import { ComingSoon } from '@/components/coming-soon'

export const metadata: Metadata = { title: 'Calendário' }

export default function CalendarioPage() {
  return (
    <ComingSoon
      titulo="Calendário"
      descricao="Visão mensal, semanal e diária dos eventos da igreja."
      etapa="Etapa 2"
    />
  )
}
