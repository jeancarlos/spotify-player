import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Image, Track } from '@/types/music'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface SizedImage {
  url: string
  width?: number | null
}

export function pickImage<T extends SizedImage>(images: T[], cssPx: number): T | undefined {
  const sized = images
    .filter((i): i is T & { width: number } => i.width != null)
    .sort((a, b) => a.width - b.width)
  return sized.find((i) => i.width >= cssPx * 2) ?? sized.at(-1) ?? images[0]
}

export function srcSetOf(images: SizedImage[]): string | undefined {
  const parts = images.filter((i) => i.width != null).map((i) => `${i.url} ${i.width}w`)
  return parts.length ? parts.join(', ') : undefined
}

export function normalizeImages<T extends SizedImage>(images: unknown): T[] {
  if (!Array.isArray(images)) return []
  const list = (images as unknown[]).filter(
    (i): i is T => typeof (i as SizedImage | null)?.url === 'string'
  )
  if (list.every((i) => i.width == null)) return [...list].reverse()
  return [...list].sort((a, b) => (b.width ?? 0) - (a.width ?? 0))
}

export function normalizeTrack(track: Track): Track {
  const album = track.album as Track['album'] | undefined
  if (!album) return track
  return { ...track, album: { ...album, images: normalizeImages<Image>(album.images) } }
}
