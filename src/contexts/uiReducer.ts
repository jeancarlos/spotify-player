import { STORAGE_KEYS } from '@/lib/storageKeys'

export interface UIState {
  language: 'pt-BR' | 'en-US'
  sidebarOpen: boolean
}

export type UIAction =
  | { type: 'SET_LANGUAGE'; payload: 'pt-BR' | 'en-US' }
  | { type: 'OPEN_SIDEBAR' }
  | { type: 'CLOSE_SIDEBAR' }

function readLanguage(): UIState['language'] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.language)
    return stored === 'en-US' ? stored : 'pt-BR'
  } catch {
    return 'pt-BR'
  }
}

export const initialUIState: UIState = {
  language: readLanguage(),
  sidebarOpen: false,
}

export function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload }
    case 'OPEN_SIDEBAR':
      return { ...state, sidebarOpen: true }
    case 'CLOSE_SIDEBAR':
      return { ...state, sidebarOpen: false }
    default:
      return state
  }
}
