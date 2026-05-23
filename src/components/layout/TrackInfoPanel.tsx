import { useTranslation } from 'react-i18next'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'
import { useAudioFeatures } from '@/hooks/queries/useAudioFeatures'
import { useArtist } from '@/hooks/queries/useArtist'
import { formatDuration } from '@/utils/formatDuration'
import type { SpotifyTrack } from '@/types/spotify'

const KEY_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A♭', 'B']

interface Props {
  track: SpotifyTrack
}

export function TrackInfoPanel({ track }: Props) {
  const { t } = useTranslation()
  const features = useAudioFeatures([track.id])
  const artist = useArtist(track.artists[0]?.id)
  const f = features.data?.[0]

  const radarData = f ? [
    { label: t('artistDetail.danceability'), v: Math.round(f.danceability * 100) },
    { label: t('artistDetail.energy'),       v: Math.round(f.energy * 100) },
    { label: t('artistDetail.valence'),      v: Math.round(f.valence * 100) },
    { label: t('artistDetail.acousticness'), v: Math.round(f.acousticness * 100) },
    { label: t('artistDetail.liveness'),     v: Math.round(f.liveness * 100) },
  ] : []

  const keyLabel = f != null && f.key >= 0
    ? `${KEY_NAMES[f.key]} ${f.mode === 1 ? t('track.major') : t('track.minor')}`
    : null

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex flex-col items-center gap-5 px-6 py-6 pb-4">
        {/* Album art */}
        <img
          src={track.album.images[0]?.url}
          alt={track.album.name}
          className="w-44 h-44 rounded-2xl object-cover shadow-2xl shrink-0"
        />

        {/* Track metadata */}
        <div className="text-center space-y-0.5">
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-xl font-bold text-white">{track.name}</h2>
            {track.explicit && (
              <span className="text-[9px] font-bold text-black/70 bg-white/70 rounded px-1 py-0.5 shrink-0">E</span>
            )}
          </div>
          <p className="text-white/60 text-sm">{track.artists.map(a => a.name).join(', ')}</p>
          <p className="text-white/30 text-xs">{track.album.name}</p>
        </div>

        {/* Popularity bar */}
        <div className="w-full">
          <div className="flex justify-between text-[10px] text-white/40 mb-1">
            <span>{t('track.popularity')}</span>
            <span>{track.popularity}/100</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#1DB954]"
              style={{ width: `${track.popularity}%` }}
            />
          </div>
        </div>

        {/* Stat pills */}
        {f && (
          <div className="flex flex-wrap justify-center gap-2 w-full">
            <Pill label="BPM" value={Math.round(f.tempo).toString()} />
            {keyLabel && <Pill label={t('track.key')} value={keyLabel} />}
            <Pill label={t('track.timeSignature')} value={`${f.time_signature}/4`} />
            <Pill label={t('track.duration')} value={formatDuration(track.duration_ms)} />
            {f.instrumentalness > 0.5 && (
              <Pill label={t('track.instrumental')} value="✓" />
            )}
          </div>
        )}

        {/* Genres */}
        {artist.data?.genres && artist.data.genres.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5">
            {artist.data.genres.slice(0, 5).map(g => (
              <span key={g} className="text-[10px] px-2.5 py-1 rounded-full bg-white/10 text-white/60 capitalize">
                {g}
              </span>
            ))}
          </div>
        )}

        {/* Radar chart */}
        {radarData.length > 0 && (
          <div className="w-full">
            <p className="text-[10px] text-white/30 text-center mb-1 uppercase tracking-widest">
              {t('artistDetail.audioProfile')}
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis
                  dataKey="label"
                  tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 10 }}
                />
                <Radar
                  dataKey="v"
                  stroke="#1DB954"
                  fill="#1DB954"
                  fillOpacity={0.2}
                  strokeWidth={1.5}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(0,0,0,0.8)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    fontSize: 11,
                    color: '#fff',
                  }}
                  formatter={(v: number) => [`${v}%`]}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center px-3 py-1.5 rounded-xl bg-white/8 min-w-[56px]">
      <span className="text-[9px] text-white/40 uppercase tracking-wider">{label}</span>
      <span className="text-xs font-semibold text-white mt-0.5">{value}</span>
    </div>
  )
}
