import { http, HttpResponse } from 'msw'
import type {
  SpotifyTrack,
  SpotifyArtistSimple,
  SpotifyAlbumSimple,
  SpotifyArtist,
} from '@/types/spotify'

const artistSimple: SpotifyArtistSimple = {
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
  artists: [artistSimple],
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
  artists: [artistSimple],
  album,
}
const artist: SpotifyArtist = {
  id: 'a1',
  name: 'Mock Artist',
  images: [{ url: 'https://picsum.photos/300', width: 300, height: 300 }],
  genres: ['pop', 'rock'],
  followers: { total: 150000, href: null },
  popularity: 75,
  uri: 'spotify:artist:a1',
  type: 'artist',
}
const pagingWrapper = <T>(items: T[]) => ({
  items,
  limit: 20,
  offset: 0,
  total: items.length,
  next: null,
  previous: null,
})

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
    HttpResponse.json({ albums: pagingWrapper([album]) })
  ),
  http.get('https://api.spotify.com/v1/me/top/artists', () =>
    HttpResponse.json(pagingWrapper([artist]))
  ),
  http.get('https://api.spotify.com/v1/me/top/tracks', () =>
    HttpResponse.json(pagingWrapper([track]))
  ),
  http.get('https://api.spotify.com/v1/recommendations', () =>
    HttpResponse.json({ tracks: [track] })
  ),
  http.get('https://api.spotify.com/v1/search', ({ request }) => {
    const url = new URL(request.url)
    const type = url.searchParams.get('type')
    const offset = Number(url.searchParams.get('offset') ?? 0)
    if (offset > 0) {
      if (type === 'artist') return HttpResponse.json({ artists: pagingWrapper([]) })
      return HttpResponse.json({ albums: pagingWrapper([]) })
    }
    if (type === 'artist') return HttpResponse.json({ artists: pagingWrapper([artist]) })
    return HttpResponse.json({ albums: pagingWrapper([album]) })
  }),
  http.get('https://api.spotify.com/v1/artists/:id', ({ params }) =>
    HttpResponse.json({ ...artist, id: params.id as string })
  ),
  http.get('https://api.spotify.com/v1/artists/:id/top-tracks', () =>
    HttpResponse.json({ tracks: [track] })
  ),
  http.get('https://api.spotify.com/v1/artists/:id/albums', () =>
    HttpResponse.json(pagingWrapper([album]))
  ),
  http.get('https://api.spotify.com/v1/me/player', () =>
    HttpResponse.json({
      is_playing: false,
      progress_ms: 0,
      item: null,
      repeat_state: 'off',
      shuffle_state: false,
    })
  ),
]
