import { GlassCard } from './GlassCard'
import type { SpotifyAlbumSimple } from '@/types/spotify'

interface AlbumCardProps {
  album: SpotifyAlbumSimple
}

export function AlbumCard({ album }: AlbumCardProps) {
  const image = album.images[0]?.url
  const year = album.release_date.slice(0, 4)

  return (
    <GlassCard className="w-40 flex flex-col gap-2 shrink-0">
      <div className="relative w-full aspect-square rounded-xl overflow-hidden">
        {image && <img src={image} alt={album.name} className="w-full h-full object-cover" />}
      </div>
      <div className="overflow-hidden">
        <p className="text-xs font-bold truncate">{album.name}</p>
        <p className="text-xs text-white/50 truncate">
          {album.artists.map(a => a.name).join(', ')}
        </p>
        <p className="text-xs text-white/30 mt-1">{year}</p>
      </div>
    </GlassCard>
  )
}
