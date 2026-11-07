import type { Metadata } from 'next'
import { ComingSoon } from '@/components/coming-soon'

export const metadata: Metadata = { title: 'Design' }

export default function DesignPage() {
  return (
    <ComingSoon
      titulo="Design"
      descricao="Demandas para o designer: descrição, formato, referências, prazo e status."
      etapa="Etapa 4"
    />
  )
}
