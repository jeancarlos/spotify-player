import { describe, it, expect } from 'vitest'
import {
  cn,
  isStoredTrack,
  normalizeTrack,
  normalizeImages,
  pickImage,
  srcSetOf,
} from '@/lib/utils'
import type { Track } from '@/types/music'

describe('cn', () => {
  it('merges conflicting tailwind classes', () => {
    expect(cn('p-2', undefined, 'p-4')).toBe('p-4')
  })
})

describe('images', () => {
  const imgs = [
    { url: 'a', width: 100 },
    { url: 'b', width: 500 },
    { url: 'n', width: null },
  ]

  it('pickImage picks the first image large enough, else the largest, else the first', () => {
    expect(pickImage(imgs, 100)?.url).toBe('b')
    expect(pickImage(imgs, 1000)?.url).toBe('b')
    expect(pickImage([{ url: 'n' }], 10)?.url).toBe('n')
    expect(pickImage<{ url: string }>([], 10)?.url).toBeUndefined()
  })

  it('srcSetOf lists sized images only', () => {
    expect(srcSetOf(imgs)).toBe('a 100w, b 500w')
    expect(srcSetOf([{ url: 'n' }])).toBeUndefined()
  })

  it('normalizeImages handles non-arrays, unsized and sized lists', () => {
    expect(normalizeImages('x')).toEqual([])
    expect(normalizeImages([{ url: 'a' }, { url: 'b' }, null, { url: 1 }])).toEqual([
      { url: 'b' },
      { url: 'a' },
    ])
    expect(normalizeImages([{ url: 'a', width: 1 }, { url: 'b' }, { url: 'c', width: 9 }])).toEqual(
      [{ url: 'c', width: 9 }, { url: 'a', width: 1 }, { url: 'b' }]
    )
  })
})

describe('normalizeTrack', () => {
  const base = {
    id: '1',
    artists: [
      { id: '0', name: 'x' },
      { id: '2', name: 'Real' },
    ],
    album: { id: '0', name: 'x', images: [{ url: 'a' }, { url: 'b' }] },
  } as unknown as Track

  it('localizes unknown artist and album and normalizes images', () => {
    const out = normalizeTrack(base)
    expect(out.artists.map((a) => a.name)).toEqual(['Unknown', 'Real'])
    expect(out.album.name).toBe('Unknown')
    expect(out.album.images.map((i) => i.url)).toEqual(['b', 'a'])
  })
})

describe('isStoredTrack', () => {
  const whole = { uri: 'u', name: 'n', artists: [], album: {} }

  it('accepts a whole track and rejects anything missing a field render reads', () => {
    expect(isStoredTrack(whole)).toBe(true)
    for (const bad of [
      null,
      5,
      'x',
      { ...whole, uri: 1 },
      { ...whole, name: null },
      { ...whole, artists: {} },
      { ...whole, album: null },
      { ...whole, album: 'a' },
    ]) {
      expect(isStoredTrack(bad)).toBe(false)
    }
  })
})
