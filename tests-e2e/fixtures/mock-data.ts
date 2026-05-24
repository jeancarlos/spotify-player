export const mockUser = {
  id: 'user1',
  display_name: 'Test User',
  email: 'test@example.com',
  images: [{ url: 'https://picsum.photos/100', width: 100, height: 100 }],
  product: 'premium',
  followers: { total: 42, href: null },
  country: 'BR',
  type: 'user',
  uri: 'spotify:user:user1',
}

const baseArtist = {
  id: 'artist-1',
  name: 'Mock Artist',
  images: [{ url: 'https://picsum.photos/300', width: 300, height: 300 }],
  genres: ['pop', 'indie'],
  followers: { total: 150_000, href: null },
  popularity: 78,
  uri: 'spotify:artist:artist-1',
  type: 'artist' as const,
  external_urls: { spotify: 'https://open.spotify.com/artist/artist-1' },
}

export const mockArtist = (overrides?: Partial<typeof baseArtist>) => ({ ...baseArtist, ...overrides })

export const mockTrack = {
  id: 'track-1',
  name: 'Mock Track',
  duration_ms: 210_000,
  explicit: false,
  popularity: 80,
  preview_url: null,
  uri: 'spotify:track:track-1',
  type: 'track' as const,
  external_urls: { spotify: 'https://open.spotify.com/track/track-1' },
  artists: [{ id: 'artist-1', name: 'Mock Artist', uri: 'spotify:artist:artist-1', type: 'artist' as const, external_urls: { spotify: '' } }],
  album: {
    id: 'album-1',
    name: 'Mock Album',
    images: [{ url: 'https://picsum.photos/300', width: 300, height: 300 }],
    release_date: '2024-01-01',
    album_type: 'album' as const,
    artists: [{ id: 'artist-1', name: 'Mock Artist', uri: 'spotify:artist:artist-1', type: 'artist' as const, external_urls: { spotify: '' } }],
    uri: 'spotify:album:album-1',
    type: 'album' as const,
    external_urls: { spotify: '' },
  },
}

export const mockAlbum = {
  id: 'album-1',
  name: 'Mock Album',
  images: [{ url: 'https://picsum.photos/300', width: 300, height: 300 }],
  release_date: '2024-01-01',
  album_type: 'album' as const,
  artists: [{ id: 'artist-1', name: 'Mock Artist', uri: 'spotify:artist:artist-1', type: 'artist' as const, external_urls: { spotify: '' } }],
  uri: 'spotify:album:album-1',
  type: 'album' as const,
  total_tracks: 10,
  external_urls: { spotify: '' },
}

export const mockArtists = Array.from({ length: 40 }, (_, i) =>
  mockArtist({ id: `artist-${i + 1}`, name: `Artist ${i + 1}` })
)

export const mockTracks = Array.from({ length: 10 }, (_, i) => ({
  ...mockTrack,
  id: `track-${i + 1}`,
  name: `Track ${i + 1}`,
}))

const mockAlbums = Array.from({ length: 5 }, (_, i) => ({
  ...mockAlbum,
  id: `album-${i + 1}`,
  name: `Album ${i + 1}`,
}))

export { mockAlbums }

export function pagingOf<T>(items: T[], total?: number) {
  return {
    items,
    limit: 20,
    offset: 0,
    total: total ?? items.length,
    next: null,
    previous: null,
    href: '',
  }
}
