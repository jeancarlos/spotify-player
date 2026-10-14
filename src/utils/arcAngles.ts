export interface ArcPosition {
  x: number
  y: number
  tilt: number
}

const MAX_STEP_DEG = 25

export function calcArcPositions(
  count: number,
  radius: number,
  arcDeg: number,
  offsetDeg: number
): ArcPosition[] {
  if (count === 0) return []

  const step = count > 1 ? Math.min(arcDeg / (count - 1), MAX_STEP_DEG) : 0
  const startDeg = (-step * (count - 1)) / 2

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
