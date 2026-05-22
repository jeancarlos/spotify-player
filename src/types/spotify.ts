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

export interface AudioFeatures {
  id: string
  danceability: number   // 0-1
  energy: number         // 0-1
  valence: number        // 0-1
  acousticness: number   // 0-1
  speechiness: number    // 0-1
  instrumentalness: number
  liveness: number
  loudness: number
  tempo: number
  duration_ms: number
  key: number
  mode: number
  time_signature: number
}

export interface SearchArtistsResponse {
  artists: PagingObject<SpotifyArtist>
}

export interface SearchAlbumsResponse {
  albums: PagingObject<SpotifyAlbumSimple>
}

export interface ArtistTopTracksResponse {
  tracks: SpotifyTrack[]
}

export interface ArtistAlbumsResponse extends PagingObject<SpotifyAlbumSimple> {}

export interface SpotifyPlayerState {
  is_playing: boolean
  progress_ms: number | null
  item: SpotifyTrack | null
  repeat_state: 'off' | 'track' | 'context'
  shuffle_state: boolean
}

export interface TopItemsResponse<T> extends PagingObject<T> {}
