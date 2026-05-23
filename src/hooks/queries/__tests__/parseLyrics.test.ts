import { describe, it, expect } from 'vitest'
import { parseLyrics } from '../useLyrics'

describe('parseLyrics', () => {
  it('divide string por quebras de linha e remove linhas vazias', () => {
    const raw = 'Hello world\nThis is a song\n\nAnother line'
    expect(parseLyrics(raw)).toEqual(['Hello world', 'This is a song', 'Another line'])
  })

  it('remove espaços no início e fim de cada linha', () => {
    expect(parseLyrics('  linha 1  \n  linha 2  ')).toEqual(['linha 1', 'linha 2'])
  })

  it('retorna array vazio para string vazia', () => {
    expect(parseLyrics('')).toEqual([])
  })

  it('retorna array vazio para string apenas com espaços e quebras', () => {
    expect(parseLyrics('\n\n  \n')).toEqual([])
  })
})
