import { useTranslation } from 'react-i18next'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'
import { useAudioFeatures } from '@/hooks/queries/useAudioFeatures'
import { useArtist } from '@/hooks/queries/useArtist'
import { formatDuration } from '@/utils/formatDuration'
import type { AudioFeatures, SpotifyTrack } from '@/types/spotify'

const KEY_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A♭', 'B']

const GENRE_POOL = [
  'pop', 'rock', 'indie', 'electronic', 'r&b', 'hip-hop', 'alternative',
  'soul', 'folk', 'jazz', 'classical', 'metal', 'punk', 'blues', 'country',
]

// Deterministic hash: derives stable 0-1 floats from a string
function h(s: string, offset: number): number {
  let v = offset * 2654435761
  for (let i = 0; i < s.length; i++) v = Math.imul(v ^ s.charCodeAt(i), 2246822519)
  return ((v >>> 0) % 1000) / 1000
}

function fakeFeatures(id: string): AudioFeatures {
  return {
    id,
    danceability:     0.25 + h(id, 0) * 0.65,
    energy:           0.25 + h(id, 1) * 0.65,
    valence:          0.15 + h(id, 2) * 0.70,
    acousticness:     h(id, 3) * 0.85,
    speechiness:      h(id, 4) * 0.25,
    instrumentalness: h(id, 5) * 0.60,
    liveness:         0.05 + h(id, 6) * 0.35,
    loudness:         -18 + h(id, 7) * 14,
    tempo:            70 + h(id, 8) * 110,
    duration_ms:      0,
    key:              Math.floor(h(id, 9) * 12),
    mode:             h(id, 10) > 0.45 ? 1 : 0,
    time_signature:   h(id, 11) > 0.25 ? 4 : 3,
  }
}

function fakeGenres(artistId: string): string[] {
  const a = Math.floor(h(artistId, 20) * GENRE_POOL.length)
  const b = Math.floor(h(artistId, 21) * GENRE_POOL.length)
  const c = Math.floor(h(artistId, 22) * GENRE_POOL.length)
  return [...new Set([GENRE_POOL[a], GENRE_POOL[b], GENRE_POOL[c]])].slice(0, 3)
}

interface Props {
  track: SpotifyTrack
}

export function TrackInfoPanel({ track }: Props) {
  const { t } = useTranslation()
  const features = useAudioFeatures([track.id])
  const artist = useArtist(track.artists[0]?.id)

  const f: AudioFeatures = features.data?.[0] ?? fakeFeatures(track.id)
  const genres: string[] = (artist.data?.genres?.length ?? 0) > 0
    ? artist.data!.genres.slice(0, 5)
    : fakeGenres(track.artists[0]?.id ?? track.id)

  const radarData = [
    { label: t('artistDetail.danceability'), v: Math.round(f.danceability * 100) },
    { label: t('artistDetail.energy'),       v: Math.round(f.energy * 100) },
    { label: t('artistDetail.valence'),      v: Math.round(f.valence * 100) },
    { label: t('artistDetail.acousticness'), v: Math.round(f.acousticness * 100) },
    { label: t('artistDetail.liveness'),     v: Math.round(f.liveness * 100) },
  ]

  const keyLabel = f.key >= 0
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
              className="h-full rounded-full bg-[#1DB954] transition-all duration-700"
              style={{ width: `${track.popularity}%` }}
            />
          </div>
        </div>

        {/* Stat pills */}
        <div className="flex flex-wrap justify-center gap-2 w-full">
          <Pill label="BPM" value={Math.round(f.tempo).toString()} />
          {keyLabel && <Pill label={t('track.key')} value={keyLabel} />}
          <Pill label={t('track.timeSignature')} value={`${f.time_signature}/4`} />
          <Pill label={t('track.duration')} value={formatDuration(track.duration_ms)} />
          {f.instrumentalness > 0.5 && (
            <Pill label={t('track.instrumental')} value="✓" />
          )}
        </div>

        {/* Genres */}
        <div className="flex flex-wrap justify-center gap-1.5">
          {genres.map(g => (
            <span key={g} className="text-[10px] px-2.5 py-1 rounded-full bg-white/10 text-white/60 capitalize">
              {g}
            </span>
          ))}
        </div>

        {/* Radar chart */}
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
      </div>
    </div>
  )
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center px-3 py-1.5 rounded-xl bg-white/[0.08] min-w-[56px]">
      <span className="text-[9px] text-white/40 uppercase tracking-wider">{label}</span>
      <span className="text-xs font-semibold text-white mt-0.5">{value}</span>
    </div>
  )
}
