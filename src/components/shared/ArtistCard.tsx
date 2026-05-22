import { useNavigate } from 'react-router-dom'
import { Play } from 'lucide-react'
import { GlassCard } from './GlassCard'
import { formatNumber } from '@/utils/formatNumber'
import type { SpotifyArtist } from '@/types/spotify'

interface ArtistCardProps {
  artist: SpotifyArtist
  onPlay?: (artist: SpotifyArtist) => void
}

export function ArtistCard({ artist, onPlay }: ArtistCardProps) {
  const navigate = useNavigate()
  const image = artist.images[0]?.url

  return (
    <GlassCard className="w-44 flex flex-col gap-2 group" onClick={() => navigate(`/artists/${artist.id}`)}>
      <div className="relative w-full aspect-square rounded-xl overflow-hidden">
        {image ? (
          <img src={image} alt={artist.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-white/10 flex items-center justify-center">
            <span className="text-3xl text-white/30">{artist.name[0]}</span>
          </div>
        )}
        <div
          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          onClick={e => { e.stopPropagation(); onPlay?.(artist) }}
        >
          <Play size={28} className="text-white fill-white" />
        </div>
      </div>
      <div className="overflow-hidden">
        <p className="text-xs font-bold truncate">{artist.name}</p>
        <p className="text-xs text-white/40 truncate">
          {artist.genres.slice(0, 2).join(', ') || 'Unknown genre'}
        </p>
        <p className="text-xs text-white/30 mt-1">{formatNumber(artist.followers.total)} followers</p>
      </div>
    </GlassCard>
  )
}
