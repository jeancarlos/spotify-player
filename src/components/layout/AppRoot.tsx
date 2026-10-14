import { Outlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useCatalogHealth } from '@/hooks/useCatalogHealth'
import { PersistentVinylDisk } from '@/components/vinyl/PersistentVinylDisk'
import { LyricsPreloader } from './LyricsPreloader'
import { QueryErrorHandler } from './QueryErrorHandler'
import { MiniPlayer } from './MiniPlayer'

export function AppRoot() {
  const { t } = useTranslation()
  const { unavailable } = useCatalogHealth()

  return (
    <>
      <LyricsPreloader />
      <QueryErrorHandler />
      {unavailable && (
        <p
          role="status"
          className="fixed bottom-28 left-1/2 -translate-x-1/2 z-40 max-w-[90vw] rounded-full bg-amber-100 px-4 py-2 text-center text-xs text-amber-900 shadow"
        >
          {t('catalog.unavailable')}
        </p>
      )}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeInOut' }}
          className="h-full"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
      <PersistentVinylDisk />
      <AnimatePresence>
        <MiniPlayer key="mini-player" />
      </AnimatePresence>
    </>
  )
}
