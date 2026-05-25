import React, { createContext, useReducer, useEffect } from 'react'
import { uiReducer, initialUIState, type UIState, type UIAction } from './uiReducer'
import { STORAGE_KEYS } from '@/lib/storageKeys'
import i18n from '@/lib/i18n'

interface UIContextValue {
  state: UIState
  dispatch: React.Dispatch<UIAction>
}

export const UIContext = createContext<UIContextValue | null>(null)

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(uiReducer, initialUIState)

  useEffect(() => {
    if (i18n.language !== state.language) {
      void i18n.changeLanguage(state.language)
    }
    localStorage.setItem(STORAGE_KEYS.language, state.language)
  }, [state.language])

  return <UIContext.Provider value={{ state, dispatch }}>{children}</UIContext.Provider>
}
