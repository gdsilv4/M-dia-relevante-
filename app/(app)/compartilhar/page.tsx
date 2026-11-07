import type { Metadata } from 'next'
import { ComingSoon } from '@/components/coming-soon'

export const metadata: Metadata = { title: 'Compartilhar' }

export default function CompartilharPage() {
  return (
    <ComingSoon
      titulo="Compartilhar"
      descricao="Link somente de visualização do planejamento mensal para o designer."
      etapa="Etapa 6"
    />
  )
}
