import { createContext, useContext, useReducer, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, AlertCircle, CheckCircle2, Info } from 'lucide-react'

/* ─── Types ─── */

type ToastVariant = 'error' | 'success' | 'info'

interface Toast {
  id: string
  message: string
  variant: ToastVariant
}

type ToastAction = { type: 'ADD'; payload: Toast } | { type: 'REMOVE'; payload: string }

/* ─── Context ─── */

interface ToastContextValue {
  toasts: Toast[]
  toast: (message: string, variant?: ToastVariant) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

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

/* ─── Provider ─── */

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, dispatch] = useReducer(toastReducer, [])

  const toast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = `${Date.now()}-${Math.random()}`
    dispatch({ type: 'ADD', payload: { id, message, variant } })
    setTimeout(() => dispatch({ type: 'REMOVE', payload: id }), 4500)
  }, [])

  const dismiss = useCallback((id: string) => {
    dispatch({ type: 'REMOVE', payload: id })
  }, [])

  const icons: Record<ToastVariant, React.ReactNode> = {
    error: <AlertCircle size={16} className="text-red-400 shrink-0" />,
    success: <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />,
    info: <Info size={16} className="text-blue-400 shrink-0" />,
  }

  const borders: Record<ToastVariant, string> = {
    error: 'border-red-500/30',
    success: 'border-emerald-500/30',
    info: 'border-blue-500/30',
  }

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}

      {/* Toast viewport */}
      <div className="fixed bottom-24 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl max-w-sm shadow-xl border ${borders[t.variant]}`}
              style={{ background: 'rgba(20,20,20,0.88)', backdropFilter: 'blur(16px)' }}
            >
              {icons[t.variant]}
              <p className="text-sm text-white/80 flex-1">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="text-white/30 hover:text-white/70 transition-colors ml-1"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

/* ─── Hook ─── */

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
