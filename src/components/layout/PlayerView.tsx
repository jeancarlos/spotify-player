import { useEffect } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Info, Music2, ListMusic } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { usePlayer } from '@/contexts/PlayerContext'
import { useLyrics } from '@/hooks/queries/useLyrics'
import { LyricsView } from '@/components/layout/LyricsView'
import { TrackInfoPanel } from '@/components/layout/TrackInfoPanel'
import { PlayerQueue } from '@/components/layout/PlayerQueue'
import { cn } from '@/lib/utils'
import { getFromPath } from '@/utils/routerState'
import { DeezerAttribution } from '@/components/shared/DeezerAttribution'
import type { Track } from '@/types/music'
import type { UseQueryResult } from '@tanstack/react-query'

type PlayerTab = 'lyrics' | 'info' | 'queue'

interface TrackFields {
  artistName: string
  trackName: string
  albumName: string | undefined
  albumArt: string | undefined
}

function extractTrackFields(track: Track | null): TrackFields {
  if (!track) {
    return { artistName: '', trackName: '', albumName: undefined, albumArt: undefined }
  }
  return {
    artistName: track.artists[0]?.name ?? '',
    trackName: track.name,
    albumName: track.album.name,
    albumArt: track.album.images[0]?.url,
  }
}

function useTabRedirect(
  noLyrics: boolean,
  activeTab: PlayerTab,
  setSearchParams: ReturnType<typeof useSearchParams>[1],
  state: unknown
) {
  useEffect(() => {
    if (noLyrics && activeTab === 'lyrics') {
      setSearchParams({ tab: 'info' }, { replace: true, state })
    }
  }, [noLyrics, activeTab, setSearchParams, state])
}

interface PlayerTabBarProps {
  activeTab: PlayerTab
  noLyrics: boolean
  onTabChange: (tab: PlayerTab) => void
}

function PlayerTabBar({ activeTab, noLyrics, onTabChange }: PlayerTabBarProps) {
  const { t } = useTranslation()
  const tabClass = (tab: PlayerTab) =>
    cn(
      'flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-bold transition-all outline-none focus-visible:ring-2 focus-visible:ring-white/60',
      activeTab === tab ? 'bg-white text-black shadow-lg' : 'text-white/60 hover:text-white/70'
    )
  return (
    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
      {!noLyrics && (
        <button
          onClick={() => {
            onTabChange('lyrics')
          }}
          aria-label={t('player.lyrics')}
          className={tabClass('lyrics')}
        >
          <Music2 size={14} className="shrink-0" />
          <span className="hidden min-[400px]:inline">{t('player.lyrics')}</span>
        </button>
      )}
      <button
        onClick={() => {
          onTabChange('info')
        }}
        aria-label={t('track.songDetails')}
        className={tabClass('info')}
      >
        <Info size={14} className="shrink-0" />
        <span className="hidden min-[400px]:inline">{t('track.songDetails')}</span>
      </button>
      <button
        onClick={() => {
          onTabChange('queue')
        }}
        aria-label={t('player.queue')}
        className={tabClass('queue')}
      >
        <ListMusic size={14} className="shrink-0" />
        <span className="hidden min-[400px]:inline">{t('player.queue')}</span>
      </button>
    </div>
  )
}

interface PlayerContentPaneProps {
  activeTab: PlayerTab
  currentTrack: Track | null
  lyrics: UseQueryResult<string[]>
}

function PlayerContentPane({ activeTab, currentTrack, lyrics }: PlayerContentPaneProps) {
  const { t } = useTranslation()

  if (!currentTrack) {
    return (
      <div className="h-full flex items-center justify-center px-8">
        <p className="text-white/60 text-sm text-center">{t('player.noTrack')}</p>
      </div>
    )
  }

  if (activeTab === 'info') {
    return (
      <motion.div
        key="info"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="h-full overflow-y-auto pt-4 pb-40"
      >
        <TrackInfoPanel track={currentTrack} />
      </motion.div>
    )
  }

  if (activeTab === 'queue') {
    return (
      <motion.div
        key="queue"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="h-full"
      >
        <PlayerQueue />
      </motion.div>
    )
  }

  return (
    <motion.div
      key="lyrics"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="h-full flex flex-col"
    >
      {lyrics.isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white/60 text-sm animate-pulse">{t('lyrics.searching')}</p>
        </div>
      ) : (
        <LyricsView lines={lyrics.data ?? []} />
      )}
    </motion.div>
  )
}

export function PlayerView() {
  const { state } = usePlayer()
  const { currentTrack } = state
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  const activeTab = (searchParams.get('tab') ?? 'lyrics') as PlayerTab

  const handleTabChange = (tab: PlayerTab) => {
    setSearchParams({ tab }, { replace: true, state: location.state as unknown })
  }

  const { artistName, trackName, albumName, albumArt } = extractTrackFields(currentTrack)
  const lyrics = useLyrics({
    artist: artistName,
    title: trackName,
    album: albumName,
    durationMs: currentTrack?.duration_ms ?? 0,
  })

  const noLyrics = !lyrics.isLoading && (!lyrics.data || lyrics.data.length === 0)

  useTabRedirect(noLyrics, activeTab, setSearchParams, location.state as unknown)

  return (
    <div className="relative h-screen bg-black overflow-hidden flex flex-col">
      {albumArt && (
        <div
          className="absolute inset-0 opacity-40 pointer-events-none z-0"
          style={{
            backgroundImage: `url(${albumArt})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(100px)',
            transform: 'scale(1.3)',
          }}
        />
      )}
      <div className="absolute inset-0 bg-black/70 pointer-events-none z-0" />

      <header className="relative z-20 flex items-center justify-between p-6 shrink-0">
        <button
          onClick={() => {
            navigate(getFromPath(location.state))
          }}
          className="p-2.5 rounded-2xl glass hover:bg-white/10 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          aria-label={t('common.back')}
        >
          <ArrowLeft size={20} className="text-white" />
        </button>

        <PlayerTabBar activeTab={activeTab} noLyrics={noLyrics} onTabChange={handleTabChange} />

        <DeezerAttribution className="rounded bg-white px-2 py-1" />
      </header>

      <main className="relative z-10 flex-1 min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <PlayerContentPane
            activeTab={activeTab}
            currentTrack={currentTrack}
            lyrics={lyrics}
          />
        </AnimatePresence>
      </main>

      <div className="h-27 shrink-0" />
    </div>
  )
}
