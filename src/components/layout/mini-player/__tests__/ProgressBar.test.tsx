import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProgressBar } from '../ProgressBar'

const seek = vi.fn()

vi.mock('@/contexts/PlayerContext', () => ({
  usePlayer: () => ({ controls: { seek } }),
  useProgress: () => ({ progressMs: 12000, durationMs: 30000 }),
}))

describe('ProgressBar', () => {
  it('renders progress and duration from useProgress', () => {
    render(<ProgressBar />)
    const slider = screen.getByRole('slider')
    expect(slider).toHaveValue('12000')
    expect(slider).toHaveAttribute('max', '30000')
  })

  it('seeks once per change with the slider value', () => {
    render(<ProgressBar />)
    fireEvent.change(screen.getByRole('slider'), { target: { value: '21000' } })
    expect(seek).toHaveBeenCalledTimes(1)
    expect(seek).toHaveBeenCalledWith(21000)
  })
})
