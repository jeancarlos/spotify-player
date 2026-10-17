import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DeezerAttribution } from '../DeezerAttribution'

describe('DeezerAttribution', () => {
  it('links to deezer.com in a new tab by default', () => {
    render(<DeezerAttribution />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', 'https://www.deezer.com')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(link.querySelector('img')).toHaveAttribute('src', '/deezer-logo.png')
  })

  it('links to the entity page and shows the label when given', () => {
    render(<DeezerAttribution href="https://www.deezer.com/album/302127" label="Open on Deezer" />)
    const link = screen.getByRole('link', { name: 'Open on Deezer' })
    expect(link).toHaveAttribute('href', 'https://www.deezer.com/album/302127')
    expect(screen.getByText('Open on Deezer')).toBeVisible()
    expect(link).toHaveAttribute('title')
  })
})
