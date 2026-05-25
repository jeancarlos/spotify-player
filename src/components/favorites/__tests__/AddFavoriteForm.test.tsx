import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { SpotifyTrack } from '@/types/spotify'

const mockTrack: SpotifyTrack = {
  id: 't1',
  uri: 'spotify:track:t1',
  name: 'Test Track',
  duration_ms: 180000,
  explicit: false,
  popularity: 80,
  preview_url: null,
  type: 'track',
  artists: [{ id: 'a1', name: 'Test Artist', uri: 'spotify:artist:a1', type: 'artist' }],
  album: {
    id: 'alb1',
    name: 'Test Album',
    images: [{ url: 'https://img.test/1.jpg', width: 300, height: 300 }],
    release_date: '2024-01-01',
    album_type: 'album',
    artists: [],
    uri: 'spotify:album:alb1',
    type: 'album',
  },
}

// Stub TrackAutocomplete: renders a button that, when clicked, calls onChange(mockTrack)
vi.mock('@/components/favorites/TrackAutocomplete', () => ({
  TrackAutocomplete: ({
    onChange,
    value,
  }: {
    onChange: (t: SpotifyTrack | null) => void
    value: SpotifyTrack | null
    onBlur: () => void
    error?: string
  }) =>
    value ? (
      <div data-testid="selected-track">{value.name}</div>
    ) : (
      <button type="button" onClick={() => { onChange(mockTrack) }}>
        Selecionar música
      </button>
    ),
}))

import { AddFavoriteForm } from '@/components/favorites/AddFavoriteForm'

const onAdd = vi.fn()
const onClose = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
})

function renderForm(existingFavorites: SpotifyTrack[] = []) {
  return render(
    <AddFavoriteForm
      existingFavorites={existingFavorites}
      onAdd={onAdd}
      onClose={onClose}
    />
  )
}

describe('AddFavoriteForm', () => {
  it('botão de submit está desabilitado sem track selecionada', () => {
    renderForm()
    expect(screen.getByRole('button', { name: /favorites\.addConfirm/i })).toBeDisabled()
  })

  it('selecionar track habilita o botão de submit', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByRole('button', { name: /selecionar música/i }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /favorites\.addConfirm/i })).not.toBeDisabled()
    })
  })

  it('exibe aviso quando track já está nos favoritos', async () => {
    const user = userEvent.setup()
    renderForm([mockTrack])
    await user.click(screen.getByRole('button', { name: /selecionar música/i }))
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('submit desabilitado quando track já é favorita', async () => {
    const user = userEvent.setup()
    renderForm([mockTrack])
    await user.click(screen.getByRole('button', { name: /selecionar música/i }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /favorites\.addConfirm/i })).toBeDisabled()
    })
  })

  it('submit chama onAdd e onClose com track e nota', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByRole('button', { name: /selecionar música/i }))
    await user.type(screen.getByRole('textbox'), 'ouço no treino')
    await user.click(screen.getByRole('button', { name: /favorites\.addConfirm/i }))
    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith(mockTrack, 'ouço no treino')
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('submit com nota vazia chama onAdd com undefined como nota', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByRole('button', { name: /selecionar música/i }))
    await user.click(screen.getByRole('button', { name: /favorites\.addConfirm/i }))
    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith(mockTrack, undefined)
    })
  })

  it('contador de nota está visível no formulário', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByRole('button', { name: /selecionar música/i }))
    // The counter renders t('favorites.noteCharsLeft') which returns the key as-is
    expect(screen.getByText(/favorites\.noteCharsLeft/i)).toBeInTheDocument()
  })
})
