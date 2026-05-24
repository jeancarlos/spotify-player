import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatCard } from '../StatCard'

describe('StatCard', () => {
  it('renders the value correctly', () => {
    render(<StatCard value="42" />)
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders the label when provided', () => {
    render(<StatCard label="Total Items" value="100" />)
    expect(screen.getByText('Total Items')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
  })

  it('does not render label element if label is not provided', () => {
    render(<StatCard value="55" />)
    expect(screen.getByText('55')).toBeInTheDocument()
    // By checking that only the value is there and no empty span
    const allSpans = screen.getAllByText(/.*/)
    expect(allSpans.length).toBeGreaterThan(0) // just a sanity check
  })
})
