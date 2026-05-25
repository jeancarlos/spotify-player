import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { SpotifyTrack } from '@/types/spotify'

vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: unknown) => value,
}))

vi.mock('@/hooks/useKeyboardNav', () => ({
  useKeyboardNav: () => () => {},
}))

const mockSearchResults: SpotifyTrack[] = [
  {
    id: 'r1',
    uri: 'spotify:track:r1',
    name: 'Resultado Um',
    duration_ms: 200000,
    explicit: false,
    popularity: 70,
    preview_url: null,
    type: 'track',
    artists: [{ id: 'a1', name: 'Artista A', uri: 'spotify:artist:a1', type: 'artist' }],
    album: {
      id: 'alb1',
      name: 'Álbum A',
      images: [{ url: 'https://img.test/1.jpg', width: 64, height: 64 }],
      release_date: '2024-01-01',
      album_type: 'album',
      artists: [],
      uri: 'spotify:album:alb1',
      type: 'album',
    },
  },
]

const mockUseSearchTracks = vi.fn()
vi.mock('@/hooks/queries/useSearchTracks', () => ({
  useSearchTracks: (query: string, enabled: boolean) => mockUseSearchTracks(query, enabled),
}))

import { TrackAutocomplete } from '@/components/favorites/TrackAutocomplete'

const onChange = vi.fn()
const onBlur = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  mockUseSearchTracks.mockReturnValue({ data: [], isPending: false })
})

describe('TrackAutocomplete', () => {
  it('renderiza o combobox com placeholder correto', () => {
    render(<TrackAutocomplete value={null} onChange={onChange} onBlur={onBlur} />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('não busca quando query tem menos de 2 caracteres', async () => {
    const user = userEvent.setup()
    render(<TrackAutocomplete value={null} onChange={onChange} onBlur={onBlur} />)
    await user.type(screen.getByRole('combobox'), 'a')
    expect(mockUseSearchTracks).toHaveBeenCalledWith('a', false)
  })

  it('busca quando query tem 2+ caracteres', async () => {
    const user = userEvent.setup()
    render(<TrackAutocomplete value={null} onChange={onChange} onBlur={onBlur} />)
    await user.type(screen.getByRole('combobox'), 'Mo')
    expect(mockUseSearchTracks).toHaveBeenCalledWith('Mo', true)
  })

  it('mostra resultados quando a busca retorna dados', async () => {
    mockUseSearchTracks.mockReturnValue({ data: mockSearchResults, isPending: false })
    const user = userEvent.setup()
    render(<TrackAutocomplete value={null} onChange={onChange} onBlur={onBlur} />)
    await user.type(screen.getByRole('combobox'), 'Re')
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument()
      expect(screen.getByText('Resultado Um')).toBeInTheDocument()
    })
  })

  it('clicar em um resultado chama onChange com a track', async () => {
    mockUseSearchTracks.mockReturnValue({ data: mockSearchResults, isPending: false })
    const user = userEvent.setup()
    render(<TrackAutocomplete value={null} onChange={onChange} onBlur={onBlur} />)
    await user.type(screen.getByRole('combobox'), 'Re')
    await waitFor(() => screen.getByText('Resultado Um'))
    await user.click(screen.getByText('Resultado Um'))
    expect(onChange).toHaveBeenCalledWith(mockSearchResults[0])
  })

  it('quando value está definido, renderiza SelectedTrack em vez do input', () => {
    render(
      <TrackAutocomplete value={mockSearchResults[0]} onChange={onChange} onBlur={onBlur} />
    )
    expect(screen.queryByRole('combobox')).toBeNull()
    expect(screen.getByText('Resultado Um')).toBeInTheDocument()
  })

  it('botão de limpar chama onChange(null)', async () => {
    const user = userEvent.setup()
    render(
      <TrackAutocomplete value={mockSearchResults[0]} onChange={onChange} onBlur={onBlur} />
    )
    await user.click(screen.getByRole('button', { name: /favorites\.clearTrack/i }))
    expect(onChange).toHaveBeenCalledWith(null)
  })
})
