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
  album_type: 'album' | 'single' | 'compilation' | 'ep'
  artists: ArtistSimple[]
  uri: string
  type: 'album'
  href?: string
  total_tracks?: number
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
  is_playable?: boolean
  link?: string
}

export interface Artist {
  id: string
  name: string
  images: Image[]
  genres?: string[]
  followers?: { href: string | null; total: number }
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
  owner?: { id: string; display_name: string }
  items: { total: number; href: string }
  uri: string
  public: boolean | null
  type?: 'playlist'
  href?: string
  link?: string
}

export interface AlbumFull extends AlbumSimple {
  label?: string
  genres?: string[]
}
