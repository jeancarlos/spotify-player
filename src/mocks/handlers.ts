import { http, HttpResponse } from 'msw'
import type { SpotifyTrack, SpotifyArtistSimple, SpotifyAlbumSimple } from '@/types/spotify'

const artist: SpotifyArtistSimple = {
  id: 'a1',
  name: 'Mock Artist',
  uri: 'spotify:artist:a1',
  type: 'artist',
}

const album: SpotifyAlbumSimple = {
  id: 'al1',
  name: 'Mock Album',
  images: [{ url: 'https://picsum.photos/300', width: 300, height: 300 }],
  release_date: '2024-01-01',
  album_type: 'album',
  artists: [artist],
  uri: 'spotify:album:al1',
  type: 'album',
}

const track: SpotifyTrack = {
  id: 't1',
  name: 'Mock Track 1',
  duration_ms: 210000,
  explicit: false,
  popularity: 80,
  preview_url: null,
  uri: 'spotify:track:t1',
  type: 'track',
  artists: [artist],
  album,
}

export const handlers = [
  http.get('https://api.spotify.com/v1/me', () =>
    HttpResponse.json({
      id: 'user1',
      display_name: 'Test User',
      email: 'test@test.com',
      images: [],
      product: 'premium',
      followers: { total: 10 },
      country: 'BR',
    })
  ),
  http.get('https://api.spotify.com/v1/me/player/recently-played', () =>
    HttpResponse.json({
      items: [{ track, played_at: '2024-01-15T12:00:00Z', context: null }],
      limit: 20,
      cursors: { before: '1', after: '2' },
      next: null,
    })
  ),
  http.get('https://api.spotify.com/v1/browse/new-releases', () =>
    HttpResponse.json({
      albums: {
        items: [album],
        limit: 20,
        offset: 0,
        total: 1,
        next: null,
        previous: null,
      },
    })
  ),
  http.get('https://api.spotify.com/v1/me/top/artists', () =>
    HttpResponse.json({
      items: [
        {
          id: 'a1',
          name: 'Mock Artist',
          images: [],
          genres: ['pop'],
          followers: { total: 1000 },
          popularity: 75,
          uri: 'spotify:artist:a1',
          type: 'artist',
        },
      ],
      limit: 5,
      offset: 0,
      total: 1,
      next: null,
      previous: null,
    })
  ),
  http.get('https://api.spotify.com/v1/recommendations', () =>
    HttpResponse.json({ tracks: [track] })
  ),
]
