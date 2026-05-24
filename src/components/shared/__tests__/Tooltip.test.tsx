import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Tooltip } from '../Tooltip'

describe('Tooltip', () => {
  it('renders children correctly', () => {
    render(
      <Tooltip content="Helper text">
        <button>Hover me</button>
      </Tooltip>
    )
    expect(screen.getByText('Hover me')).toBeInTheDocument()
  })

  it('renders tooltip content in the document', () => {
    render(
      <Tooltip content="Helper text">
        <button>Hover me</button>
      </Tooltip>
    )
    // The content should be in the document (hidden via css classes)
    expect(screen.getByText('Helper text')).toBeInTheDocument()
  })
})
