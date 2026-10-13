import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { deezer, DeezerError, DEEZER_TIMEOUT_CODE } from '@/lib/deezer'

type Callbacks = Record<string, ((data: unknown) => void) | undefined>
const callbacks = window as unknown as Callbacks

function lastScript(): HTMLScriptElement {
  const scripts = document.head.querySelectorAll<HTMLScriptElement>('script[src^="https://api.deezer.com/"]')
  return scripts[scripts.length - 1]
}

function callbackOf(script: HTMLScriptElement): string {
  return new URL(script.src).searchParams.get('callback') ?? ''
}

describe('deezer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    document.head.querySelectorAll('script').forEach((s) => {
      s.remove()
    })
  })

  it('resolves with the JSONP payload and removes script and callback', async () => {
    const promise = deezer('artist/0')
    const script = lastScript()
    const name = callbackOf(script)
    callbacks[name]?.({ data: [1, 2] })
    await expect(promise).resolves.toEqual({ data: [1, 2] })
    expect(script.isConnected).toBe(false)
    expect(callbacks[name]).toBeUndefined()
  })

  it('rejects with DeezerError carrying the code of an error body', async () => {
    const promise = deezer('artist/0')
    callbacks[callbackOf(lastScript())]?.({ error: { type: 'DataException', message: 'no data', code: 800 } })
    await expect(promise).rejects.toMatchObject({ name: 'DeezerError', code: 800, message: 'no data' })
  })

  it('rejects on timeout and tolerates a late response', async () => {
    const promise = deezer('search', { q: 'x' }, 1000)
    const script = lastScript()
    const name = callbackOf(script)
    vi.advanceTimersByTime(1000)
    await expect(promise).rejects.toEqual(new DeezerError(DEEZER_TIMEOUT_CODE, 'timeout'))
    expect(script.isConnected).toBe(false)
    expect(typeof callbacks[name]).toBe('function')
    expect(() => callbacks[name]?.({ data: [] })).not.toThrow()
    expect(callbacks[name]).toBeUndefined()
  })

  it('rejects when the script fails to load', async () => {
    const promise = deezer('search', { q: 'x' })
    const script = lastScript()
    script.dispatchEvent(new Event('error'))
    await expect(promise).rejects.toMatchObject({ code: DEEZER_TIMEOUT_CODE, message: 'network' })
    expect(script.isConnected).toBe(false)
  })

  it('encodes params, skips undefined ones and adds the JSONP params', () => {
    void deezer('search', { q: 'AC/DC & Ünïcode #1', index: 0, limit: undefined })
    const url = new URL(lastScript().src)
    expect(url.pathname).toBe('/search')
    expect(url.searchParams.get('q')).toBe('AC/DC & Ünïcode #1')
    expect(url.searchParams.get('index')).toBe('0')
    expect(url.searchParams.has('limit')).toBe(false)
    expect(url.searchParams.get('output')).toBe('jsonp')
    expect(url.searchParams.get('callback')).toMatch(/^__deezer_cb_/)
  })
})
