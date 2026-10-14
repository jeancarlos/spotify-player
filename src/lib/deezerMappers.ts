import i18n from '@/lib/i18n'
import type {
  PagingObject,
  AlbumFull,
  AlbumSimple,
  Artist,
  ArtistSimple,
  Image,
  Playlist,
  Track,
} from '@/types/music'

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
  user?: { id: number; name: string }
  link?: string
}

export interface DzList<T> {
  data: T[]
  total?: number
  next?: string
}

const toImages = (xl?: string, big?: string, medium?: string, small?: string): Image[] =>
  (
    [
      [xl, 1000],
      [big, 500],
      [medium, 250],
      [small, 56],
    ] as const
  ).flatMap(([url, size]) => (url ? [{ url, width: size, height: size }] : []))

const toArtistRef = (a: DzArtistRef | undefined): ArtistSimple => ({
  id: String(a?.id ?? 0),
  name: a?.name ?? i18n.t('common.unknown'),
  uri: `deezer:artist:${a?.id ?? 0}`,
  type: 'artist',
})

const coverImages = (a: DzAlbumRef) =>
  toImages(a.cover_xl, a.cover_big, a.cover_medium, a.cover_small)

const ALBUM_TYPES: Record<string, AlbumSimple['album_type']> = {
  single: 'single',
  ep: 'ep',
  compile: 'compilation',
}

const albumType = (t?: string): AlbumSimple['album_type'] => ALBUM_TYPES[t ?? ''] ?? 'album'

export function toArtist(a: DzArtist): Artist {
  return {
    id: String(a.id),
    name: a.name,
    uri: `deezer:artist:${a.id}`,
    type: 'artist',
    images: toImages(a.picture_xl, a.picture_big, a.picture_medium, a.picture_small),
    followers: a.nb_fan == null ? undefined : { href: null, total: a.nb_fan },
    link: a.link,
  }
}

export function toAlbum(a: DzAlbum): AlbumFull {
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

export function toTrack(t: DzTrack, album?: AlbumSimple): Track {
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
            name: i18n.t('common.unknown'),
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

export function toPlaylist(p: DzPlaylist): Playlist {
  const total = p.nb_tracks ?? 0
  const creator = p.creator ?? p.user
  return {
    id: String(p.id),
    name: p.title,
    description: p.description === '' ? null : (p.description ?? null),
    uri: `deezer:playlist:${p.id}`,
    type: 'playlist',
    images: toImages(p.picture_xl, p.picture_big, p.picture_medium, p.picture_small),
    owner: creator ? { id: String(creator.id), display_name: creator.name } : undefined,
    items: { total, href: '' },
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

export function isPlayable(t: Track): boolean {
  return t.is_playable !== false
}
