import { useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ArcTextOverlayProps {
  label: string
  diskPx: number
  // ─── EDITAR AQUI: geometria do arco ───────────────────────────────────────
  k?: number       // fração do raio do disco (0.0 – 1.0). Padrão: 0.88
  arcDeg?: number  // graus abrangidos pelo arco. Padrão: 120
  // ──────────────────────────────────────────────────────────────────────────
}

export function ArcTextOverlay({ label, diskPx, k = 0.88, arcDeg = 120 }: ArcTextOverlayProps) {
  const uid = useId()

  const cx = diskPx / 2
  const cy = diskPx / 2
  const r = (diskPx / 2) * k

  // Arco centrado no topo do disco (270° no sistema SVG onde y cresce para baixo)
  const startAngleRad = (270 - arcDeg / 2) * (Math.PI / 180)
  const endAngleRad = (270 + arcDeg / 2) * (Math.PI / 180)

  const x1 = cx + r * Math.cos(startAngleRad)
  const y1 = cy + r * Math.sin(startAngleRad)
  const x2 = cx + r * Math.cos(endAngleRad)
  const y2 = cy + r * Math.sin(endAngleRad)

  const arcPath = `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`

  return (
    <AnimatePresence>
      <motion.svg
        key="arc-overlay"
        width={diskPx}
        height={diskPx}
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        style={{ overflow: 'visible' }}
        aria-hidden
      >
        <defs>
          <path id={`arc-fav-${uid}`} d={arcPath} />
        </defs>
        <text
          fontSize="11"
          fontWeight="700"
          letterSpacing="2"
          fontFamily="monospace"
          fill="rgba(0,0,0,0.6)"
          paintOrder="stroke fill"
          stroke="white"
          strokeWidth="10"
          strokeLinejoin="round"
        >
          <textPath
            href={`#arc-fav-${uid}`}
            startOffset="50%"
            textAnchor="middle"
          >
            {label.toUpperCase()}
          </textPath>
        </text>
      </motion.svg>
    </AnimatePresence>
  )
}
