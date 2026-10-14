import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ArtistDiscography } from '../ArtistDiscography'
import type { AlbumSimple } from '@/types/music'

const albums = [
  { id: '1', name: 'One', album_type: 'album', release_date: '2020-05-01', images: [{ url: 'u' }], artists: [] },
  { id: '2', name: 'Two', album_type: 'single', release_date: '', images: [], artists: [] },
] as unknown as AlbumSimple[]

function setup(view: 'list' | 'table') {
  const props = {
    albums,
    view,
    onViewChange: vi.fn(),
    onAlbumClick: vi.fn(),
    page: 1,
    hasNext: true,
    onPrevPage: vi.fn(),
    onNextPage: vi.fn(),
  }
  render(<ArtistDiscography {...props} />)
  return props
}

describe('ArtistDiscography', () => {
  it('list view opens albums by click and keyboard', () => {
    const p = setup('list')
    expect(screen.getByText('2020')).toBeInTheDocument()
    const rows = screen.getAllByRole('button').filter((b) => b.tagName === 'DIV')
    fireEvent.click(rows[0])
    fireEvent.keyDown(rows[1], { key: 'Enter' })
    fireEvent.keyDown(rows[1], { key: ' ' })
    fireEvent.keyDown(rows[1], { key: 'a' })
    expect(p.onAlbumClick).toHaveBeenCalledTimes(3)
    expect(p.onAlbumClick).toHaveBeenNthCalledWith(1, albums[0])
  })

  it('table view renders the table', () => {
    setup('table')
    expect(screen.getByRole('table')).toBeInTheDocument()
  })
})
