import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SpotifyTrack } from '@/types/spotify'

// Djb2-like hash — produz número estável para o mesmo trackId entre renders
function seededFraction(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0
  return (Math.abs(h) % 1000) / 1000
}

// Estimativa de streams baseada no campo popularity (0-100) do Spotify.
// Pop 100 ≈ 1B, pop 80 ≈ 80M, pop 60 ≈ 6M, pop 40 ≈ 500K.
// Quando popularity === 0 (não informado), usa número aleatório seeded pelo id.
function estimateStreams(popularity: number, trackId: string): number {
  if (popularity === 0) {
    return Math.round(1_500_000 + seededFraction(trackId) * 18_500_000)
  }
  return Math.round(Math.pow(10, 3.5 + (popularity / 100) * 5.5))
}

function formatStreams(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${Math.round(n / 1_000_000)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return n.toLocaleString()
}

interface Props {
  tracks: SpotifyTrack[]
  activeTrackId?: string
  onPlay?: (track: SpotifyTrack) => void
}

export function ArtistTopTracksChart({ tracks, activeTrackId, onPlay }: Props) {
  const sorted = useMemo(
    () =>
      [...tracks]
        .slice(0, 10)
        .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0)),
    [tracks]
  )

  const streamValues = useMemo(
    () => sorted.map((t) => estimateStreams(t.popularity ?? 0, t.id)),
    [sorted]
  )

  const maxStreams = useMemo(() => Math.max(...streamValues, 1), [streamValues])

  return (
    <div className="space-y-0.5">
      {sorted.map((track, i) => {
        const streamCount = streamValues[i]
        const barPct = (streamCount / maxStreams) * 100
        const isActive = track.id === activeTrackId
        const isTop = i === 0

        return (
          <motion.div
            key={track.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.045, duration: 0.38, ease: [0.25, 0.1, 0.25, 1] }}
            className={cn(
              'relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer group overflow-hidden',
              isActive ? 'bg-black/[0.06]' : 'hover:bg-black/[0.025] transition-colors duration-150'
            )}
            onClick={() => onPlay?.(track)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onPlay?.(track)
              }
            }}
          >
            {/* Barra de fundo animada — largura proporcional aos streams estimados */}
            <motion.div
              className="absolute inset-y-0 left-0 rounded-xl"
              style={{
                background: isTop
                  ? 'linear-gradient(to right, rgba(0,0,0,0.09), rgba(0,0,0,0.02))'
                  : 'linear-gradient(to right, rgba(0,0,0,0.06), rgba(0,0,0,0.01))',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${barPct}%` }}
              transition={{
                delay: i * 0.045 + 0.18,
                duration: 0.65,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            />

            {/* Número de ranking */}
            <span
              className={cn(
                'relative w-5 shrink-0 text-[10px] font-black tabular-nums text-right transition-colors',
                isTop
                  ? 'text-black/50 group-hover:text-black/70'
                  : 'text-black/20 group-hover:text-black/40'
              )}
            >
              {String(i + 1).padStart(2, '0')}
            </span>

            {/* Capa do álbum com overlay de play */}
            <div className="relative shrink-0 w-9 h-9">
              <img
                src={track.album.images[1]?.url ?? track.album.images[0]?.url}
                alt=""
                className="w-9 h-9 rounded-lg object-cover shadow-sm"
              />
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <Play size={13} className="fill-white text-white ml-0.5" />
              </div>
            </div>

            {/* Nome e artistas */}
            <div className="relative flex-1 min-w-0">
              <p
                className={cn(
                  'text-sm font-semibold truncate leading-tight',
                  isActive ? 'text-black' : 'text-black/80'
                )}
              >
                {track.name}
              </p>
              <p className="text-[11px] text-black/40 truncate mt-0.5">
                {track.artists.map((a) => a.name).join(', ')}
              </p>
            </div>

            {/* Contagem de streams estimada */}
            <div className="relative shrink-0 text-right">
              <span className="block text-[11px] font-bold tabular-nums text-black/30 group-hover:text-black/55 transition-colors leading-none">
                {formatStreams(streamCount)}
              </span>
              <span className="block text-[9px] text-black/20 leading-none mt-0.5 uppercase tracking-wide">
                streams
              </span>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
