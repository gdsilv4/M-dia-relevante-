import type { Metadata } from 'next'
import { ComingSoon } from '@/components/coming-soon'

export const metadata: Metadata = { title: 'Eventos' }

export default function EventosPage() {
  return (
    <ComingSoon
      titulo="Eventos"
      descricao="Cultos, conferências, programações especiais, gravações e outras atividades."
      etapa="Etapa 2"
    />
  )
}
