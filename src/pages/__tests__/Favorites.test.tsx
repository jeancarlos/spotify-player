import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { Track } from '@/types/music'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
      React.createElement('div', props, children),
    span: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) =>
      React.createElement('span', props, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const playTrackMock = vi.fn()
vi.mock('@/contexts/PlayerContext', () => ({
  usePlayer: () => ({
    state: { currentTrack: null, isPlaying: false },
    controls: { playTrack: playTrackMock },
  }),
}))

vi.mock('@/hooks/usePopoverDismiss', () => ({
  usePopoverDismiss: vi.fn(),
}))

vi.mock('@/components/favorites/AddFavoriteForm', () => ({
  AddFavoriteForm: ({
    onClose,
  }: {
    onClose: () => void
    existingFavorites: Track[]
    onAdd: (t: Track, n?: string) => boolean
  }) => (
    <div data-testid="add-favorite-form">
      <button type="button" onClick={onClose}>
        Fechar form
      </button>
    </div>
  ),
}))

const mockToast = vi.fn()
vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

const mockFavorites = {
  tracks: [] as Track[],
  notes: {} as Record<string, string>,
  addTrack: vi.fn(),
  removeTrack: vi.fn(),
  setNote: vi.fn(),
  playlistName: 'Vinyla List',
}

vi.mock('@/hooks/useFavorites', () => ({
  useFavorites: () => mockFavorites,
}))

let mockUnavailable = false
vi.mock('@/hooks/useCatalogHealth', () => ({
  useCatalogHealth: () => ({ unavailable: mockUnavailable }),
}))
import { Favorites } from '@/pages/Favorites'

const mockTrack = (id: string): Track => ({
  id,
  uri: `deezer:track:${id}`,
  name: `Track ${id}`,
  duration_ms: 180000,
  explicit: false,
  rank: 50,
  preview_url: null,
  type: 'track',
  artists: [{ id: 'a1', name: 'Artista', uri: 'deezer:artist:a1', type: 'artist' }],
  album: {
    id: 'alb1',
    name: 'Álbum',
    images: [],
    release_date: '2024-01-01',
    album_type: 'album',
    artists: [],
    uri: 'deezer:album:alb1',
    type: 'album',
  },
})

function renderFavorites() {
  return render(
    <MemoryRouter>
      <Favorites />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUnavailable = false
  mockFavorites.tracks = []
})

describe('Favorites', () => {
  it('disables play while the catalog is unavailable but keeps the rows', () => {
    mockFavorites.tracks = [mockTrack('t1')]
    renderFavorites()
    expect(screen.getByRole('button', { name: /player\.playTrack/ })).toBeEnabled()
    cleanup()
    mockUnavailable = true
    renderFavorites()
    expect(screen.getByText('Track t1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /player\.playTrack/ })).toBeDisabled()
  })

  it('mostra EmptyState quando tracks está vazio', () => {
    renderFavorites()
    expect(screen.getByText('favorites.emptyList')).toBeInTheDocument()
  })

  it('não mostra EmptyState quando há tracks', () => {
    mockFavorites.tracks = [mockTrack('t1')]
    renderFavorites()
    expect(screen.queryByText('favorites.emptyList')).toBeNull()
  })

  it('renderiza uma linha por track', () => {
    mockFavorites.tracks = [mockTrack('t1'), mockTrack('t2')]
    renderFavorites()
    expect(screen.getByText('Track t1')).toBeInTheDocument()
    expect(screen.getByText('Track t2')).toBeInTheDocument()
  })

  it('remover mostra toast de erro quando o storage falha', async () => {
    const user = userEvent.setup()
    mockFavorites.tracks = [mockTrack('t1'), mockTrack('t2')]
    mockFavorites.removeTrack.mockReturnValue(false)
    renderFavorites()
    await user.click(screen.getAllByRole('button', { name: /favorites\.removeConfirm/i })[0])
    expect(mockFavorites.removeTrack).toHaveBeenCalledWith('deezer:track:t1')
    expect(mockToast).toHaveBeenCalledWith('favorites.saveFailed', 'error')
  })

  it('edits the note of an existing favorite', async () => {
    const user = userEvent.setup()
    mockFavorites.tracks = [mockTrack('t1')]
    mockFavorites.notes = { 'deezer:track:t1': 'old' }
    mockFavorites.setNote.mockReturnValue(true)
    renderFavorites()
    await user.click(screen.getByRole('button', { name: /favorites\.editNote/i }))
    const input = screen.getByRole('textbox', { name: 'favorites.noteLabel' })
    expect(input).toHaveValue('old')
    expect(input).toHaveFocus()
    await user.clear(input)
    await user.type(input, ' new note {Enter}')
    expect(mockFavorites.setNote).toHaveBeenCalledWith('deezer:track:t1', 'new note')
    expect(screen.queryByRole('textbox', { name: 'favorites.noteLabel' })).toBeNull()
    mockFavorites.notes = {}
  })

  it('Escape closes the note editor without saving', async () => {
    const user = userEvent.setup()
    mockFavorites.tracks = [mockTrack('t1')]
    renderFavorites()
    await user.click(screen.getByRole('button', { name: /favorites\.editNote/i }))
    await user.type(screen.getByRole('textbox', { name: 'favorites.noteLabel' }), 'x{Escape}')
    expect(mockFavorites.setNote).not.toHaveBeenCalled()
    expect(screen.queryByRole('textbox', { name: 'favorites.noteLabel' })).toBeNull()
  })

  it('permite remover o último favorito', async () => {
    const user = userEvent.setup()
    mockFavorites.tracks = [mockTrack('t1')]
    mockFavorites.removeTrack.mockReturnValue(true)
    renderFavorites()
    await user.click(screen.getByRole('button', { name: /favorites\.removeConfirm/i }))
    expect(mockFavorites.removeTrack).toHaveBeenCalledWith('deezer:track:t1')
    expect(mockToast).not.toHaveBeenCalled()
  })

  it('botão de adicionar abre o popover', async () => {
    const user = userEvent.setup()
    renderFavorites()
    const addBtn = screen.getByRole('button', { name: /favorites\.addButton/i })
    expect(addBtn).toHaveAttribute('aria-expanded', 'false')
    await user.click(addBtn)
    await waitFor(() => {
      expect(screen.getByTestId('add-favorite-form')).toBeInTheDocument()
    })
  })

  it('clicar no botão aberto fecha o popover', async () => {
    const user = userEvent.setup()
    renderFavorites()
    const addBtn = screen.getByRole('button', { name: /favorites\.addButton/i })
    await user.click(addBtn)
    await waitFor(() => screen.getByTestId('add-favorite-form'))
    // Button now shows 'favorites.close'
    const closeBtn = screen.getByRole('button', { name: /favorites\.close/i })
    await user.click(closeBtn)
    await waitFor(() => {
      expect(screen.queryByTestId('add-favorite-form')).toBeNull()
    })
  })
})
