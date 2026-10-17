import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useTrackWikipedia } from '@/hooks/queries/useTrackWikipedia'
import { formatDuration } from '@/utils/formatDuration'
import { formatDate } from '@/utils/formatDate'
import type { Track } from '@/types/music'
import { StatCard } from '@/components/shared/StatCard'
import { TiltCover } from '@/components/shared/TiltCover'

interface Props {
  track: Track
}

export function TrackInfoPanel({ track }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const wikipedia = useTrackWikipedia(track.name, track.artists[0]?.name)

  return (
    <div>
      <div className="flex flex-col items-center gap-6 px-5 py-4 pb-20">
        <TiltCover images={track.album.images} size={176} name={track.album.name} />

        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <h2 className="font-sans text-xl font-bold text-white tracking-tight">{track.name}</h2>
            {track.explicit && (
              <span className="text-xs font-black text-black bg-white/80 rounded px-1 py-0.5 shrink-0">
                E
              </span>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-1">
            {track.artists.map((a, i) => (
              <span key={a.id} className="flex items-center">
                <button
                  onClick={() => {
                    void navigate(`/artists/${a.id}`)
                  }}
                  className="text-white/70 text-sm font-medium hover:text-white hover:underline cursor-pointer transition-colors rounded outline-none focus:text-white focus:underline focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  {a.name}
                </button>
                {i < track.artists.length - 1 && (
                  <span className="text-white/60 text-sm font-medium ml-1">, </span>
                )}
              </span>
            ))}
          </div>
          <p className="text-white/60 text-xs">{track.album.name}</p>
        </div>

        <div className="flex justify-center gap-2.5 w-full max-w-sm">
          {track.album.release_date && (
            <StatCard
              label={t('lyrics.releaseDate')}
              value={formatDate(track.album.release_date)}
            />
          )}
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
                className="text-xs text-white/60 hover:text-white/90 underline mt-2 inline-block transition-colors"
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
      <p className="text-xs text-white/60 uppercase tracking-[0.2em] font-bold mb-4 text-center">
        {label}
      </p>
      {children}
    </div>
  )
}
