import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ArtistHeader } from '../ArtistHeader'

describe('ArtistHeader', () => {
  afterEach(() => {
    document.getElementById('main-content')?.remove()
  })

  it('applies the opacity for the starting scroll position without a scroll event', async () => {
    const main = document.createElement('div')
    main.id = 'main-content'
    document.body.appendChild(main)
    main.scrollTop = 100
    const { container } = render(<ArtistHeader images={[]} name="A" onLayout={vi.fn()} />)
    const header = container.firstElementChild as HTMLElement
    const imgPx = Math.min(280, Math.round(window.innerWidth * 0.65))
    const fadeEnd = (Math.round(imgPx * 0.75) + 120 + 80) * 0.65
    await waitFor(() => {
      expect(Number(header.style.opacity)).toBeCloseTo(1 - 100 / fadeEnd, 3)
    })
  })

  it('does not call onLayout again when only the callback identity changes', () => {
    const first = vi.fn()
    const { rerender } = render(<ArtistHeader images={[]} name="A" onLayout={first} />)
    const second = vi.fn()
    rerender(<ArtistHeader images={[]} name="A" onLayout={second} />)
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).not.toHaveBeenCalled()
  })

  it('starts the cover below the top bar and the content below the cover', () => {
    const onLayout = vi.fn()
    const { container } = render(<ArtistHeader images={[]} name="A" onLayout={onLayout} />)
    const imgPx = Math.min(280, Math.round(window.innerWidth * 0.65))
    const cover = container.querySelector<HTMLElement>('.left-1\\/2')!
    expect(cover.style.top).toBe('64px')
    expect(cover.style.transform).not.toContain('translateY')
    expect(onLayout.mock.calls[0][0]).toBeGreaterThan(64 + imgPx)
  })

  it('renders cover, backdrop, subtitle and link, and tracks scroll', () => {
    const main = document.createElement('div')
    main.id = 'main-content'
    document.body.appendChild(main)
    const onLayout = vi.fn()
    const images = [{ url: 'u', width: 300, height: 300 }]
    const { container, rerender, unmount } = render(
      <ArtistHeader images={images} name="Nm" subtitle="Sub" link="http://d" onLayout={onLayout} />
    )
    expect(screen.getByText('Sub')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', 'http://d')
    expect(container.querySelectorAll('img').length).toBeGreaterThanOrEqual(2)
    main.scrollTop = 50
    main.dispatchEvent(new Event('scroll'))
    rerender(
      <ArtistHeader images={images} name="Nm" subtitle="Sub" link="http://d" onLayout={onLayout} />
    )
    expect(onLayout).toHaveBeenCalledTimes(1)
    unmount()
  })
})
