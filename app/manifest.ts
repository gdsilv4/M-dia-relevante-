import type { MetadataRoute } from 'next'
import { APP_NAME } from '@/lib/config'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: 'Planejamento de conteúdo e comunicação da equipe de mídia.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FBF7EC',
    theme_color: '#0B1456',
    lang: 'pt-BR',
    icons: [
      { src: '/icon', sizes: '512x512', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  }
}
