import { describe, it, expect } from 'vitest'
import { pickImage, srcSetOf, normalizeImages, normalizeTrack } from '@/lib/utils'
import type { Image, Track } from '@/types/music'

const img = (w: number | null) => ({ url: `u${w}`, width: w, height: w })
const set = [img(1000), img(500), img(250), img(56)]

describe('pickImage', () => {
  it('picks the smallest image covering cssPx at 2x', () => {
    expect(pickImage(set, 32)?.width).toBe(250)
    expect(pickImage(set, 20)?.width).toBe(56)
    expect(pickImage(set, 125)?.width).toBe(250)
    expect(pickImage(set, 126)?.width).toBe(500)
    expect(pickImage(set, 280)?.width).toBe(1000)
  })

  it('falls back to the largest, then to the first when widths are unknown', () => {
    expect(pickImage(set, 900)?.width).toBe(1000)
    expect(pickImage([img(null), img(null)], 40)?.url).toBe('unull')
    const none = pickImage<Image>([], 40)
    expect(none).toBeUndefined()
  })
})

describe('srcSetOf', () => {
  it('lists every sized image', () => {
    expect(srcSetOf(set)).toBe('u1000 1000w, u500 500w, u250 250w, u56 56w')
    expect(srcSetOf([img(null)])).toBeUndefined()
  })
})

describe('normalizeImages', () => {
  it('reverses legacy null-width arrays that were stored smallest first', () => {
    const old = [
      { url: 'small', width: null, height: null },
      { url: 'mid', width: null, height: null },
      { url: 'xl', width: null, height: null },
    ]
    expect(normalizeImages(old).map((i) => i.url)).toEqual(['xl', 'mid', 'small'])
  })

  it('sorts sized arrays largest first and leaves ordered ones alone', () => {
    expect(normalizeImages([img(56), img(1000), img(250)]).map((i) => i.width)).toEqual([
      1000, 250, 56,
    ])
    expect(normalizeImages(set)).toEqual(set)
  })

  it('tolerates junk', () => {
    expect(normalizeImages(undefined)).toEqual([])
    expect(normalizeImages([{ nope: 1 }, img(56)])).toEqual([img(56)])
  })
})

describe('normalizeTrack', () => {
  it('turns an old stored album image list largest first', () => {
    const t = {
      uri: 'x',
      name: 'n',
      album: {
        images: [
          { url: 'small', width: null, height: null },
          { url: 'xl', width: null, height: null },
        ],
      },
    } as unknown as Track
    expect(normalizeTrack(t).album.images.map((i) => i.url)).toEqual(['xl', 'small'])
  })
})
