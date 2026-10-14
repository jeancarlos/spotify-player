import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CustomTooltip } from '../ArtistChartTooltip'
import { toChartData, playEntry, chartLayout } from '../chartData'
import type { Track } from '@/types/music'

const track = (id: string, rank?: number) =>
  ({
    id,
    name: id,
    rank,
    artists: [{ id: 'a', name: 'A' }],
    album: { name: 'Al', images: [{ url: 'u' }] },
  }) as unknown as Track

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

describe('CustomTooltip', () => {
  it('shows the grouped rank with the Deezer rank caption', () => {
    const [entry] = toChartData([track('a', 1234567)])
    render(<CustomTooltip active payload={[{ payload: entry }] as never} />)
    expect(screen.getByText('artistDetail.deezerRank')).toBeInTheDocument()
    expect(screen.getByText((1234567).toLocaleString('pt-BR'))).toBeInTheDocument()
  })
})

describe('playEntry', () => {
  it('plays playable entries and ignores unplayable ones', () => {
    const onPlay = vi.fn()
    const [ok] = toChartData([track('a', 1)])
    const [dead] = toChartData([{ ...track('b', 1), is_playable: false }])
    playEntry(ok, onPlay)
    playEntry(dead, onPlay)
    expect(onPlay).toHaveBeenCalledTimes(1)
  })
})

describe('chartLayout', () => {
  it('leaves a usable plot width on a 375 px viewport', () => {
    expect(chartLayout(375).plotWidth).toBeGreaterThanOrEqual(150)
  })

  it('keeps the wide labels on desktop', () => {
    const wide = chartLayout(1024)
    expect(wide.yAxisWidth).toBe(144)
    expect(wide.labelChars).toBe(20)
    expect(wide.plotWidth).toBeGreaterThan(chartLayout(375).plotWidth)
  })
})
