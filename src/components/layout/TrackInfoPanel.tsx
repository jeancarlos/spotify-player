import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAudioFeatures } from '@/hooks/queries/useAudioFeatures'
import { useArtist } from '@/hooks/queries/useArtist'
import { useTrackWikipedia } from '@/hooks/queries/useTrackWikipedia'
import { formatDuration } from '@/utils/formatDuration'
import { formatDate } from '@/utils/formatDate'
import type { AudioFeatures, SpotifyTrack } from '@/types/spotify'
import { MusicalProfileCharts } from '@/components/shared/MusicalProfileCharts'
import { StatCard } from '@/components/shared/StatCard'
import { MoodZone } from '@/components/shared/MoodZone'
import { TiltCover } from '@/components/shared/TiltCover'

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
    danceability: 0.25 + h(id, 0) * 0.65,
    energy: 0.25 + h(id, 1) * 0.65,
    valence: 0.15 + h(id, 2) * 0.70,
    acousticness: h(id, 3) * 0.85,
    speechiness: h(id, 4) * 0.25,
    instrumentalness: h(id, 5) * 0.60,
    liveness: 0.05 + h(id, 6) * 0.35,
    loudness: -18 + h(id, 7) * 14,
    tempo: 70 + h(id, 8) * 110,
    duration_ms: 0,
    key: Math.floor(h(id, 9) * 12),
    mode: h(id, 10) > 0.45 ? 1 : 0,
    time_signature: h(id, 11) > 0.25 ? 4 : 3,
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

  const realFeatures = features.data?.[0] ?? null
  const f: AudioFeatures = realFeatures ?? fakeFeatures(track.id)
  const hasRealFeatures = realFeatures !== null
  const genres: string[] = artist.data?.genres
    ? artist.data.genres.slice(0, 5)
    : fakeGenres(track.artists[0]?.id ?? track.id)

  return (
    <div>
      <div className="flex flex-col items-center gap-6 px-5 py-4">

        {/* Album art */}
        <TiltCover
          imageUrl={track.album.images[0]?.url}
          size={176}
          name={track.album.name}
        />

        {/* Track metadata */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>{track.name}</h2>
            {track.explicit && (
              <span className="text-[9px] font-black text-black bg-white/80 rounded px-1 py-0.5 shrink-0">E</span>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-1">
            {track.artists.map((a, i) => (
              <span key={a.id} className="flex items-center">
                <button
                  onClick={() => navigate(`/artists/${a.id}`)}
                  className="text-white/70 text-sm font-medium hover:text-white hover:underline cursor-pointer transition-colors outline-none focus:text-white focus:underline"
                >
                  {a.name}
                </button>
                {i < track.artists.length - 1 && (
                  <span className="text-white/30 text-sm font-medium ml-1">, </span>
                )}
              </span>
            ))}
          </div>
          <p className="text-white/35 text-xs">{track.album.name}</p>
        </div>

        {/* Lançamento + Duração */}
        <div className="flex justify-center gap-2.5 w-full max-w-sm">
          <StatCard label={t('track.releaseDate')} value={formatDate(track.album.release_date)} />
          <StatCard label={t('track.duration')} value={formatDuration(track.duration_ms)} />
        </div>

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


        {/* Genre tags */}
        <div className="flex flex-wrap justify-center gap-1.5">
          {genres.map(g => (
            <span key={g} className="text-[10px] px-2.5 py-1 rounded-xl bg-white/5 border border-white/5 text-white/60 capitalize font-medium hover:bg-white/10 transition-colors">
              {g}
            </span>
          ))}
        </div>

        {/* Radar + Feature bars */}
        {hasRealFeatures && <MusicalProfileCharts features={f} theme="dark" />}

        {/* Mood quadrant */}
        {hasRealFeatures && (
          <Section label={t('track.moodZone')}>
            <MoodZone valence={f.valence} energy={f.energy} theme="dark" />
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
