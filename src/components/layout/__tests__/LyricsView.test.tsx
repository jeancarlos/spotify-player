import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LyricsView } from '../LyricsView'

beforeEach(() => {
  // jsdom não implementa scrollIntoView — mock necessário
  Element.prototype.scrollIntoView = vi.fn()
})

describe('LyricsView', () => {
  const lines = ['Primeira linha', 'Segunda linha', 'Terceira linha']

  it('renderiza todas as linhas fornecidas', () => {
    render(<LyricsView lines={lines} progress={0} duration={30000} />)
    expect(screen.getByText('Primeira linha')).toBeInTheDocument()
    expect(screen.getByText('Segunda linha')).toBeInTheDocument()
    expect(screen.getByText('Terceira linha')).toBeInTheDocument()
  })

  it('a primeira linha é ativa quando progress=0', () => {
    render(<LyricsView lines={lines} progress={0} duration={30000} />)
    // index = floor(0/30000 * 3) = 0
    expect(screen.getByText('Primeira linha')).toHaveClass('font-bold')
  })

  it('destaca a linha correta com font-bold com base no progresso', () => {
    render(<LyricsView lines={lines} progress={10000} duration={30000} />)
    // index = floor(10000/30000 * 3) = floor(1.0) = 1
    expect(screen.getByText('Segunda linha')).toHaveClass('font-bold')
  })

  it('a última linha é ativa ao fim da música', () => {
    render(<LyricsView lines={lines} progress={30000} duration={30000} />)
    // index = min(2, floor(30000/30000 * 3)) = min(2, 3) = 2
    expect(screen.getByText('Terceira linha')).toHaveClass('font-bold')
  })

  it('retorna null para array vazio sem erros', () => {
    const { container } = render(<LyricsView lines={[]} progress={0} duration={30000} />)
    expect(container.firstChild).toBeInTheDocument()
  })
})
