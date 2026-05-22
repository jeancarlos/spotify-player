import { describe, it, expect } from 'vitest'
import { generateCodeVerifier, generateCodeChallenge, generateState } from '../pkce'

describe('generateCodeVerifier', () => {
  it('retorna uma string com o tamanho especificado', () => {
    const v = generateCodeVerifier(128)
    expect(v).toHaveLength(128)
  })

  it('contém apenas caracteres URL-safe', () => {
    const v = generateCodeVerifier(128)
    expect(v).toMatch(/^[A-Za-z0-9\-._~]+$/)
  })

  it('gera valores diferentes a cada chamada', () => {
    expect(generateCodeVerifier(64)).not.toBe(generateCodeVerifier(64))
  })
})

describe('generateState', () => {
  it('retorna uma string hexadecimal com o tamanho correto', () => {
    const s = generateState(16)
    expect(s).toHaveLength(32)
  })

  it('gera valores diferentes a cada chamada', () => {
    expect(generateState()).not.toBe(generateState())
  })
})

describe('generateCodeChallenge', () => {
  it('retorna uma string não-vazia', async () => {
    const verifier = generateCodeVerifier(128)
    const challenge = await generateCodeChallenge(verifier)
    expect(challenge.length).toBeGreaterThan(0)
  })

  it('é determinístico para o mesmo verifier', async () => {
    const verifier = 'test-verifier-string-abc123'
    const c1 = await generateCodeChallenge(verifier)
    const c2 = await generateCodeChallenge(verifier)
    expect(c1).toBe(c2)
  })

  it('contém apenas caracteres base64 URL-safe', async () => {
    const verifier = generateCodeVerifier(128)
    const challenge = await generateCodeChallenge(verifier)
    expect(challenge).toMatch(/^[A-Za-z0-9\-_]+$/)
  })
})
