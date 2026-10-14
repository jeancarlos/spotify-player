const MAX_DISK_PX = 720
const MIN_DISK_PX = 300
const MOBILE_PLAYER_CLEARANCE = 70
const SEARCH_CLEARANCE = 127
const CARD_OVERHANG = 130

function offsetFor(diskPx: number, viewportWidth: number): number {
  const offset = Math.round(diskPx * 0.28)
  return viewportWidth < 768 ? offset - MOBILE_PLAYER_CLEARANCE : offset
}

export function arcGeometry(diskPx: number, viewportWidth: number) {
  const translateY = offsetFor(diskPx, viewportWidth)
  const arcRadius = Math.max(130, Math.round(diskPx * 0.45))
  const arcBottom = Math.max(80, diskPx - translateY - arcRadius - (viewportWidth < 768 ? 0 : 20))
  return { translateY, arcRadius, arcBottom }
}

export function arcCardTop(diskPx: number, viewportWidth: number, viewportHeight: number): number {
  const { arcRadius, arcBottom } = arcGeometry(diskPx, viewportWidth)
  return viewportHeight - arcBottom - arcRadius - CARD_OVERHANG
}

// ponytail: floors at 300 px, so very short landscape phones can still overlap; shrink the cards too if that matters
export function homeDiskPx(viewportWidth: number, viewportHeight = Infinity): number {
  let px = Math.min(MAX_DISK_PX, viewportWidth)
  while (px > MIN_DISK_PX && arcCardTop(px, viewportWidth, viewportHeight) < SEARCH_CLEARANCE) px -= 10
  return px
}

export function homeDiskOffset(viewportWidth: number, viewportHeight = Infinity): number {
  return offsetFor(homeDiskPx(viewportWidth, viewportHeight), viewportWidth)
}
