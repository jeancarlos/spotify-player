import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SearchResultsGrid } from '../SearchResultsGrid'
import type { Artist, AlbumSimple, Playlist } from '@/types/music'

const navigate = vi.fn()
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }))

const artists = [
  { id: 'a1', name: 'Art1', images: [], followers: { total: 5 } },
  { id: 'a2', name: 'Art2', images: [] },
] as unknown as Artist[]
const albums = [
  { id: 'b1', name: 'Alb1', images: [], artists: [{ name: 'X' }, { name: 'Y' }] },
] as unknown as AlbumSimple[]
const playlists = [
  { id: 'p1', name: 'Pl1', images: [], owner: { display_name: 'Me' } },
  null,
  { id: 'p2', name: 'Pl2', images: [] },
] as unknown as (Playlist | null)[]

describe('SearchResultsGrid', () => {
  it('artist tab navigates and shows followers', () => {
    render(<SearchResultsGrid tab="artist" artists={artists} albums={albums} />)
    expect(screen.getByText('artists.followers')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Art1'))
    expect(navigate).toHaveBeenCalledWith('/artists/a1')
    expect(screen.queryByText('Alb1')).toBeNull()
  })

  it('album tab joins artists', () => {
    render(<SearchResultsGrid tab="album" albums={albums} />)
    expect(screen.getByText('X, Y')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Alb1'))
    expect(navigate).toHaveBeenCalledWith('/albums/b1')
  })

  it('playlist tab skips nulls', () => {
    render(<SearchResultsGrid tab="playlist" playlists={playlists} />)
    expect(screen.getByText('Me')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Pl2'))
    expect(navigate).toHaveBeenCalledWith('/playlists/p2')
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  it('renders an empty grid without data', () => {
    const { container } = render(<SearchResultsGrid tab="artist" />)
    expect(container.firstElementChild).toBeEmptyDOMElement()
  })
})
