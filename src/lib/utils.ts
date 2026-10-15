import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import i18n from '@/lib/i18n'
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

const UNKNOWN_ID = '0'

function localizeUnknown<T extends { id: string; name: string }>(ref: T): T {
  return ref.id === UNKNOWN_ID ? { ...ref, name: i18n.t('common.unknown') } : ref
}

export function isStoredTrack(value: unknown): value is Track {
  const t = value as Record<string, unknown> | null
  return (
    typeof t?.uri === 'string' &&
    typeof t.name === 'string' &&
    Array.isArray(t.artists) &&
    typeof t.album === 'object' &&
    t.album !== null
  )
}

export function normalizeTrack(track: Track): Track {
  return {
    ...track,
    artists: track.artists.map(localizeUnknown),
    album: { ...localizeUnknown(track.album), images: normalizeImages<Image>(track.album.images) },
  }
}
