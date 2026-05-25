import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { SpotifyTrack } from '@/types/spotify'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
      React.createElement('div', props, children),
    span: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) =>
      React.createElement('span', props, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/hooks/usePlayer', () => ({
  usePlayer: () => ({
    state: { currentTrack: null, isPlaying: false },
    dispatch: vi.fn(),
  }),
}))

vi.mock('@/hooks/usePlayTrack', () => ({
  usePlayTrack: () => vi.fn(),
}))

vi.mock('@/hooks/usePopoverDismiss', () => ({
  usePopoverDismiss: vi.fn(),
}))

vi.mock('@/components/favorites/AddFavoriteForm', () => ({
  AddFavoriteForm: ({
    onClose,
  }: {
    onClose: () => void
    existingFavorites: SpotifyTrack[]
    onAdd: (t: SpotifyTrack, n?: string) => void
  }) => (
    <div data-testid="add-favorite-form">
      <button type="button" onClick={onClose}>
        Fechar form
      </button>
    </div>
  ),
}))

const mockSpoterPlaylist = {
  tracks: [] as SpotifyTrack[],
  notes: {} as Record<string, string>,
  addTrack: vi.fn(),
  removeTrack: vi.fn(),
  refresh: vi.fn().mockResolvedValue(undefined),
  isRefreshing: false,
  isLoading: false,
  playlistId: 'pl-1',
  playlistName: "User's Spoter List",
}

vi.mock('@/hooks/useSpoterPlaylist', () => ({
  useSpoterPlaylist: () => mockSpoterPlaylist,
}))

import { Favorites } from '@/pages/Favorites'

const mockTrack = (id: string): SpotifyTrack => ({
  id,
  uri: `spotify:track:${id}`,
  name: `Track ${id}`,
  duration_ms: 180000,
  explicit: false,
  popularity: 50,
  preview_url: null,
  type: 'track',
  artists: [{ id: 'a1', name: 'Artista', uri: 'spotify:artist:a1', type: 'artist' }],
  album: {
    id: 'alb1',
    name: 'Álbum',
    images: [],
    release_date: '2024-01-01',
    album_type: 'album',
    artists: [],
    uri: 'spotify:album:alb1',
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
  mockSpoterPlaylist.tracks = []
  mockSpoterPlaylist.isLoading = false
  mockSpoterPlaylist.refresh = vi.fn().mockResolvedValue(undefined)
})

describe('Favorites', () => {
  it('mostra EmptyState quando tracks está vazio', () => {
    renderFavorites()
    expect(screen.getByText('favorites.emptyList')).toBeInTheDocument()
  })

  it('não mostra EmptyState quando há tracks', () => {
    mockSpoterPlaylist.tracks = [mockTrack('t1')]
    renderFavorites()
    expect(screen.queryByText('favorites.emptyList')).toBeNull()
  })

  it('renderiza uma linha por track', () => {
    mockSpoterPlaylist.tracks = [mockTrack('t1'), mockTrack('t2')]
    renderFavorites()
    expect(screen.getByText('Track t1')).toBeInTheDocument()
    expect(screen.getByText('Track t2')).toBeInTheDocument()
  })

  it('mostra skeleton quando isLoading é true', () => {
    mockSpoterPlaylist.isLoading = true
    renderFavorites()
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
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
