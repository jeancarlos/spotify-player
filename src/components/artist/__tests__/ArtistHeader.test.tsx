import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
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
    const fadeEnd = (Math.round(imgPx * 0.75) + 120) * 0.65
    await waitFor(() => {
      expect(Number(header.style.opacity)).toBeCloseTo(1 - 100 / fadeEnd, 3)
    })
  })
})
