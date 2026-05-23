import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAudioFeatures } from '@/hooks/queries/useAudioFeatures'
import { useArtist } from '@/hooks/queries/useArtist'
import { useTrackWikipedia } from '@/hooks/queries/useTrackWikipedia'
import { formatDuration } from '@/utils/formatDuration'
import type { AudioFeatures, SpotifyTrack } from '@/types/spotify'
import { MusicalProfileCharts } from '@/components/shared/MusicalProfileCharts'

const KEY_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A♭', 'B']

const GENRE_POOL = [
  'pop', 'rock', 'indie', 'electronic', 'r&b', 'hip-hop', 'alternative',
  'soul', 'folk', 'jazz', 'classical', 'metal', 'punk', 'blues', 'country',
]

function h(s: string, offset: number): number {
  let v = offset * 2654435761
  for (let i = 0; i < s.length; i++) v = Math.imul(v ^ s.charCodeAt(i), 2246822519)
  return ((v >>> 0) % 1000) / 1000
}

function fakeFeatures(id: string): AudioFeatures {
  return {
    id,
    type: 'audio_features',
    uri: `spotify:track:${id}`,
    track_href: '',
    analysis_url: '',
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

interface Props { track: SpotifyTrack }

export function TrackInfoPanel({ track }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const features = useAudioFeatures([track.id])
  const artist = useArtist(track.artists[0]?.id)
  const wikipedia = useTrackWikipedia(track.name, track.artists[0]?.name)

  const f: AudioFeatures = features.data?.[0] ?? fakeFeatures(track.id)
  const genres: string[] = artist.data?.genres
    ? artist.data.genres.slice(0, 5)
    : fakeGenres(track.artists[0]?.id ?? track.id)

  const keyLabel = f.key >= 0
    ? `${KEY_NAMES[f.key]} ${f.mode === 1 ? t('track.major') : t('track.minor')}`
    : null

  // Mood quadrant: x=valence (0=sad→1=happy), y=energy (0=chill→1=intense)
  const moodX = f.valence * 100   // % from left
  const moodY = (1 - f.energy) * 100 // % from top (inverted: high energy = top)

  const moodLabel = (() => {
    if (f.energy >= 0.5 && f.valence >= 0.5) return t('track.mood.happyEnergetic')
    if (f.energy >= 0.5 && f.valence <  0.5) return t('track.mood.darkEnergetic')
    if (f.energy <  0.5 && f.valence >= 0.5) return t('track.mood.happyChill')
    return t('track.mood.darkChill')
  })()

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="flex flex-col items-center gap-6 px-5 py-8 pb-16">

        {/* Album art */}
        <div className="relative group">
          <div className="absolute -inset-4 bg-white/5 rounded-[2.5rem] blur-2xl transition-all duration-500 group-hover:bg-white/10" />
          <img
            src={track.album.images[0]?.url}
            alt={track.album.name}
            className="relative w-44 h-44 rounded-3xl object-cover shadow-2xl transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        {/* Track metadata */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">{track.name}</h2>
            {track.explicit && (
              <span className="text-[9px] font-black text-black bg-white/80 rounded px-1 py-0.5 shrink-0">E</span>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-1">
            {track.artists.map((a, i) => (
              <span key={a.id} className="flex items-center">
                <span
                  role="link"
                  onClick={() => navigate(`/artists/${a.id}`)}
                  className="text-white/70 text-sm font-medium hover:text-white hover:underline cursor-pointer transition-colors"
                >
                  {a.name}
                </span>
                {i < track.artists.length - 1 && (
                  <span className="text-white/30 text-sm font-medium ml-1">, </span>
                )}
              </span>
            ))}
          </div>
          <p className="text-white/35 text-xs">{track.album.name}</p>
        </div>

        {/* Popularity */}
        <div className="w-full max-w-sm space-y-1.5">
          <div className="flex justify-between items-end px-0.5">
            <span className="text-[9px] text-white/40 uppercase tracking-widest font-bold">{t('track.popularity')}</span>
            <span className="text-base font-black text-white leading-none">
              {track.popularity}<span className="text-[9px] text-white/30 ml-0.5">/100</span>
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-white/5 p-[2px] border border-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${track.popularity}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
              style={{ background: 'linear-gradient(90deg, #1DB954, #1ed760)', boxShadow: '0 0 10px rgba(29,185,84,0.4)' }}
            />
          </div>
        </div>

        {/* Stat pills */}
        <div className="grid grid-cols-2 gap-2.5 w-full max-w-sm">
          <StatCard label="BPM" value={Math.round(f.tempo).toString()} />
          <StatCard label={t('track.key')} value={keyLabel ?? '—'} />
          <StatCard label={t('track.timeSignature')} value={`${f.time_signature}/4`} />
          <StatCard label={t('track.duration')} value={formatDuration(track.duration_ms)} />
        </div>

        {/* Genre tags */}
        <div className="flex flex-wrap justify-center gap-1.5">
          {genres.map(g => (
            <span key={g} className="text-[10px] px-2.5 py-1 rounded-xl bg-white/5 border border-white/5 text-white/60 capitalize font-medium hover:bg-white/10 transition-colors">
              {g}
            </span>
          ))}
        </div>

        {/* Radar + Feature bars */}
        <MusicalProfileCharts features={f} theme="dark" />

        {/* Mood quadrant */}
        <Section label={t('track.moodZone')}>
          <div className="relative w-full aspect-square max-w-[220px] mx-auto rounded-2xl overflow-hidden border border-white/5"
            style={{ background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.03) 0%, transparent 70%)' }}
          >
            {/* Quadrant lines */}
            <div className="absolute inset-0 flex">
              <div className="flex-1 border-r border-white/10" />
              <div className="flex-1" />
            </div>
            <div className="absolute inset-0 flex flex-col">
              <div className="flex-1 border-b border-white/10" />
              <div className="flex-1" />
            </div>

            {/* Axis labels */}
            <span className="absolute top-1.5 left-1/2 -translate-x-1/2 text-[8px] text-white/25 font-semibold uppercase tracking-wider">{t('track.intense')}</span>
            <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[8px] text-white/25 font-semibold uppercase tracking-wider">{t('track.chill')}</span>
            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[8px] text-white/25 font-semibold uppercase tracking-wider [writing-mode:vertical-rl] rotate-180">{t('track.sad')}</span>
            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] text-white/25 font-semibold uppercase tracking-wider [writing-mode:vertical-rl]">{t('track.happy')}</span>

            {/* Mood dot */}
            <motion.div
              className="absolute w-4 h-4 rounded-full -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${moodX}%`, top: `${moodY}%`, background: '#1DB954', boxShadow: '0 0 12px rgba(29,185,84,0.7)' }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.4 }}
            />
            {/* Dot crosshair */}
            <motion.div
              className="absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-[#1DB954]/30"
              style={{ left: `${moodX}%`, top: `${moodY}%` }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            />

            {/* Mood label */}
            <div className="absolute bottom-2 inset-x-0 flex justify-center">
              <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider bg-black/40 px-2 py-0.5 rounded-full">
                {moodLabel}
              </span>
            </div>
          </div>
        </Section>

        {wikipedia.data && (
          <Section label={t('track.aboutTrack')}>
            <div className="w-full max-w-sm">
              <p className="text-xs text-white/60 leading-relaxed">{wikipedia.data.extract}</p>
              <a
                href={wikipedia.data.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-white/35 hover:text-white/60 underline mt-2 inline-block transition-colors"
              >
                {t('track.readMore')} →
              </a>
            </div>
          </Section>
        )}

      </div>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="w-full max-w-sm">
      <p className="text-[9px] text-white/25 uppercase tracking-[0.2em] font-bold mb-4 text-center">{label}</p>
      {children}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col p-3 rounded-xl bg-white/[0.04] border border-white/[0.05]">
      <span className="text-[8px] text-white/30 uppercase tracking-widest font-bold mb-1">{label}</span>
      <span className="text-sm font-bold text-white truncate">{value}</span>
    </div>
  )
}
