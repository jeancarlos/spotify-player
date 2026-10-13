import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ArcTextOverlay } from '../ArcTextOverlay'

function arcPath(arcDeg?: number) {
  const { container } = render(<ArcTextOverlay label="x" diskPx={200} arcDeg={arcDeg} />)
  const d = container.querySelector('path')?.getAttribute('d') ?? ''
  const [, x1, y1, rx, ry, rot, large, sweep, x2, y2] = d.split(/[ MA]+/).map(Number)
  return { x1, y1, rx, ry, rot, large, sweep, x2, y2 }
}

describe('ArcTextOverlay arc path', () => {
  const r = 100 * 0.93 + 10
  const c = 100

  it('uses real degrees and the large-arc flag for a 200 degree arc', () => {
    const p = arcPath()
    expect(p.rx).toBeCloseTo(r, 5)
    expect(p.large).toBe(1)
    expect(p.sweep).toBe(1)
    const a1 = (170 * Math.PI) / 180
    const a2 = (370 * Math.PI) / 180
    expect(p.x1).toBeCloseTo(c + r * Math.cos(a1), 5)
    expect(p.y1).toBeCloseTo(c + r * Math.sin(a1), 5)
    expect(p.x2).toBeCloseTo(c + r * Math.cos(a2), 5)
    expect(p.y2).toBeCloseTo(c + r * Math.sin(a2), 5)
  })

  it('keeps the large-arc flag off for an arc of 180 degrees or less', () => {
    expect(arcPath(180).large).toBe(0)
    expect(arcPath(120).large).toBe(0)
  })
})
