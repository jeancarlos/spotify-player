import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CollectionHeader } from '../CollectionHeader'

describe('CollectionHeader', () => {
  it('starts the cover below the top bar instead of cropping it', () => {
    const { container } = render(
      <CollectionHeader
        images={[]}
        name="Album"
        subtitle="Artist"
        playLabel="Play"
        onPlay={vi.fn()}
        onLayout={vi.fn()}
      />
    )
    const cover = container.querySelector<HTMLElement>('.left-1\\/2')!
    expect(cover.style.top).toBe('64px')
    expect(cover.style.transform).not.toContain('translateY')
  })

  const images = [{ url: 'https://img.test/c.jpg', width: 300, height: 300 }]

  it('renders artist links, year, link and wires the callbacks', () => {
    const onPlay = vi.fn()
    const onLayout = vi.fn()
    const onArtistClick = vi.fn()
    const { container } = render(
      <CollectionHeader
        images={images}
        name="Album"
        subtitle="Artist"
        artists={[
          { id: 'a1', name: 'One' },
          { id: 'a2', name: 'Two' },
        ]}
        year="2024"
        playLabel="Play"
        onPlay={onPlay}
        onLayout={onLayout}
        onArtistClick={onArtistClick}
        link="https://deezer.test/x"
      />
    )
    expect(container.querySelector('img[aria-hidden="true"]')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Two' }))
    expect(onArtistClick).toHaveBeenCalledWith('a2')
    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    expect(onPlay).toHaveBeenCalledTimes(1)
    expect(onLayout).toHaveBeenCalledTimes(1)
    expect(screen.getByText(/· 2024/)).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://deezer.test/x')
  })

  it('falls back to the subtitle without artist links', () => {
    render(
      <CollectionHeader
        images={[]}
        name="Album"
        subtitle="Artist"
        playLabel="Play"
        onPlay={vi.fn()}
        onLayout={vi.fn()}
        artists={[{ id: 'a', name: 'X' }]}
      />
    )
    expect(screen.getByText('Artist')).toBeInTheDocument()
  })

  it('reports the layout once while the height is unchanged', () => {
    const onLayout = vi.fn()
    const props = { images: [], name: 'A', subtitle: 'S', playLabel: 'P', onPlay: vi.fn() }
    const { rerender } = render(<CollectionHeader {...props} onLayout={onLayout} />)
    const next = vi.fn()
    rerender(<CollectionHeader {...props} onLayout={next} />)
    expect(onLayout).toHaveBeenCalledTimes(1)
    expect(next).not.toHaveBeenCalled()
  })
})
