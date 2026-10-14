export interface Image {
  url: string
  width: number | null
  height: number | null
}

export interface ArtistSimple {
  id: string
  name: string
  uri: string
  type: 'artist'
  href?: string
}

export interface AlbumSimple {
  id: string
  name: string
  images: Image[]
  release_date: string
  release_date_precision?: 'year' | 'month' | 'day'
  album_type: 'album' | 'single' | 'compilation'
  artists: ArtistSimple[]
  uri: string
  type: 'album'
  href?: string
  total_tracks?: number
  available_markets?: string[]
  link?: string
}

export interface Track {
  id: string
  name: string
  duration_ms: number
  explicit: boolean
  rank?: number
  preview_url: string | null
  uri: string
  type: 'track'
  artists: ArtistSimple[]
  album: AlbumSimple
  href?: string
  disc_number?: number
  track_number?: number
  is_local?: boolean
  is_playable?: boolean
  external_ids?: { isrc?: string; ean?: string; upc?: string }
  available_markets?: string[]
  link?: string
}

export interface Artist {
  id: string
  name: string
  images: Image[]
  genres?: string[]
  followers?: { href: string | null; total: number }
  popularity?: number
  uri: string
  type: 'artist'
  href?: string
  link?: string
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

export interface Playlist {
  id: string
  name: string
  description: string | null
  images: Image[]
  owner: {
    id: string
    display_name: string
    uri?: string
    href?: string
    type?: 'user'
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
  link?: string
}

export interface PlaylistTrack {
  added_at: string | null
  added_by?: {
    id: string
    type: 'user'
    uri: string
    href: string
  } | null
  is_local?: boolean
  item: Track
  /** @deprecated Use item instead */
  track: Track
}

export interface PlaylistTracksResponse {
  items: PlaylistTrack[]
  total: number
  limit: number
  offset: number
  next: string | null
  href?: string
  previous?: string | null
}

export interface AlbumFull extends AlbumSimple {
  label?: string
  genres?: string[]
  popularity?: number
  copyrights?: { text: string; type: 'C' | 'P' }[]
  external_ids?: { upc?: string; ean?: string }
}
