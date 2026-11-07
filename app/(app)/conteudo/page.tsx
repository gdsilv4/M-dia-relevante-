import type { Metadata } from 'next'
import { ComingSoon } from '@/components/coming-soon'

export const metadata: Metadata = { title: 'Conteúdo' }

export default function ConteudoPage() {
  return (
    <ComingSoon
      titulo="Conteúdo"
      descricao="Publicações, carrosséis, campanhas, legendas, referências e datas de publicação."
      etapa="Etapa 3"
    />
  )
}
