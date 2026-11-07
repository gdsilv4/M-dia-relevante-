import type { Metadata, Viewport } from 'next'
import { Montserrat } from 'next/font/google'
import './globals.css'
import { APP_NAME } from '@/lib/config'

// Fonte PROVISÓRIA (parecida com a do logotipo). Será trocada quando o guia de rebranding chegar.
const fonte = Montserrat({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: 'Planejamento de conteúdo e comunicação da equipe de mídia.',
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: 'default' },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0B1456',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={fonte.variable}>
      <body>{children}</body>
    </html>
  )
}
