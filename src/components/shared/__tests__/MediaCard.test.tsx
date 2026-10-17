import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MediaCard } from '../MediaCard'

const images = [{ url: 'https://img.test/c.jpg', width: 300, height: 300 }]

describe('MediaCard', () => {
  it('renders title, subtitle and image', () => {
    const { container } = render(
      <MediaCard
        images={images}
        title="T"
        subtitle="S"
        onClick={vi.fn()}
        imageClassName="x"
        className="y"
      />
    )
    expect(container.querySelector('img')).toHaveClass('x')
    expect(screen.getByText('S')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^T/ })).toHaveClass('y')
  })

  it('falls back to a placeholder with no subtitle and a custom label', () => {
    render(<MediaCard title="T" onClick={vi.fn()} ariaLabel="Custom" />)
    expect(screen.getByText('♪')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Custom' })).toBeInTheDocument()
  })

  it('activates on click, Enter and Space only', () => {
    const onClick = vi.fn()
    render(<MediaCard title="T" onClick={onClick} />)
    const card = screen.getByRole('button')
    fireEvent.click(card)
    fireEvent.keyDown(card, { key: 'Enter' })
    fireEvent.keyDown(card, { key: ' ' })
    fireEvent.keyDown(card, { key: 'a' })
    expect(onClick).toHaveBeenCalledTimes(3)
  })
})
