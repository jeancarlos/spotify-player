export interface UIState {
  language: 'pt-BR' | 'en-US'
  sidebarCollapsed: boolean
  sidebarOpen: boolean
}

export type UIAction =
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_LANGUAGE'; payload: 'pt-BR' | 'en-US' }
  | { type: 'OPEN_SIDEBAR' }
  | { type: 'CLOSE_SIDEBAR' }

export const initialUIState: UIState = {
  language: (localStorage.getItem('spoter_lang') as 'pt-BR' | 'en-US') ?? 'pt-BR',
  sidebarCollapsed: false,
  sidebarOpen: false,
}

export function uiReducer(state: UIState, action: UIAction): UIState {
  // Importação dinâmica para evitar dependência circular no teste
  // i18n é chamado como side effect no SET_LANGUAGE
  switch (action.type) {
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed }
    case 'SET_LANGUAGE': {
      localStorage.setItem('spoter_lang', action.payload)
      return { ...state, language: action.payload }
    }
    case 'OPEN_SIDEBAR':
      return { ...state, sidebarOpen: true }
    case 'CLOSE_SIDEBAR':
      return { ...state, sidebarOpen: false }
    default:
      return state
  }
}
