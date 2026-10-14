import { useId } from 'react'

interface ArcTextOverlayProps {
  label: string
  diskPx: number
  k?: number // Fraction of disk radius (0.0 – 1.0). Default: 0.88
  arcDeg?: number // Degrees spanned by the arc. Default: 200
}

export function ArcTextOverlay({ label, diskPx, k = 0.93, arcDeg = 200 }: ArcTextOverlayProps) {
  const uid = useId()

  const cx = diskPx / 2
  const cy = diskPx / 2
  const r = (diskPx / 2) * k + 10

  const fontSize = 10
  const letterSpacing = 1

  const deg = diskPx < 640 ? Math.min(arcDeg, 180) : arcDeg
  const startAngleRad = (270 - deg / 2) * (Math.PI / 180)
  const endAngleRad = (270 + deg / 2) * (Math.PI / 180)

  const x1 = cx + r * Math.cos(startAngleRad)
  const y1 = cy + r * Math.sin(startAngleRad)
  const x2 = cx + r * Math.cos(endAngleRad)
  const y2 = cy + r * Math.sin(endAngleRad)

  const largeArc = deg > 180 ? 1 : 0
  const arcPath = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`

  return (
    <svg
      width={diskPx}
      height={diskPx}
      className="absolute inset-0 pointer-events-none"
      style={{ overflow: 'visible' }}
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
    </svg>
  )
}
