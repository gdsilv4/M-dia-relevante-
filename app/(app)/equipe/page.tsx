import type { Metadata } from 'next'
import { ComingSoon } from '@/components/coming-soon'

export const metadata: Metadata = { title: 'Equipe' }

export default function EquipePage() {
  return (
    <ComingSoon
      titulo="Equipe"
      descricao="Cadastro de membros, funções e permissões de acesso."
      etapa="Etapa 7"
    />
  )
}
