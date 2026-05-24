import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Tooltip } from '../Tooltip'

describe('Tooltip', () => {
  it('renderiza os children corretamente', () => {
    render(
      <Tooltip content="Texto de ajuda">
        <button>Hover</button>
      </Tooltip>
    )
    expect(screen.getByText('Hover')).toBeInTheDocument()
  })

  it('renderiza o conteúdo do tooltip no documento (oculto via css)', () => {
    render(
      <Tooltip content="Texto de ajuda">
        <button>Hover</button>
      </Tooltip>
    )
    expect(screen.getByText('Texto de ajuda')).toBeInTheDocument()
  })

  it('aplica alinhamento start quando align="start"', () => {
    render(
      <Tooltip content="Nota" align="start">
        <span>trigger</span>
      </Tooltip>
    )
    const tip = screen.getByText('Nota')
    expect(tip.className).toContain('left-0')
    expect(tip.className).not.toContain('-translate-x-1/2')
  })

  it('aplica whitespace-normal e maxWidth quando maxWidth fornecido', () => {
    render(
      <Tooltip content="Nota longa" maxWidth="max-w-xs">
        <span>trigger</span>
      </Tooltip>
    )
    const tip = screen.getByText('Nota longa')
    expect(tip.className).toContain('whitespace-normal')
    expect(tip.className).toContain('max-w-xs')
  })

  it('aplica className no wrapper quando fornecido', () => {
    render(
      <Tooltip content="Nota" className="flex-1 min-w-0 block">
        <span>trigger</span>
      </Tooltip>
    )
    // wrapper é o span pai do tooltip content
    const wrapper = screen.getByText('trigger').parentElement
    expect(wrapper?.className).toContain('flex-1')
  })
})
