import React, { createContext, useReducer } from 'react'
import { uiReducer, initialUIState } from './uiReducer'
import i18n from '@/lib/i18n'
import type { UIState, UIAction } from './uiReducer'

function uiReducerWithI18n(state: UIState, action: UIAction): UIState {
  if (action.type === 'SET_LANGUAGE') {
    i18n.changeLanguage(action.payload)
  }
  return uiReducer(state, action)
}

interface UIContextValue {
  state: UIState
  dispatch: React.Dispatch<UIAction>
}

export const UIContext = createContext<UIContextValue | null>(null)

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(uiReducerWithI18n, initialUIState)
  return <UIContext.Provider value={{ state, dispatch }}>{children}</UIContext.Provider>
}
