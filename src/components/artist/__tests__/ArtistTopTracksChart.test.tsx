import { describe, it, expect } from 'vitest'
import { toChartData } from '../chartData'
import type { SpotifyTrack } from '@/types/spotify'

const track = (id: string, rank?: number) =>
  ({
    id,
    name: id,
    rank,
    artists: [{ id: 'a', name: 'A' }],
    album: { name: 'Al', images: [{ url: 'u' }] },
  }) as unknown as SpotifyTrack

describe('toChartData', () => {
  it('sorts by Deezer rank descending and keeps real values', () => {
    const out = toChartData([track('a', 10), track('b', 900), track('c', 500)])
    expect(out.map((e) => [e.id, e.rank])).toEqual([
      ['b', 900],
      ['c', 500],
      ['a', 10],
    ])
  })

  it('drops tracks without a rank and caps at ten after sorting', () => {
    const many = Array.from({ length: 12 }, (_, i) => track(`t${i}`, i + 1))
    const out = toChartData([...many, track('none')])
    expect(out).toHaveLength(10)
    expect(out[0].id).toBe('t11')
    expect(out.some((e) => e.id === 'none')).toBe(false)
  })
})
