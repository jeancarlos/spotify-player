import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useTranslation } from 'react-i18next'
import { X, RefreshCw } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

export function ReloadPrompt() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.warn('SW Registered: ' + (r?.scope ?? 'unknown'))
    },
    onRegisterError(error) {
      console.error('SW registration error', error)
    },
  })

  useEffect(() => {
    if (!offlineReady) return
    toast(t('pwa.readyOffline'), 'info')
    setOfflineReady(false)
  }, [offlineReady, setOfflineReady, toast, t])

  if (!needRefresh) return null

  return (
    <div className="fixed top-16 right-4 left-4 sm:left-auto z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="glass-card p-4 flex flex-col gap-3 shadow-2xl border-white/20">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-bold text-black">{t('pwa.updateAvailable')}</p>
            <p className="text-xs text-black/60 mt-0.5 leading-relaxed">{t('pwa.newVersion')}</p>
          </div>
          <button
            onClick={() => {
              setNeedRefresh(false)
            }}
            className="tap-target p-1 rounded-lg hover:bg-black/5 transition-colors"
            aria-label={t('favorites.cancel')}
          >
            <X size={16} className="text-black/60" />
          </button>
        </div>

        <button
          onClick={async () => updateServiceWorker(true)}
          className="flex items-center justify-center gap-2 w-full py-2 bg-primary text-ink text-xs font-bold rounded-xl hover:bg-primary/85 transition-colors"
        >
          <RefreshCw size={14} />
          {t('pwa.reload')}
        </button>
      </div>
    </div>
  )
}
