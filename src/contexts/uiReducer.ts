import { STORAGE_KEYS } from '@/lib/storageKeys'

export interface UIState {
  language: 'pt-BR' | 'en-US'
  sidebarOpen: boolean
}

export type UIAction =
  | { type: 'SET_LANGUAGE'; payload: 'pt-BR' | 'en-US' }
  | { type: 'OPEN_SIDEBAR' }
  | { type: 'CLOSE_SIDEBAR' }

export const initialUIState: UIState = {
  language: (localStorage.getItem(STORAGE_KEYS.language) ?? 'pt-BR') as 'pt-BR' | 'en-US',
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
