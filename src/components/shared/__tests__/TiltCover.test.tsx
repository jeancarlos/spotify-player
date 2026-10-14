import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TiltCover } from '../TiltCover'

const images = [{ url: 'https://img.test/c.jpg', width: 300, height: 300 }]

describe('TiltCover', () => {
  it('renders the cover image with its name', () => {
    render(<TiltCover images={images} size={200} name="Cover" />)
    expect(screen.getByAltText('Cover')).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('renders an empty alt and a placeholder without images', () => {
    render(<TiltCover size={200} />)
    expect(screen.getByText('♪')).toBeInTheDocument()
    render(<TiltCover images={images} size={100} />)
    expect(document.querySelector('img')).toHaveAttribute('alt', '')
  })

  it('renders children and class name', () => {
    const { container } = render(
      <TiltCover size={100} className="extra">
        <i data-testid="kid" />
      </TiltCover>
    )
    expect(screen.getByTestId('kid')).toBeInTheDocument()
    expect(container.firstChild).toHaveClass('extra')
  })

  it('reacts to hover, move and leave', () => {
    render(<TiltCover size={100} onClick={vi.fn()} />)
    const card = screen.getByRole('button')
    fireEvent.mouseEnter(card)
    fireEvent.mouseMove(card, { clientX: 10, clientY: 10 })
    fireEvent.mouseLeave(card)
  })

  it('ignores mouse move when the card has no rect', () => {
    render(<TiltCover size={100} onClick={vi.fn()} />)
    const card = screen.getByRole('button')
    vi.spyOn(card, 'getBoundingClientRect').mockReturnValue(undefined as unknown as DOMRect)
    fireEvent.mouseMove(card, { clientX: 10, clientY: 10 })
  })

  it('clicks and handles keys only when clickable', () => {
    const onClick = vi.fn()
    render(<TiltCover size={100} onClick={onClick} />)
    const card = screen.getByRole('button')
    fireEvent.click(card)
    fireEvent.keyDown(card, { key: 'Enter' })
    fireEvent.keyDown(card, { key: ' ' })
    fireEvent.keyDown(card, { key: 'a' })
    expect(onClick).toHaveBeenCalledTimes(3)
  })
})
