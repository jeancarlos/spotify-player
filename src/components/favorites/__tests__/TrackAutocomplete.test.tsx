import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Track } from '@/types/music'

vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: unknown) => value,
}))

vi.mock('@/hooks/useKeyboardNav', () => ({
  useKeyboardNav: () => () => {
    /* noop */
  },
}))

const mockSearchResults: Track[] = [
  {
    id: 'r1',
    uri: 'deezer:track:r1',
    name: 'Resultado Um',
    duration_ms: 200000,
    explicit: false,
    rank: 70,
    preview_url: null,
    type: 'track',
    artists: [{ id: 'a1', name: 'Artista A', uri: 'deezer:artist:a1', type: 'artist' }],
    album: {
      id: 'alb1',
      name: 'Álbum A',
      images: [{ url: 'https://img.test/1.jpg', width: 64, height: 64 }],
      release_date: '2024-01-01',
      album_type: 'album',
      artists: [],
      uri: 'deezer:album:alb1',
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

const renderEmpty = () =>
  render(<TrackAutocomplete value={null} onChange={onChange} onBlur={onBlur} />)
const renderSelected = () =>
  render(<TrackAutocomplete value={mockSearchResults[0]} onChange={onChange} onBlur={onBlur} />)
const clearButton = () => screen.getByRole('button', { name: /favorites\.clearTrack/i })

async function typeWithResults(text = 'Re') {
  mockUseSearchTracks.mockReturnValue({ data: mockSearchResults, isPending: false })
  const user = userEvent.setup()
  renderEmpty()
  const input = screen.getByRole('combobox')
  await user.type(input, text)
  return { user, input }
}

describe('TrackAutocomplete', () => {
  it('renderiza o combobox com placeholder correto', () => {
    renderEmpty()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('não busca quando query tem menos de 2 caracteres', async () => {
    const user = userEvent.setup()
    renderEmpty()
    await user.type(screen.getByRole('combobox'), 'a')
    expect(mockUseSearchTracks).toHaveBeenCalledWith('a', false)
  })

  it('busca quando query tem 2+ caracteres', async () => {
    const user = userEvent.setup()
    renderEmpty()
    await user.type(screen.getByRole('combobox'), 'Mo')
    expect(mockUseSearchTracks).toHaveBeenCalledWith('Mo', true)
  })

  it('mostra resultados quando a busca retorna dados', async () => {
    await typeWithResults()
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument()
      expect(screen.getByText('Resultado Um')).toBeInTheDocument()
    })
  })

  it('clicar em um resultado chama onChange com a track', async () => {
    const { user } = await typeWithResults()
    await waitFor(() => screen.getByText('Resultado Um'))
    await user.click(screen.getByText('Resultado Um'))
    expect(onChange).toHaveBeenCalledWith(mockSearchResults[0])
  })

  it('quando value está definido, renderiza SelectedTrack em vez do input', () => {
    renderSelected()
    expect(screen.queryByRole('combobox')).toBeNull()
    expect(screen.getByText('Resultado Um')).toBeInTheDocument()
  })

  it('botão de limpar chama onChange(null)', async () => {
    const user = userEvent.setup()
    renderSelected()
    await user.click(clearButton())
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('seleciona no mouseDown sem esperar o timer de blur', () => {
    vi.useFakeTimers()
    try {
      mockUseSearchTracks.mockReturnValue({ data: mockSearchResults, isPending: false })
      renderEmpty()
      const input = screen.getByRole('combobox')
      fireEvent.change(input, { target: { value: 'Re' } })
      expect(screen.getByText('Resultado Um')).toBeInTheDocument()
      fireEvent.blur(input)
      act(() => {
        vi.advanceTimersByTime(1000)
      })
      expect(screen.queryByText('Resultado Um')).toBeNull()
      fireEvent.focus(input)
      fireEvent.mouseDown(screen.getByText('Resultado Um'))
      expect(onChange).toHaveBeenCalledWith(mockSearchResults[0])
    } finally {
      vi.useRealTimers()
    }
  })

  it('mouseDown na opcao evita o blur do input', async () => {
    await typeWithResults()
    await waitFor(() => screen.getByText('Resultado Um'))
    const notPrevented = fireEvent.mouseDown(screen.getByText('Resultado Um'))
    expect(notPrevented).toBe(false)
  })

  it('reabre a lista ao focar quando ha resultados', async () => {
    const { input } = await typeWithResults()
    fireEvent.keyDown(input, { key: 'Escape' })
    act(() => {
      input.blur()
    })
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).toBeNull()
    })
    act(() => {
      input.focus()
    })
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('aria-activedescendant so existe com a lista renderizada', async () => {
    const { input } = await typeWithResults()
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(input).not.toHaveAttribute('aria-activedescendant')
  })

  it('mostra o estado de carregamento e o erro', async () => {
    const user = userEvent.setup()
    mockUseSearchTracks.mockReturnValue({ data: [], isPending: true })
    render(<TrackAutocomplete value={null} onChange={onChange} onBlur={onBlur} error="bad" />)
    await user.type(screen.getByRole('combobox'), 'ab')
    expect(screen.getByText('common.loading')).toBeInTheDocument()
    expect(screen.getByText('bad')).toBeInTheDocument()
  })

  it('devolve o foco ao input depois de limpar', async () => {
    const { rerender } = render(
      <TrackAutocomplete value={mockSearchResults[0]} onChange={onChange} onBlur={onBlur} />
    )
    fireEvent.click(clearButton())
    rerender(<TrackAutocomplete value={null} onChange={onChange} onBlur={onBlur} />)
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10))
    })
    expect(screen.getByRole('combobox')).toHaveFocus()
  })

  it('ignora o foco quando o input ainda nao existe', async () => {
    renderSelected()
    fireEvent.click(clearButton())
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10))
    })
    expect(onChange).toHaveBeenCalledWith(null)
  })
})
