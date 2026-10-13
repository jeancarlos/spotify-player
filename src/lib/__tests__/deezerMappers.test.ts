import { describe, it, expect } from 'vitest'
import {
  toTrack,
  toArtist,
  toAlbum,
  toPlaylist,
  toPage,
  isPlayable,
  type DzArtist,
  type DzList,
  type DzTrack,
} from '@/lib/deezerMappers'

import searchArtists from '@/mocks/fixtures/deezer/search-artist.json'
import searchTracks from '@/mocks/fixtures/deezer/search-track.json'
import artist from '@/mocks/fixtures/deezer/artist.json'
import artistTop from '@/mocks/fixtures/deezer/artist-top.json'
import album from '@/mocks/fixtures/deezer/album.json'
import albumTracks from '@/mocks/fixtures/deezer/album-tracks.json'
import playlist from '@/mocks/fixtures/deezer/playlist.json'
import playlistTracks from '@/mocks/fixtures/deezer/playlist-tracks.json'

const tracks = (searchTracks as unknown as DzList<DzTrack>).data
const noPreview = (playlistTracks as unknown as DzList<DzTrack>).data.find((t) => !t.preview)!

describe('deezerMappers', () => {
  it('maps an artist', () => {
    const dz = artist as unknown as DzArtist
    const r = toArtist(dz)
    expect(r.id).toBe('892')
    expect(r.name).toBe('Coldplay')
    expect(r.uri).toBe('deezer:artist:892')
    expect(r.type).toBe('artist')
    expect(r.images).toHaveLength(4)
    expect(r.followers?.total).toBe(dz.nb_fan)
    expect(r.link).toBe('https://www.deezer.com/artist/892')
    expect(toArtist((searchArtists as unknown as DzList<DzArtist>).data[0]).id).toBe('892')
  })

  it('maps an album with genres from the nested data list', () => {
    const r = toAlbum(album)
    expect(r.id).toBe('650278821')
    expect(r.name).toBe('Moon Music')
    expect(r.uri).toBe('deezer:album:650278821')
    expect(r.release_date).toBe('2024-10-04')
    expect(r.label).toBe('Parlophone UK')
    expect(r.genres).toEqual(['Alternativo'])
    expect(r.total_tracks).toBe(10)
    expect(r.artists[0].id).toBe('892')
    expect(r.album_type).toBe('album')
  })

  it('maps a track with rank, link, preview and embedded album', () => {
    const dz = tracks[0]
    const r = toTrack(dz)
    expect(r.id).toBe('3106505')
    expect(r.name).toBe('Fix You')
    expect(r.uri).toBe('deezer:track:3106505')
    expect(r.duration_ms).toBe(295000)
    expect(r.rank).toBe(907858)
    expect(r.link).toBe('https://www.deezer.com/track/3106505')
    expect(r.preview_url).toBe(dz.preview)
    expect(r.is_playable).toBe(true)
    expect(r.album.id).toBe(String(dz.album!.id))
    expect(r.artists[0].id).toBe(String(dz.artist!.id))
  })

  it('uses the supplied album when the track carries none', () => {
    const a = toAlbum(album)
    const dz = (albumTracks as unknown as DzList<DzTrack>).data[0]
    expect(dz.album).toBeUndefined()
    const r = toTrack(dz, a)
    expect(r.album).toBe(a)
    expect(r.track_number).toBe(dz.track_position)
  })

  it('maps an empty preview to null and readable to is_playable', () => {
    expect(noPreview.preview).toBe('')
    expect(toTrack(noPreview).preview_url).toBeNull()
    expect(toTrack({ ...tracks[0], readable: false }).is_playable).toBe(false)
    expect(toTrack((artistTop as unknown as DzList<DzTrack>).data[0]).rank).toBe(971942)
  })

  it('maps a playlist', () => {
    const r = toPlaylist(playlist)
    expect(r.id).toBe('5207214368')
    expect(r.name).toBe('Top 50 Sertanejo')
    expect(r.uri).toBe('deezer:playlist:5207214368')
    expect(r.description).toBe('Ouça os maiores sucessos do sertanejo! Capa: Simone Mendes.')
    expect(r.owner.display_name).toBe('Daniel - Editor Deezer Brasil')
    expect(r.items.total).toBe(50)
    expect(r.images).toHaveLength(4)
  })

  it('pages a list using the supplied index and limit', () => {
    const list = searchTracks as unknown as DzList<DzTrack>
    const r = toPage(list, 10, 20, (t) => toTrack(t))
    expect(r.items).toHaveLength(5)
    expect(r.offset).toBe(10)
    expect(r.limit).toBe(20)
    expect(r.total).toBe(262)
    expect(r.next).toBe(list.next)
    expect(toPage(albumTracks as unknown as DzList<DzTrack>, 0, 50, toTrack).next).toBeNull()
  })

  it('isPlayable needs a preview and a non-false is_playable', () => {
    const base = toTrack(tracks[0])
    expect(isPlayable(base)).toBe(true)
    expect(isPlayable({ ...base, preview_url: null })).toBe(false)
    expect(isPlayable({ ...base, is_playable: false })).toBe(false)
    expect(isPlayable(toTrack(noPreview))).toBe(false)
  })
})
