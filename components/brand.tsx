// Símbolo e logotipo PROVISÓRIOS, redesenhados a partir das referências enviadas.
// Quando o guia de rebranding chegar, troque por os arquivos oficiais (SVG/PNG) em /public.

export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
      className="brand-mark"
    >
      <circle cx="60" cy="60" r="54" strokeWidth="7" />
      <path
        d="M60 84C40 70 35 55 43 47C50 40 58 44 60 50C62 44 70 40 77 47C85 55 80 70 60 84Z"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <path d="M50 62L58 70L74 52" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Wordmark({ size = 28 }: { size?: number }) {
  return (
    <span className="wordmark" aria-label="Igreja Relevante">
      <BrandMark size={size} />
      <span className="wm-text" aria-hidden="true">
        <span className="wm-light">IGREJA</span>
        <span className="wm-bold">RELEVANTE</span>
      </span>
    </span>
  )
}
