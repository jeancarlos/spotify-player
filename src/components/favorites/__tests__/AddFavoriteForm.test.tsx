import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Track } from '@/types/music'

const mockTrack: Track = {
  id: 't1',
  uri: 'deezer:track:t1',
  name: 'Test Track',
  duration_ms: 180000,
  explicit: false,
  rank: 80,
  preview_url: null,
  type: 'track',
  artists: [{ id: 'a1', name: 'Test Artist', uri: 'deezer:artist:a1', type: 'artist' }],
  album: {
    id: 'alb1',
    name: 'Test Album',
    images: [{ url: 'https://img.test/1.jpg', width: 300, height: 300 }],
    release_date: '2024-01-01',
    album_type: 'album',
    artists: [],
    uri: 'deezer:album:alb1',
    type: 'album',
  },
}

vi.mock('@/components/favorites/TrackAutocomplete', () => ({
  TrackAutocomplete: ({
    onChange,
    value,
    id,
    error,
  }: {
    id?: string
    onChange: (t: Track | null) => void
    value: Track | null
    onBlur: () => void
    error?: string
  }) =>
    value ? (
      <div data-testid="selected-track">
        {value.name}
        <button
          type="button"
          onClick={() => {
            onChange(null)
          }}
        >
          Limpar música
        </button>
      </div>
    ) : (
      <>
        <button
          data-input-id={id}
          type="button"
          onClick={() => {
            onChange(mockTrack)
          }}
        >
          Selecionar música
        </button>
        {error && <p data-testid="track-error">{error}</p>}
      </>
    ),
}))

import { AddFavoriteForm } from '@/components/favorites/AddFavoriteForm'

const onAdd = vi.fn(() => true)
const onClose = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
})

function renderForm(existingFavorites: Track[] = []) {
  return render(
    <AddFavoriteForm existingFavorites={existingFavorites} onAdd={onAdd} onClose={onClose} />
  )
}

describe('AddFavoriteForm', () => {
  it('associates both labels with their controls', () => {
    renderForm()
    expect(screen.getByRole('button', { name: /selecionar música/i })).toHaveAttribute(
      'data-input-id',
      'favorite-track'
    )
    expect(screen.getByText(/favorites\.trackLabel/).closest('label')).toHaveAttribute(
      'for',
      'favorite-track'
    )
    expect(screen.getByLabelText(/favorites\.noteLabel/).tagName).toBe('TEXTAREA')
  })
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

  it('submit nao fecha o form quando onAdd falha', async () => {
    const user = userEvent.setup()
    onAdd.mockReturnValueOnce(false)
    renderForm()
    await user.click(screen.getByRole('button', { name: /selecionar música/i }))
    await user.click(screen.getByRole('button', { name: /favorites\.addConfirm/i }))
    await waitFor(() => {
      expect(onAdd).toHaveBeenCalled()
    })
    expect(onClose).not.toHaveBeenCalled()
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
    expect(screen.getByText(/favorites\.noteCharsLeft/i)).toBeInTheDocument()
  })

  it('mostra o erro de track ao limpar a seleção', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByRole('button', { name: /selecionar música/i }))
    await user.click(await screen.findByRole('button', { name: /limpar música/i }))
    expect(await screen.findByTestId('track-error')).toHaveTextContent('favorites.trackRequired')
  })

  it('mostra o erro de nota longa', async () => {
    renderForm()
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'x'.repeat(1000) } })
    expect(await screen.findByText('favorites.noteTooLong')).toBeInTheDocument()
  })
})
