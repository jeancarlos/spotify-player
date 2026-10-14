import { describe, it, expect } from 'vitest'
import { homeDiskOffset } from '../diskLayout'

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
})
