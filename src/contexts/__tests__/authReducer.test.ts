import { describe, it, expect } from 'vitest'
import { authReducer, initialAuthState } from '../AuthContext'

describe('authReducer', () => {
  it('SET_TOKENS atualiza os tokens e define isAuthenticated como true', () => {
    const state = authReducer(initialAuthState, {
      type: 'SET_TOKENS',
      payload: { accessToken: 'acc123', refreshToken: 'ref456' },
    })
    expect(state.accessToken).toBe('acc123')
    expect(state.refreshToken).toBe('ref456')
    expect(state.isAuthenticated).toBe(true)
  })

  it('SET_PROFILE atualiza o perfil sem alterar os tokens', () => {
    const comTokens = authReducer(initialAuthState, {
      type: 'SET_TOKENS',
      payload: { accessToken: 'acc', refreshToken: 'ref' },
    })
    const comPerfil = authReducer(comTokens, {
      type: 'SET_PROFILE',
      payload: {
        id: 'u1',
        display_name: 'Jean',
        email: 'jean@test.com',
        images: [],
        product: 'premium',
        followers: { total: 0 },
        country: 'BR',
      },
    })
    expect(comPerfil.profile?.display_name).toBe('Jean')
    expect(comPerfil.accessToken).toBe('acc')
  })

  it('LOGOUT redefine todo o estado para o valor inicial', () => {
    const autenticado = authReducer(initialAuthState, {
      type: 'SET_TOKENS',
      payload: { accessToken: 'acc', refreshToken: 'ref' },
    })
    const deslogado = authReducer(autenticado, { type: 'LOGOUT' })
    expect(deslogado).toEqual(initialAuthState)
  })
})
