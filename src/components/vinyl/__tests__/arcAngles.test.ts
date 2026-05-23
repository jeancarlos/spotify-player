import { describe, it, expect } from 'vitest'
import { calcArcPositions } from '@/utils/arcAngles'

describe('calcArcPositions', () => {
  it('retorna posições vazias para 0 items', () => {
    expect(calcArcPositions(0, 300, 160, 0)).toHaveLength(0)
  })

  it('item único fica no centro do arco', () => {
    const [pos] = calcArcPositions(1, 300, 160, 0)
    expect(pos.x).toBeCloseTo(0, 0)
    expect(pos.y).toBeLessThan(0) // acima do centro
  })

  it('dois items são simétricos', () => {
    const [a, b] = calcArcPositions(2, 300, 160, 0)
    expect(a.x).toBeCloseTo(-b.x, 1)
    expect(a.y).toBeCloseTo(b.y, 1)
  })

  it('offset desloca todas as posições angularmente', () => {
    const noOffset = calcArcPositions(3, 300, 160, 0)
    const withOffset = calcArcPositions(3, 300, 160, 20)
    expect(withOffset[0].x).not.toBeCloseTo(noOffset[0].x, 1)
  })
})
