import { isPlayable } from '@/lib/deezerMappers'
import type { Image, Track } from '@/types/music'

export interface ChartEntry {
  id: string
  label: string
  name: string
  artists: string
  albumName: string
  albumImages: Image[]
  rank: number
  track: Track
}

export function toChartData(tracks: Track[]): ChartEntry[] {
  return tracks
    .filter((t): t is Track & { rank: number } => t.rank != null)
    .sort((a, b) => b.rank - a.rank)
    .slice(0, 10)
    .map((t) => ({
      id: t.id,
      label: t.name,
      name: t.name,
      artists: t.artists.map((a) => a.name).join(', '),
      albumName: t.album.name,
      albumImages: t.album.images,
      rank: t.rank,
      track: t,
    }))
}

export function playEntry(entry: ChartEntry, onPlay?: (track: Track) => void) {
  if (isPlayable(entry.track)) onPlay?.(entry.track)
}

const PAGE_GUTTER = 48

export function chartLayout(viewportWidth: number) {
  const narrow = viewportWidth < 640
  const margin = narrow
    ? { top: 4, right: 40, bottom: 4, left: 0 }
    : { top: 4, right: 64, bottom: 4, left: 8 }
  const yAxisWidth = narrow ? 96 : 144
  const labelChars = narrow ? 11 : 20
  const plotWidth = viewportWidth - PAGE_GUTTER - margin.left - margin.right - yAxisWidth
  return { margin, yAxisWidth, labelChars, plotWidth }
}
