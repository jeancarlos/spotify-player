import type {
  PagingObject,
  SpotifyAlbumFull,
  SpotifyAlbumSimple,
  SpotifyArtist,
  SpotifyArtistSimple,
  SpotifyImage,
  SpotifyPlaylist,
  SpotifyTrack,
} from '@/types/spotify'

export interface DzArtistRef {
  id: number
  name: string
}

export interface DzArtist extends DzArtistRef {
  picture_small?: string
  picture_medium?: string
  picture_big?: string
  picture_xl?: string
  nb_fan?: number
  nb_album?: number
  link?: string
}

export interface DzAlbumRef {
  id: number
  title: string
  cover_small?: string
  cover_medium?: string
  cover_big?: string
  cover_xl?: string
  release_date?: string
  nb_tracks?: number
  link?: string
}

export interface DzAlbum extends DzAlbumRef {
  label?: string
  genres?: { data: { id: number; name: string }[] }
  artist?: DzArtistRef
  record_type?: string
}

export interface DzTrack {
  id: number
  title: string
  duration: number
  rank?: number
  readable?: boolean
  preview?: string
  link?: string
  explicit_lyrics?: boolean
  track_position?: number
  disk_number?: number
  isrc?: string
  album?: DzAlbumRef
  artist?: DzArtistRef
}

export interface DzPlaylist {
  id: number
  title: string
  description?: string
  picture_small?: string
  picture_medium?: string
  picture_big?: string
  picture_xl?: string
  nb_tracks?: number
  public?: boolean
  creator?: { id: number; name: string }
  link?: string
}

export interface DzList<T> {
  data: T[]
  total?: number
  next?: string
}

const toImages = (...urls: (string | undefined)[]): SpotifyImage[] =>
  urls.filter((url): url is string => !!url).map((url) => ({ url, width: null, height: null }))

const toArtistRef = (a: DzArtistRef | undefined): SpotifyArtistSimple => ({
  id: String(a?.id ?? 0),
  name: a?.name ?? 'Unknown',
  uri: `deezer:artist:${a?.id ?? 0}`,
  type: 'artist',
})

const coverImages = (a: DzAlbumRef) =>
  toImages(a.cover_small, a.cover_medium, a.cover_big, a.cover_xl)

const albumType = (t?: string): SpotifyAlbumSimple['album_type'] =>
  t === 'single' || t === 'compilation' ? t : 'album'

export function toArtist(a: DzArtist): SpotifyArtist {
  return {
    id: String(a.id),
    name: a.name,
    uri: `deezer:artist:${a.id}`,
    type: 'artist',
    images: toImages(a.picture_small, a.picture_medium, a.picture_big, a.picture_xl),
    followers: { href: null, total: a.nb_fan ?? 0 },
    link: a.link,
  }
}

export function toAlbum(a: DzAlbum): SpotifyAlbumFull {
  return {
    id: String(a.id),
    name: a.title,
    uri: `deezer:album:${a.id}`,
    type: 'album',
    images: coverImages(a),
    release_date: a.release_date ?? '',
    album_type: albumType(a.record_type),
    artists: [toArtistRef(a.artist)],
    total_tracks: a.nb_tracks,
    label: a.label,
    genres: a.genres?.data.map((g) => g.name) ?? [],
    link: a.link,
  }
}

export function toTrack(t: DzTrack, album?: SpotifyAlbumSimple): SpotifyTrack {
  const artists = [toArtistRef(t.artist)]
  return {
    id: String(t.id),
    name: t.title,
    uri: `deezer:track:${t.id}`,
    type: 'track',
    duration_ms: t.duration * 1000,
    explicit: t.explicit_lyrics ?? false,
    preview_url: t.preview === '' ? null : (t.preview ?? null),
    artists,
    album:
      album ??
      (t.album
        ? {
            id: String(t.album.id),
            name: t.album.title,
            uri: `deezer:album:${t.album.id}`,
            type: 'album',
            images: coverImages(t.album),
            release_date: t.album.release_date ?? '',
            album_type: 'album',
            artists,
            total_tracks: t.album.nb_tracks,
            link: t.album.link,
          }
        : {
            id: '0',
            name: 'Unknown',
            uri: 'deezer:album:0',
            type: 'album',
            images: [],
            release_date: '',
            album_type: 'album',
            artists,
          }),
    track_number: t.track_position,
    disc_number: t.disk_number,
    is_playable: t.readable !== false && !!t.preview,
    rank: t.rank,
    link: t.link,
  }
}

export function toPlaylist(p: DzPlaylist): SpotifyPlaylist {
  const total = p.nb_tracks ?? 0
  return {
    id: String(p.id),
    name: p.title,
    description: p.description === '' ? null : (p.description ?? null),
    uri: `deezer:playlist:${p.id}`,
    type: 'playlist',
    images: toImages(p.picture_small, p.picture_medium, p.picture_big, p.picture_xl),
    owner: {
      id: String(p.creator?.id ?? 0),
      display_name: p.creator?.name ?? 'Unknown',
      type: 'user',
    },
    items: { total, href: '' },
    tracks: { total, href: '' },
    public: p.public ?? true,
    link: p.link,
  }
}

export function toPage<R, T>(
  list: DzList<R>,
  index: number,
  limit: number,
  map: (r: R) => T
): PagingObject<T> {
  return {
    href: '',
    items: list.data.map((r) => map(r)),
    limit,
    offset: index,
    total: list.total ?? list.data.length,
    next: list.next ?? null,
    previous: null,
  }
}

export function isPlayable(t: SpotifyTrack): boolean {
  return t.is_playable !== false
}
