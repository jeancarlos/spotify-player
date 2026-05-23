import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SpotifyTrack } from '@/types/spotify'

interface VinylCardProps {
  track: SpotifyTrack
  isActive?: boolean
  isFavorite?: boolean
  onPlay?: (track: SpotifyTrack) => void
  onFavorite?: (track: SpotifyTrack) => void
  size?: 'sm' | 'md'
}

export function VinylCard({
  track,
  isActive = false,
  isFavorite = false,
  onPlay,
  onFavorite,
  size = 'md',
}: VinylCardProps) {
  const dim = size === 'sm' ? 80 : 104

  return (
    <div
      className={cn(
        'glass-card relative cursor-pointer overflow-hidden group',
        isActive && 'ring-2 ring-black/30'
      )}
      style={{ width: dim, height: dim, borderRadius: 14, padding: 0 }}
      onClick={() => onPlay?.(track)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onPlay?.(track)}
      aria-label={`Tocar ${track.name}`}
    >
      <img
        src={track.album.images[0]?.url ?? ''}
        alt={track.album.name}
        className="w-full h-full object-cover"
        draggable={false}
      />

      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex flex-col justify-end p-1.5 opacity-0 group-hover:opacity-100">
        <p className="text-white text-[10px] font-semibold truncate leading-tight">{track.name}</p>
        <p className="text-white/70 text-[9px] truncate">
          {track.artists.map(a => a.name).join(', ')}
        </p>
      </div>

      {/* Heart button */}
      {onFavorite && (
        <button
          className="absolute top-1 right-1 p-1 rounded-full bg-white/70 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
          onClick={e => { e.stopPropagation(); onFavorite(track) }}
          aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <Heart
            size={10}
            className={cn(isFavorite ? 'fill-black text-black' : 'text-black/60')}
          />
        </button>
      )}
    </div>
  )
}
