import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LyricsView } from '../LyricsView'

const lines = Array.from({ length: 20 }, (_, i) => `Linha ${i}`)

describe('LyricsView', () => {
  it('shows empty state message when lines is empty', () => {
    render(<LyricsView lines={[]} />)
    expect(screen.getByText('lyrics.noLyricsAvailable')).toBeInTheDocument()
  })

  it('renders every line as static text with no active line and no seek', () => {
    render(<LyricsView lines={lines} />)
    for (const line of lines) expect(screen.getByText(line)).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
    expect(document.querySelector('.font-bold')).toBeNull()
  })
})
