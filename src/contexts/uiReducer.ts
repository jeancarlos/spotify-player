export interface UIState {
  language: 'pt-BR' | 'en-US'
  sidebarCollapsed: boolean
}

export type UIAction =
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_LANGUAGE'; payload: 'pt-BR' | 'en-US' }

export const initialUIState: UIState = {
  language: (localStorage.getItem('spoter_lang') as 'pt-BR' | 'en-US') ?? 'pt-BR',
  sidebarCollapsed: false,
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
    default:
      return state
  }
}
