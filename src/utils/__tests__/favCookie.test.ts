import { describe, it, expect, beforeEach } from 'vitest'
import { readFavCookie, writeFavCookie, type FavCookieEntry } from '@/utils/favCookie'

function clearCookies() {
  document.cookie.split(';').forEach((c) => {
    document.cookie = c.replace(/=.*/, '=;max-age=0;path=/')
  })
}

beforeEach(clearCookies)

const entry = (uri: string, note = ''): FavCookieEntry => ({ uri, note })

describe('readFavCookie', () => {
  it('retorna [] quando não há cookie', () => {
    expect(readFavCookie('u1')).toEqual([])
  })

  it('retorna entradas salvas', () => {
    writeFavCookie('u1', [entry('spotify:track:t1', 'ouço no gym')])
    const result = readFavCookie('u1')
    expect(result).toHaveLength(1)
    expect(result[0].uri).toBe('spotify:track:t1')
    expect(result[0].note).toBe('ouço no gym')
  })

  it('isola por userId', () => {
    writeFavCookie('u1', [entry('spotify:track:t1')])
    expect(readFavCookie('u2')).toHaveLength(0)
  })
})

describe('writeFavCookie', () => {
  it('trunca nota em 80 chars no cookie', () => {
    const longa = 'a'.repeat(120)
    writeFavCookie('u1', [entry('spotify:track:t1', longa)])
    const [saved] = readFavCookie('u1')
    expect(saved.note).toHaveLength(80)
  })

  it('sobrescreve cookie anterior', () => {
    writeFavCookie('u1', [entry('spotify:track:t1')])
    writeFavCookie('u1', [entry('spotify:track:t2')])
    const result = readFavCookie('u1')
    expect(result).toHaveLength(1)
    expect(result[0].uri).toBe('spotify:track:t2')
  })
})
