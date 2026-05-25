export interface SpotifyImage {
  url: string
  width: number | null
  height: number | null
}

export interface SpotifyExternalUrls {
  spotify: string
}

export interface SpotifyArtistSimple {
  id: string
  name: string
  uri: string
  type: 'artist'
  href?: string
  external_urls?: SpotifyExternalUrls
}

export interface SpotifyAlbumSimple {
  id: string
  name: string
  images: SpotifyImage[]
  release_date: string
  release_date_precision?: 'year' | 'month' | 'day'
  album_type: 'album' | 'single' | 'compilation'
  artists: SpotifyArtistSimple[]
  uri: string
  type: 'album'
  href?: string
  total_tracks?: number
  external_urls?: SpotifyExternalUrls
  available_markets?: string[]
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
  href?: string
  disc_number?: number
  track_number?: number
  is_local?: boolean
  is_playable?: boolean
  external_urls?: SpotifyExternalUrls
  external_ids?: { isrc?: string; ean?: string; upc?: string }
  available_markets?: string[]
}

export interface SpotifyArtist {
  id: string
  name: string
  images: SpotifyImage[]
  genres?: string[]
  followers?: { href: string | null; total: number }
  popularity?: number
  uri: string
  type: 'artist'
  href?: string
  external_urls?: SpotifyExternalUrls
}

export interface SpotifyUser {
  id: string
  display_name: string
  email: string
  images: SpotifyImage[]
  product: 'free' | 'open' | 'premium'
  followers: { href: string | null; total: number }
  country: string
  href?: string
  uri?: string
  type?: 'user'
  external_urls?: SpotifyExternalUrls
}

export interface PlayHistoryItem {
  track: SpotifyTrack
  played_at: string
  context: { type: string; uri: string; href: string; external_urls: SpotifyExternalUrls } | null
}

export interface PagingObject<T> {
  href: string
  items: T[]
  limit: number
  offset: number
  total: number
  next: string | null
  previous: string | null
}

export interface CursorPagingObject<T> {
  href?: string
  items: T[]
  limit: number
  cursors: { before: string; after: string }
  next: string | null
  total?: number
}

export interface RecentlyPlayedResponse {
  items: PlayHistoryItem[]
  limit: number
  cursors: { before: string; after: string }
  next: string | null
}

export interface SearchArtistsResponse {
  artists: PagingObject<SpotifyArtist>
}

export interface SearchAlbumsResponse {
  albums: PagingObject<SpotifyAlbumSimple>
}

export interface SearchPlaylistsResponse {
  playlists: PagingObject<SpotifyPlaylist | null>
}

export interface ArtistTopTracksResponse {
  tracks: SpotifyTrack[]
}

export type ArtistAlbumsResponse = PagingObject<SpotifyAlbumSimple>

export interface SpotifyDevice {
  id: string | null
  is_active: boolean
  is_private_session: boolean
  is_restricted: boolean
  name: string
  type: string
  volume_percent: number | null
  supports_volume?: boolean
}

export interface SpotifyContext {
  type: 'album' | 'artist' | 'playlist' | 'show'
  href: string
  external_urls: SpotifyExternalUrls
  uri: string
}

export interface SpotifyDisallows {
  interrupting_playback?: boolean
  pausing?: boolean
  resuming?: boolean
  seeking?: boolean
  skipping_next?: boolean
  skipping_prev?: boolean
  toggling_repeat_context?: boolean
  toggling_repeat_track?: boolean
  toggling_shuffle?: boolean
  transferring_playback?: boolean
}

export interface SpotifyPlayerState {
  is_playing: boolean
  progress_ms: number | null
  item: SpotifyTrack | null
  repeat_state: 'off' | 'track' | 'context'
  shuffle_state: boolean
  device?: SpotifyDevice
  context?: SpotifyContext | null
  timestamp?: number
  currently_playing_type?: 'track' | 'episode' | 'ad' | 'unknown'
  actions?: { disallows: SpotifyDisallows }
}

export type TopItemsResponse<T> = PagingObject<T>

export interface SpotifyPlaylist {
  id: string
  name: string
  description: string | null
  images: SpotifyImage[]
  owner: {
    id: string
    display_name: string
    uri?: string
    href?: string
    type?: 'user'
    external_urls?: SpotifyExternalUrls
  }
  items: { total: number; href: string }
  /** @deprecated Use items instead */
  tracks: { total: number; href: string }
  uri: string
  public: boolean | null
  collaborative?: boolean
  snapshot_id?: string
  type?: 'playlist'
  href?: string
  external_urls?: SpotifyExternalUrls
}

export interface SpotifyPlaylistTrack {
  added_at: string | null
  added_by?: {
    id: string
    type: 'user'
    uri: string
    href: string
    external_urls: SpotifyExternalUrls
  } | null
  is_local?: boolean
  item: SpotifyTrack
  /** @deprecated Use item instead */
  track: SpotifyTrack
}

export interface UserPlaylistsResponse {
  items: SpotifyPlaylist[]
  total: number
  limit: number
  offset: number
  next: string | null
  href?: string
  previous?: string | null
}

export interface PlaylistTracksResponse {
  items: SpotifyPlaylistTrack[]
  total: number
  limit: number
  offset: number
  next: string | null
  href?: string
  previous?: string | null
}

export interface SearchTracksResponse {
  tracks: PagingObject<SpotifyTrack>
}

export interface SpotifyQueueResponse {
  currently_playing: SpotifyTrack | null
  queue: SpotifyTrack[]
}

export interface SpotifyAlbumTrack {
  id: string
  name: string
  duration_ms: number
  explicit: boolean
  track_number: number
  disc_number: number
  uri: string
  type: 'track'
  artists: SpotifyArtistSimple[]
  preview_url: string | null
  is_playable?: boolean
  href?: string
  external_urls?: SpotifyExternalUrls
}

export interface SpotifyAlbumFull extends SpotifyAlbumSimple {
  label?: string
  genres?: string[]
  popularity?: number
  copyrights?: { text: string; type: 'C' | 'P' }[]
  external_ids?: { upc?: string; ean?: string }
}

export type AlbumTracksResponse = PagingObject<SpotifyAlbumTrack>
