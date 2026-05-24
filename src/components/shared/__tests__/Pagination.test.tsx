import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Pagination } from '../Pagination'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('Pagination', () => {
  it('renders correctly with current page', () => {
    render(<Pagination page={2} hasNext={true} onPrev={vi.fn()} onNext={vi.fn()} />)
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('artists.previous')).toBeInTheDocument()
    expect(screen.getByText('artists.next')).toBeInTheDocument()
  })

  it('disables previous button on page 1', () => {
    const onPrev = vi.fn()
    render(<Pagination page={1} hasNext={true} onPrev={onPrev} onNext={vi.fn()} />)
    const prevButton = screen.getByText('artists.previous').closest('button')
    expect(prevButton).toBeDisabled()
    
    if (prevButton) fireEvent.click(prevButton)
    expect(onPrev).not.toHaveBeenCalled()
  })

  it('enables previous button when page > 1', () => {
    const onPrev = vi.fn()
    render(<Pagination page={2} hasNext={true} onPrev={onPrev} onNext={vi.fn()} />)
    const prevButton = screen.getByText('artists.previous').closest('button')
    expect(prevButton).not.toBeDisabled()
    
    if (prevButton) fireEvent.click(prevButton)
    expect(onPrev).toHaveBeenCalled()
  })

  it('disables next button when hasNext is false', () => {
    const onNext = vi.fn()
    render(<Pagination page={2} hasNext={false} onPrev={vi.fn()} onNext={onNext} />)
    const nextButton = screen.getByText('artists.next').closest('button')
    expect(nextButton).toBeDisabled()
    
    if (nextButton) fireEvent.click(nextButton)
    expect(onNext).not.toHaveBeenCalled()
  })

  it('enables next button when hasNext is true', () => {
    const onNext = vi.fn()
    render(<Pagination page={2} hasNext={true} onPrev={vi.fn()} onNext={onNext} />)
    const nextButton = screen.getByText('artists.next').closest('button')
    expect(nextButton).not.toBeDisabled()
    
    if (nextButton) fireEvent.click(nextButton)
    expect(onNext).toHaveBeenCalled()
  })
})
