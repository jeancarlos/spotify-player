import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LyricsView } from '../LyricsView'
import type { LyricLine } from '@/types/lyrics'

const manyLines: LyricLine[] = Array.from({ length: 20 }, (_, i) => ({
  time: i * 5000,
  text: `Linha ${i}`,
}))

const fewLines: LyricLine[] = [
  { time: 0, text: 'Primeira' },
  { time: 10000, text: 'Segunda' },
  { time: 20000, text: 'Terceira' },
]

describe('LyricsView', () => {
  it('shows empty state message when lines is empty', () => {
    render(<LyricsView lines={[]} progress={0} />)
    expect(screen.getByText('Sem letra disponível')).toBeInTheDocument()
  })

  it('active slot (slot 4) always has font-bold', () => {
    render(<LyricsView lines={manyLines} progress={0} />)
    expect(screen.getByText('Linha 0')).toHaveClass('font-bold')
  })

  it('highlights the correct line based on progress', () => {
    // progress=25000ms → activeIndex=5 (time: 5*5000=25000)
    render(<LyricsView lines={manyLines} progress={25000} />)
    expect(screen.getByText('Linha 5')).toHaveClass('font-bold')
  })

  it('does not render lines outside the 9-slot window', () => {
    // activeIndex=10 → window shows lines 6-14; line 0 not in DOM
    render(<LyricsView lines={manyLines} progress={50000} />)
    expect(screen.getByText('Linha 10')).toBeInTheDocument()
    expect(screen.queryByText('Linha 0')).not.toBeInTheDocument()
  })

  it('renders ghost slots when near the start', () => {
    // activeIndex=0 → slots 0-3 are ghost; lines 0-4 are in slots 4-8
    render(<LyricsView lines={fewLines} progress={0} />)
    expect(screen.getByText('Primeira')).toBeInTheDocument()
    // line beyond window should not appear
    expect(screen.queryByText('Linha 5')).not.toBeInTheDocument()
  })
})
