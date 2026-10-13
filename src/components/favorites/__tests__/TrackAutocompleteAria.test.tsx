import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { SpotifyTrack } from '@/types/spotify'

vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: unknown) => value,
}))

const results = [
  {
    id: 'r1',
    name: 'Resultado Um',
    artists: [{ id: 'a1', name: 'Artista A' }],
    album: { id: 'alb1', name: 'Album A', images: [{ url: 'https://img.test/1.jpg' }] },
  },
] as unknown as SpotifyTrack[]

vi.mock('@/hooks/queries/useSearchTracks', () => ({
  useSearchTracks: () => ({ data: results, isPending: false }),
}))

import { TrackAutocomplete } from '@/components/favorites/TrackAutocomplete'

describe('TrackAutocomplete aria-activedescendant with the real keyboard hook', () => {
  it('points at the highlighted option while open and is removed once the list closes', async () => {
    const user = userEvent.setup()
    render(<TrackAutocomplete value={null} onChange={vi.fn()} onBlur={vi.fn()} />)
    const input = screen.getByRole('combobox')
    await user.type(input, 'Re')
    expect(input).not.toHaveAttribute('aria-activedescendant')

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    const option = screen.getByRole('option')
    expect(input).toHaveAttribute('aria-activedescendant', option.id)

    fireEvent.blur(input)
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).toBeNull()
    })
    expect(input).not.toHaveAttribute('aria-activedescendant')
  })

  it('is labelled by the id it receives', () => {
    render(
      <>
        <label htmlFor="favorite-track">Faixa</label>
        <TrackAutocomplete id="favorite-track" value={null} onChange={vi.fn()} onBlur={vi.fn()} />
      </>
    )
    expect(screen.getByLabelText('Faixa')).toBe(screen.getByRole('combobox'))
  })
})
