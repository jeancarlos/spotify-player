import { isPlayable } from '@/lib/deezerMappers'
import type { SpotifyTrack } from '@/types/spotify'

export interface ChartEntry {
  id: string
  label: string
  name: string
  artists: string
  albumName: string
  albumArt: string
  rank: number
  track: SpotifyTrack
}

export function toChartData(tracks: SpotifyTrack[]): ChartEntry[] {
  return tracks
    .filter((t): t is SpotifyTrack & { rank: number } => t.rank != null)
    .sort((a, b) => b.rank - a.rank)
    .slice(0, 10)
    .map((t) => ({
      id: t.id,
      label: t.name,
      name: t.name,
      artists: t.artists.map((a) => a.name).join(', '),
      albumName: t.album.name,
      albumArt: (t.album.images.at(1) ?? t.album.images.at(0))?.url ?? '',
      rank: t.rank,
      track: t,
    }))
}

export function playEntry(entry: ChartEntry, onPlay?: (track: SpotifyTrack) => void) {
  if (isPlayable(entry.track)) onPlay?.(entry.track)
}
