import { describe, it, expect } from 'vitest'
import { arcCardTop, homeDiskOffset, homeDiskPx } from '../diskLayout'

const MINI_PLAYER_TOP = 80

function labelBottom(vw: number) {
  const diskPx = Math.min(720, vw)
  const centreFromBottom = diskPx / 2 - homeDiskOffset(vw)
  return centreFromBottom - diskPx * 0.13
}

describe('homeDiskOffset', () => {
  it('keeps the vinyl label clear of the mini player on phones', () => {
    for (const vw of [360, 375, 390, 430]) expect(labelBottom(vw)).toBeGreaterThan(MINI_PLAYER_TOP)
  })

  it('keeps the desktop offset unchanged', () => {
    expect(homeDiskOffset(1280)).toBe(Math.round(720 * 0.28))
  })

  it('shrinks the disk on short screens so the arc clears the search bar', () => {
    for (const [vw, vh] of [[900, 640], [1280, 720], [1366, 768], [390, 667], [360, 640], [1920, 1080]])
      expect(arcCardTop(homeDiskPx(vw, vh), vw, vh)).toBeGreaterThanOrEqual(127)
  })

  it('keeps the full size when there is room', () => {
    expect(homeDiskPx(1920, 1080)).toBe(720)
    expect(homeDiskPx(390, 844)).toBe(390)
  })
})
