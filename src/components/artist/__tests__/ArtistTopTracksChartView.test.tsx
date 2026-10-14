import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { cloneElement, type ReactElement, type ReactNode } from 'react'
import { ArtistTopTracksChart } from '../ArtistTopTracksChart'
import type { Track } from '@/types/music'

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CartesianGrid: () => null,
  XAxis: () => null,
  Tooltip: () => null,
  Cell: () => null,
  YAxis: ({ tick }: { tick: ReactElement<Record<string, unknown>> }) => (
    <svg data-testid="ticks">
      {cloneElement(tick, { x: 1, y: 2, index: 0, payload: { value: 'A very long track name here' } })}
      {cloneElement(tick, { payload: { value: 'Short' } })}
      {cloneElement(tick, {})}
    </svg>
  ),
  LabelList: ({ formatter }: { formatter: (n: number) => string }) => (
    <span data-testid="label">{formatter(1234567)}</span>
  ),
  Bar: ({
    shape,
    onClick,
    children,
  }: {
    shape: ReactElement<Record<string, unknown>>
    onClick: (e: unknown) => void
    children: ReactNode
  }) => (
    <div>
      <svg data-testid="shapes">
        {cloneElement(shape, { x: 0, y: 0, width: 1, height: 10, fill: 'red' })}
        {cloneElement(shape, { width: 50, height: 4, fill: 'red', cursor: 'pointer' })}
        {cloneElement(shape, {})}
      </svg>
      <button data-testid="bar" onClick={() => { onClick({ track: bars.track, id: 'x' }) }} />
      {children}
    </div>
  ),
}))

const bars: { track?: unknown } = {}

const mk = (id: string, rank: number, playable = true) =>
  ({
    id,
    name: `Name ${id}`,
    rank,
    is_playable: playable,
    artists: [{ id: 'a', name: 'A' }],
    album: { name: 'Al', images: [] },
  }) as unknown as Track

describe('ArtistTopTracksChart', () => {
  it('renders nothing without ranked tracks', () => {
    const { container } = render(<ArtistTopTracksChart tracks={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('draws ticks, shapes and plays via bar and fallback buttons', () => {
    const onPlay = vi.fn()
    const ok = mk('a', 10)
    bars.track = ok
    render(<ArtistTopTracksChart tracks={[ok, mk('b', 5, false)]} activeTrackId="a" onPlay={onPlay} />)
    expect(screen.getByTestId('ticks').querySelectorAll('text').length).toBeGreaterThan(3)
    expect(screen.getByTestId('shapes').querySelectorAll('rect,path')).toHaveLength(3)
    expect(screen.getByTestId('label')).toHaveTextContent((1234567).toLocaleString('pt-BR'))
    fireEvent.click(screen.getByTestId('bar'))
    expect(onPlay).toHaveBeenCalledTimes(1)
    const buttons = screen.getAllByRole('button', { hidden: true }).filter((b) => b.hasAttribute('type'))
    expect(buttons).toHaveLength(2)
    expect(buttons[1]).toBeDisabled()
    fireEvent.click(buttons[0])
    expect(onPlay).toHaveBeenCalledTimes(2)
  })
})
