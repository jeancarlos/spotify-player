import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { CustomTooltip } from '../ArtistChartTooltip'

describe('CustomTooltip visibility', () => {
  it('renders nothing when inactive', () => {
    const { container } = render(<CustomTooltip active={false} payload={[{}] as never} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing without a payload', () => {
    const { container } = render(<CustomTooltip active payload={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing with undefined payload', () => {
    const { container } = render(<CustomTooltip active />)
    expect(container).toBeEmptyDOMElement()
  })
})
