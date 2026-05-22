export interface SpotifyImage {
  url: string
  width: number | null
  height: number | null
}

export interface SpotifyArtistSimple {
  id: string
  name: string
  uri: string
  type: 'artist'
}

export interface SpotifyAlbumSimple {
  id: string
  name: string
  images: SpotifyImage[]
  release_date: string
  album_type: 'album' | 'single' | 'compilation'
  artists: SpotifyArtistSimple[]
  uri: string
  type: 'album'
}

export interface SpotifyTrack {
  id: string
  name: string
  duration_ms: number
  explicit: boolean
  popularity: number
  preview_url: string | null
  uri: string
  type: 'track'
  artists: SpotifyArtistSimple[]
  album: SpotifyAlbumSimple
}

export interface SpotifyArtist {
  id: string
  name: string
  images: SpotifyImage[]
  genres: string[]
  followers: { total: number }
  popularity: number
  uri: string
  type: 'artist'
}

export interface SpotifyUser {
  id: string
  display_name: string
  email: string
  images: SpotifyImage[]
  product: 'premium' | 'free'
  followers: { total: number }
  country: string
}

export interface PlayHistoryItem {
  track: SpotifyTrack
  played_at: string
  context: { type: string; uri: string } | null
}

export interface PagingObject<T> {
  items: T[]
  limit: number
  offset: number
  total: number
  next: string | null
  previous: string | null
}

export interface CursorPagingObject<T> {
  items: T[]
  limit: number
  cursors: { before: string; after: string }
  next: string | null
}

export interface RecentlyPlayedResponse {
  items: PlayHistoryItem[]
  limit: number
  cursors: { before: string; after: string }
  next: string | null
}

export interface NewReleasesResponse {
  albums: PagingObject<SpotifyAlbumSimple>
}
