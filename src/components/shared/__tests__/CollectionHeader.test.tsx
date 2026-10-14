import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
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
})
