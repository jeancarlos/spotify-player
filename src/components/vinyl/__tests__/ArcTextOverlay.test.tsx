import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ArcTextOverlay } from '../ArcTextOverlay'

function arcPath(diskPx: number, arcDeg?: number) {
  const { container } = render(<ArcTextOverlay label="x" diskPx={diskPx} arcDeg={arcDeg} />)
  const d = container.querySelector('path')?.getAttribute('d') ?? ''
  const [, x1, y1, rx, ry, rot, large, sweep, x2, y2] = d.split(/[ MA]+/).map(Number)
  return { x1, y1, rx, ry, rot, large, sweep, x2, y2 }
}

const point = (diskPx: number, deg: number) => {
  const c = diskPx / 2
  const r = c * 0.93 + 10
  const a = (deg * Math.PI) / 180
  return { r, x: c + r * Math.cos(a), y: c + r * Math.sin(a) }
}

describe('ArcTextOverlay arc path', () => {
  it('uses real degrees and the large-arc flag for a 200 degree arc', () => {
    const p = arcPath(720)
    const start = point(720, 170)
    const end = point(720, 370)
    expect(p.rx).toBeCloseTo(start.r, 5)
    expect(p.large).toBe(1)
    expect(p.sweep).toBe(1)
    expect(p.x1).toBeCloseTo(start.x, 5)
    expect(p.y1).toBeCloseTo(start.y, 5)
    expect(p.x2).toBeCloseTo(end.x, 5)
    expect(p.y2).toBeCloseTo(end.y, 5)
  })

  it('keeps the large-arc flag off for an arc of 180 degrees or less', () => {
    expect(arcPath(720, 180).large).toBe(0)
    expect(arcPath(720, 120).large).toBe(0)
  })

  it('caps the arc at 180 degrees on a disc narrower than 640 px', () => {
    const p = arcPath(400)
    expect(p.large).toBe(0)
    expect(p.x1).toBeCloseTo(point(400, 180).x, 5)
    expect(p.y1).toBeCloseTo(point(400, 180).y, 5)
    expect(p.x2).toBeCloseTo(point(400, 360).x, 5)
    expect(p.y2).toBeCloseTo(point(400, 360).y, 5)
  })
})
