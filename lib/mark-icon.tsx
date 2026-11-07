import { ImageResponse } from 'next/og'

// Ícone do app (PROVISÓRIO): símbolo coração com check em círculo, branco sobre azul-marinho.
export function markIcon(px: number) {
  const interno = Math.round(px * 0.66)
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0B1456',
        }}
      >
        <svg width={interno} height={interno} viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="54" stroke="#FFFFFF" strokeWidth="7" />
          <path
            d="M60 84C40 70 35 55 43 47C50 40 58 44 60 50C62 44 70 40 77 47C85 55 80 70 60 84Z"
            stroke="#FFFFFF"
            strokeWidth="6"
            strokeLinejoin="round"
          />
          <path
            d="M50 62L58 70L74 52"
            stroke="#FFFFFF"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { width: px, height: px },
  )
}
