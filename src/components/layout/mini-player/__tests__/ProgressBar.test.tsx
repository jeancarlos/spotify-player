import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProgressBar } from '../ProgressBar'

const seek = vi.fn()
let duration = 30000

vi.mock('@/contexts/PlayerContext', () => ({
  usePlayer: () => ({ controls: { seek } }),
  useProgress: () => ({ progressMs: 12000, durationMs: duration }),
}))

describe('ProgressBar', () => {
  it('renders progress and duration from useProgress', () => {
    render(<ProgressBar />)
    const slider = screen.getByRole('slider')
    expect(slider).toHaveValue('12000')
    expect(slider).toHaveAttribute('max', '30000')
  })

  it('draws a thin track on a touch-sized slider', () => {
    render(<ProgressBar />)
    const slider = screen.getByRole('slider')
    expect(slider).toHaveClass('h-4')
    expect(slider.style.background).toContain('1px')
  })

  it('seeks once per change with the slider value', () => {
    render(<ProgressBar />)
    fireEvent.change(screen.getByRole('slider'), { target: { value: '21000' } })
    expect(seek).toHaveBeenCalledTimes(1)
    expect(seek).toHaveBeenCalledWith(21000)
  })

  it('shows an empty bar when the duration is unknown', () => {
    duration = 0
    render(<ProgressBar />)
    const slider = screen.getByRole('slider')
    expect(slider).toHaveAttribute('max', '1')
    expect(slider.style.background).toContain('0%')
    duration = 30000
  })
})
