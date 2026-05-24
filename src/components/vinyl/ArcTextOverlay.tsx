import { useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ArcTextOverlayProps {
  label: string
  diskPx: number
  isPlaying?: boolean
  // ─── EDITAR AQUI: geometria do arco ───────────────────────────────────────
  k?: number // fração do raio do disco (0.0 – 1.0). Padrão: 0.88
  arcDeg?: number // graus abrangidos pelo arco. Padrão: 200
  // ──────────────────────────────────────────────────────────────────────────
}

export function ArcTextOverlay({
  label,
  diskPx,
  isPlaying = false,
  k = 0.93,
  arcDeg = 200,
}: ArcTextOverlayProps) {
  const uid = useId()

  const cx = diskPx / 2
  const cy = diskPx / 2
  const r = (diskPx / 2) * k + 10

  const fontSize = 10
  const letterSpacing = 1

  const startAngleRad = (270 - arcDeg / 2) * (Math.PI / 230)
  const endAngleRad = (270 + arcDeg / 2) * (Math.PI / 230)

  const x1 = cx + r * Math.cos(startAngleRad)
  const y1 = cy + r * Math.sin(startAngleRad)
  const x2 = cx + r * Math.cos(endAngleRad)
  const y2 = cy + r * Math.sin(endAngleRad)

  const arcPath = `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`

  const rotateTransition = isPlaying
    ? { duration: 8, ease: 'linear' as const, repeat: Infinity }
    : { duration: 1.2, ease: 'easeOut' as const }

  return (
    <AnimatePresence>
      <motion.svg
        key="arc-overlay"
        width={diskPx}
        height={diskPx}
        className="absolute inset-0 pointer-events-none"
        initial={{ rotate: -180 }}
        animate={{ rotate: isPlaying ? 180 : -180 }}
        transition={rotateTransition}
        style={{ overflow: 'visible', originX: '50%', originY: '50%' }}
        aria-hidden
      >
        <defs>
          <path id={`arc-fav-${uid}`} d={arcPath} />
        </defs>
        <text
          fontSize={fontSize}
          fontWeight="700"
          letterSpacing={letterSpacing}
          fontFamily="inter"
          fill="rgba(0,0,0,0.75)"
        >
          <textPath href={`#arc-fav-${uid}`} startOffset="50%" textAnchor="middle">
            {label}
          </textPath>
        </text>
      </motion.svg>
    </AnimatePresence>
  )
}
