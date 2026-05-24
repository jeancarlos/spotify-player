import { useCallback, useEffect } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Info, Music2, ListMusic } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { usePlayer } from '@/hooks/usePlayer'
import { useLyrics } from '@/hooks/queries/useLyrics'
import { useProgressEngine } from '@/hooks/useProgressEngine'
import { LyricsView } from '@/components/layout/LyricsView'
import { TrackInfoPanel } from '@/components/layout/TrackInfoPanel'
import { PlayerQueue } from '@/components/layout/PlayerQueue'
import { cn } from '@/lib/utils'
import api from '@/lib/axios'

type PlayerTab = 'lyrics' | 'info' | 'queue'

export function PlayerView() {
  const { state, dispatch } = usePlayer()
  const { currentTrack, duration } = state
  const { currentProgress, seekTo } = useProgressEngine()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { t } = useTranslation()

  const activeTab = (searchParams.get('tab') as PlayerTab) || 'lyrics'

  const handleTabChange = (tab: PlayerTab) => {
    setSearchParams({ tab }, { replace: true })
  }

  const artistName = currentTrack?.artists[0]?.name ?? ''
  const trackName = currentTrack?.name ?? ''
  const albumName = currentTrack?.album.name
  const lyrics = useLyrics({
    artist: artistName,
    title: trackName,
    album: albumName,
    durationMs: duration,
  })
  const albumArt = currentTrack?.album.images[0]?.url

  const noLyrics = !lyrics.isPending && (!lyrics.data || lyrics.data.length === 0)

  useEffect(() => {
    if (noLyrics && activeTab === 'lyrics') {
      setSearchParams({ tab: 'info' }, { replace: true })
    }
  }, [noLyrics, activeTab, setSearchParams])

  const handleSeek = useCallback(
    async (ms: number) => {
      dispatch({ type: 'SET_SEEK_TIME', payload: Date.now() })
      seekTo(ms)
      try {
        await api.put('/me/player/seek', null, {
          params: { position_ms: ms },
          responseType: 'text',
        })
      } catch {
        /* silent */
      }
    },
    [dispatch, seekTo]
  )

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
            const from = location.state?.from ?? '/'
            navigate(from)
          }}
          className="p-2.5 rounded-2xl glass hover:bg-white/10 transition-colors outline-none"
          aria-label={t('common.back')}
        >
          <ArrowLeft size={20} className="text-white" />
        </button>

        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
          {!noLyrics && (
            <button
              onClick={() => handleTabChange('lyrics')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-bold transition-all outline-none',
                activeTab === 'lyrics'
                  ? 'bg-white text-black shadow-lg'
                  : 'text-white/40 hover:text-white/70'
              )}
            >
              <Music2 size={14} className="shrink-0" />
              <span className="hidden min-[400px]:inline">{t('player.lyrics')}</span>
            </button>
          )}
          <button
            onClick={() => handleTabChange('info')}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-bold transition-all outline-none',
              activeTab === 'info'
                ? 'bg-white text-black shadow-lg'
                : 'text-white/40 hover:text-white/70'
            )}
          >
            <Info size={14} className="shrink-0" />
            <span className="hidden min-[400px]:inline">{t('track.songDetails')}</span>
          </button>
          <button
            onClick={() => handleTabChange('queue')}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-bold transition-all outline-none',
              activeTab === 'queue'
                ? 'bg-white text-black shadow-lg'
                : 'text-white/40 hover:text-white/70'
            )}
          >
            <ListMusic size={14} className="shrink-0" />
            <span className="hidden min-[400px]:inline">{t('player.queue')}</span>
          </button>
        </div>

        <div className="w-10" />
      </header>

      {/* Main Area */}
      <main className="relative z-10 flex-1 min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'info' ? (
            <motion.div
              key="info"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full overflow-y-auto pt-4 pb-12"
            >
              {currentTrack && <TrackInfoPanel track={currentTrack} />}
            </motion.div>
          ) : activeTab === 'queue' ? (
            <motion.div
              key="queue"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <PlayerQueue />
            </motion.div>
          ) : (
            <motion.div
              key="lyrics"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full flex flex-col"
            >
              {lyrics.isPending ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-white/30 text-sm animate-pulse">{t('lyrics.searching')}</p>
                </div>
              ) : (
                <LyricsView
                  lines={lyrics.data ?? []}
                  progress={currentProgress}
                  onSeek={handleSeek}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer spacing for MiniPlayer (which is in AppRoot) */}
      <div className="h-27 shrink-0" />
    </div>
  )
}
