import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchBar } from '../SearchBar'

const setup = () => {
  render(<SearchBar onSearch={vi.fn()} />)
  return screen.getAllByRole('tab')
}

describe('SearchBar tablist', () => {
  it('gives every tab a 44 px tap target', () => {
    for (const tab of setup()) expect(tab).toHaveClass('tap-target')
  })

  it('makes only the selected tab tabbable', () => {
    const tabs = setup()
    expect(tabs.filter((t) => t.tabIndex === 0)).toHaveLength(1)
    expect(tabs.find((t) => t.tabIndex === 0)).toHaveAttribute('aria-selected', 'true')
  })

  it('moves focus and selection with the arrow keys, wrapping around', async () => {
    const user = userEvent.setup()
    const tabs = setup()
    const start = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true')
    tabs[start].focus()
    await user.keyboard('{ArrowRight}')
    const next = (start + 1) % tabs.length
    expect(tabs[next]).toHaveFocus()
    expect(tabs[next]).toHaveAttribute('aria-selected', 'true')
    expect(tabs.filter((t) => t.tabIndex === 0)).toHaveLength(1)
    await user.keyboard('{ArrowLeft}{ArrowLeft}')
    const prev = (start - 1 + tabs.length) % tabs.length
    expect(tabs[prev]).toHaveFocus()
    expect(tabs[prev]).toHaveAttribute('aria-selected', 'true')
  })

  it('jumps to the first and last tab with Home and End', async () => {
    const user = userEvent.setup()
    const tabs = setup()
    tabs[0].focus()
    await user.keyboard('{End}')
    expect(tabs[tabs.length - 1]).toHaveFocus()
    await user.keyboard('{Home}')
    expect(tabs[0]).toHaveFocus()
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
  })

  it('debounces typing into a search and switches tab on click', async () => {
    const onSearch = vi.fn()
    render(<SearchBar onSearch={onSearch} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'abba' } })
    expect(screen.getByTestId('search-spinner')).toBeInTheDocument()
    await waitFor(
      () => {
        expect(onSearch).toHaveBeenCalledWith('abba', 'artist')
      },
      { timeout: 2000 }
    )
    fireEvent.click(screen.getAllByRole('tab')[1])
    await waitFor(() => {
      expect(onSearch).toHaveBeenLastCalledWith('abba', 'album')
    })
    expect(screen.getByTestId('search-icon')).toBeInTheDocument()
  })

  it('ignores unrelated keys on a tab', () => {
    const tabs = setup()
    tabs[0].focus()
    fireEvent.keyDown(tabs[0], { key: 'x' })
    expect(tabs[0]).toHaveFocus()
  })
})
