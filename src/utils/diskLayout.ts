const MAX_DISK_PX = 720
const MOBILE_PLAYER_CLEARANCE = 70

export function homeDiskOffset(viewportWidth: number): number {
  const diskPx = Math.min(MAX_DISK_PX, viewportWidth)
  const offset = Math.round(diskPx * 0.28)
  return viewportWidth < 768 ? offset - MOBILE_PLAYER_CLEARANCE : offset
}
