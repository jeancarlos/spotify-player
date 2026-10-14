import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ArtistBio } from '../ArtistBio'

const useArtistBio = vi.fn()
vi.mock('@/hooks/queries/useArtistBio', () => ({
  useArtistBio: (name: string | undefined) => useArtistBio(name) as unknown,
}))
vi.mock('@/hooks/useDebounce', () => ({ useDebounce: (v: unknown) => v }))

describe('ArtistBio', () => {
  beforeEach(() => {
    useArtistBio.mockReset()
  })

  it('renders nothing without data', () => {
    useArtistBio.mockReturnValue({ data: null })
    const { container } = render(<ArtistBio artistName="A" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('marks english extracts', () => {
    useArtistBio.mockReturnValue({ data: { extract: 'Bio', url: 'http://w', lang: 'en' } })
    render(<ArtistBio artistName="A" />)
    expect(screen.getByText('Bio')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveTextContent('Wikipedia (EN) →')
  })

  it('omits the marker for other languages', () => {
    useArtistBio.mockReturnValue({ data: { extract: 'Bio', url: 'http://w', lang: 'pt' } })
    render(<ArtistBio artistName={undefined} />)
    expect(screen.getByRole('link')).not.toHaveTextContent('(EN)')
  })
})
