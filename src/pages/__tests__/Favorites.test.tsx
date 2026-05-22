import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n'
import { Favorites } from '../Favorites'

beforeEach(() => {
  localStorage.clear()
})

function renderFavorites() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <Favorites />
      </MemoryRouter>
    </I18nextProvider>
  )
}

describe('Favorites page', () => {
  it('renders the form with title and artist fields', () => {
    renderFavorites()
    expect(screen.getByLabelText(/Título|Title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Artista|Artist/i)).toBeInTheDocument()
  })

  it('shows validation error when submitting empty title', async () => {
    renderFavorites()
    fireEvent.click(screen.getByRole('button', { name: /Adicionar favorito|Add favorite/i }))
    expect(
      await screen.findByText(/Título é obrigatório|Title is required/i)
    ).toBeInTheDocument()
  })

  it('adds a favorite and shows it in the list', async () => {
    renderFavorites()
    fireEvent.change(screen.getByLabelText(/Título|Title/i), { target: { value: 'My Track' } })
    fireEvent.change(screen.getByLabelText(/Artista|Artist/i), { target: { value: 'My Artist' } })
    fireEvent.click(screen.getByRole('button', { name: /Adicionar favorito|Add favorite/i }))
    expect(await screen.findByText('My Track')).toBeInTheDocument()
  })

  it('filters favorites by search query', async () => {
    renderFavorites()
    fireEvent.change(screen.getByLabelText(/Título|Title/i), {
      target: { value: 'Unique Track' },
    })
    fireEvent.change(screen.getByLabelText(/Artista|Artist/i), {
      target: { value: 'Some Artist' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Adicionar favorito|Add favorite/i }))
    await screen.findByText('Unique Track')
    const searchInput = screen.getByPlaceholderText(/Buscar|Search/i)
    fireEvent.change(searchInput, { target: { value: 'xyz_no_match' } })
    await waitFor(() => expect(screen.queryByText('Unique Track')).not.toBeInTheDocument())
  })
})
