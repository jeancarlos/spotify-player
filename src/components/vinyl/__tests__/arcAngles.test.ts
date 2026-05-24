import { describe, it, expect } from 'vitest'
import { calcArcPositions } from '@/utils/arcAngles'

describe('calcArcPositions', () => {
  it('returns empty positions for 0 items', () => {
    expect(calcArcPositions(0, 300, 160, 0)).toHaveLength(0)
  })

  it('single item is centered on the arc', () => {
    const [pos] = calcArcPositions(1, 300, 160, 0)
    expect(pos.x).toBeCloseTo(0, 0)
    expect(pos.y).toBeLessThan(0) // above center
  })

  it('two items are symmetrical', () => {
    const [a, b] = calcArcPositions(2, 300, 160, 0)
    expect(a.x).toBeCloseTo(-b.x, 1)
    expect(a.y).toBeCloseTo(b.y, 1)
  })

  it('offset shifts all positions angularly', () => {
    const noOffset = calcArcPositions(3, 300, 160, 0)
    const withOffset = calcArcPositions(3, 300, 160, 20)
    expect(withOffset[0].x).not.toBeCloseTo(noOffset[0].x, 1)
  })
})
