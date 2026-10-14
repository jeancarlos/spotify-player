import { createContext, useContext, useReducer, useCallback, useRef, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { X, AlertCircle, CheckCircle2, Info } from 'lucide-react'

type ToastVariant = 'error' | 'success' | 'info'

interface Toast {
  id: string
  message: string
  variant: ToastVariant
}

type ToastAction = { type: 'ADD'; payload: Toast } | { type: 'REMOVE'; payload: string }

interface ToastActions {
  toast: (message: string, variant?: ToastVariant) => void
  dismiss: (id: string) => void
}

const ToastStateContext = createContext<Toast[]>([])
const ToastActionsContext = createContext<ToastActions | null>(null)

function toastReducer(state: Toast[], action: ToastAction): Toast[] {
  switch (action.type) {
    case 'ADD':
      return [...state, action.payload]
    case 'REMOVE':
      return state.filter((t) => t.id !== action.payload)
    default:
      return state
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, dispatch] = useReducer(toastReducer, [])
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const toast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = `${Date.now()}-${Math.random()}`
    dispatch({ type: 'ADD', payload: { id, message, variant } })
    timers.current.set(
      id,
      setTimeout(() => {
        timers.current.delete(id)
        dispatch({ type: 'REMOVE', payload: id })
      }, 4500)
    )
  }, [])

  const dismiss = useCallback((id: string) => {
    const timerId = timers.current.get(id)
    if (timerId !== undefined) {
      clearTimeout(timerId)
      timers.current.delete(id)
    }
    dispatch({ type: 'REMOVE', payload: id })
  }, [])

  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach(clearTimeout)
      pending.clear()
    }
  }, [])

  const actions = useMemo(() => ({ toast, dismiss }), [toast, dismiss])

  return (
    <ToastActionsContext.Provider value={actions}>
      <ToastStateContext.Provider value={toasts}>
        {children}
        <ToastList />
      </ToastStateContext.Provider>
    </ToastActionsContext.Provider>
  )
}

const icons: Record<ToastVariant, React.ReactNode> = {
  error: <AlertCircle size={16} className="text-red-400 shrink-0" />,
  success: <CheckCircle2 size={16} className="text-primary shrink-0" />,
  info: <Info size={16} className="text-blue-400 shrink-0" />,
}

const borders: Record<ToastVariant, string> = {
  error: 'border-red-500/30',
  success: 'border-primary/30',
  info: 'border-blue-500/30',
}

function ToastList() {
  const toasts = useContext(ToastStateContext)
  const { dismiss } = useToast()
  const { t } = useTranslation()
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-24 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((item) => (
          <motion.div
            key={item.id}
            role={item.variant === 'error' ? 'alert' : undefined}
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl max-w-sm shadow-xl border ${borders[item.variant]}`}
            style={{ background: 'rgba(20,20,20,0.88)', backdropFilter: 'blur(16px)' }}
          >
            {icons[item.variant]}
            <p className="text-sm text-white/80 flex-1">{item.message}</p>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              aria-label={t('common.dismissNotification')}
              className="text-white/60 hover:text-white/70 transition-colors ml-1 rounded focus-visible:outline-2 focus-visible:outline-white"
            >
              <X size={14} aria-hidden="true" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastActionsContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
