import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Tooltip } from '../Tooltip'

describe('Tooltip', () => {
  it('renders children correctly', () => {
    render(
      <Tooltip content="Texto de ajuda">
        <button>Hover</button>
      </Tooltip>
    )
    expect(screen.getByText('Hover')).toBeInTheDocument()
  })

  it('renders tooltip content in the document (hidden via css)', () => {
    render(
      <Tooltip content="Texto de ajuda">
        <button>Hover</button>
      </Tooltip>
    )
    expect(screen.getByText('Texto de ajuda')).toBeInTheDocument()
  })

  it('applies start alignment when align="start"', () => {
    render(
      <Tooltip content="Nota" align="start">
        <span>trigger</span>
      </Tooltip>
    )
    const tip = screen.getByText('Nota')
    expect(tip.className).toContain('left-0')
    expect(tip.className).not.toContain('-translate-x-1/2')
  })

  it('applies whitespace-normal and maxWidth when maxWidth provided', () => {
    render(
      <Tooltip content="Nota longa" maxWidth="max-w-xs">
        <span>trigger</span>
      </Tooltip>
    )
    const tip = screen.getByText('Nota longa')
    expect(tip.className).toContain('whitespace-normal')
    expect(tip.className).toContain('max-w-xs')
  })

  it('applies className to wrapper when provided', () => {
    render(
      <Tooltip content="Nota" className="flex-1 min-w-0 block">
        <span>trigger</span>
      </Tooltip>
    )
    const wrapper = screen.getByText('trigger').parentElement
    expect(wrapper?.className).toContain('flex-1')
  })
})
