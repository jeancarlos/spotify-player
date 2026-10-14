import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SkipLink } from '../SkipLink'

describe('SkipLink', () => {
  it('links to the main content', () => {
    render(<SkipLink />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '#main-content')
  })
})
