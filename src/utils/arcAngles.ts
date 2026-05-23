export interface ArcPosition {
  x: number
  y: number
  tilt: number
}

export function calcArcPositions(
  count: number,
  radius: number,
  arcDeg: number,
  offsetDeg: number
): ArcPosition[] {
  if (count === 0) return []

  const half = arcDeg / 2
  // Evita divisão por zero se count === 1
  const step = count > 1 ? arcDeg / (count - 1) : 0
  const startDeg = count > 1 ? -half : 0

  return Array.from({ length: count }, (_, i) => {
    const angleDeg = startDeg + step * i + offsetDeg
    const rad = (angleDeg * Math.PI) / 180
    return {
      x: Math.sin(rad) * radius,
      y: -Math.cos(rad) * radius,
      tilt: angleDeg * 1,
    }
  })
}
