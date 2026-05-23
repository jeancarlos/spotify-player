import { useRegisterSW } from 'virtual:pwa-register/react'
import { useTranslation } from 'react-i18next'
import { X, RefreshCw } from 'lucide-react'

export function ReloadPrompt() {
  const { t } = useTranslation()
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  if (!offlineReady && !needRefresh) return null

  return (
    <div className="fixed bottom-24 right-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="glass-card p-4 flex flex-col gap-3 shadow-2xl border-white/20">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-bold text-black">
              {offlineReady ? 'Spoter' : t('pwa.updateAvailable')}
            </p>
            <p className="text-xs text-black/60 mt-0.5 leading-relaxed">
              {offlineReady 
                ? t('pwa.readyOffline') 
                : t('pwa.newVersion')}
            </p>
          </div>
          <button 
            onClick={close}
            className="p-1 rounded-lg hover:bg-black/5 transition-colors"
            aria-label={t('favorites.cancel')}
          >
            <X size={16} className="text-black/40" />
          </button>
        </div>
        
        {needRefresh && (
          <button
            onClick={() => updateServiceWorker(true)}
            className="flex items-center justify-center gap-2 w-full py-2 bg-black text-white text-xs font-bold rounded-xl hover:bg-black/80 transition-colors"
          >
            <RefreshCw size={14} />
            {t('pwa.reload')}
          </button>
        )}
      </div>
    </div>
  )
}
