import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { FlippableCover } from '../FlippableCover'

vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>()
  return {
    ...actual,
    useSpring: (v: unknown) => v,
    motion: {
      ...actual.motion,
      div: ({ children, ...props }: React.ComponentProps<'div'>) =>
        <div {...props}>{children}</div>,
    },
  }
})

describe('FlippableCover', () => {
  it('renderiza imagem da frente', () => {
    render(<FlippableCover frontUrl="https://img/front.jpg" size={200} name="Abbey Road" />)
    expect(screen.getByAltText('Abbey Road')).toBeInTheDocument()
  })

  it('modo flip: renderiza frente e verso quando backUrl é fornecido', () => {
    render(
      <FlippableCover
        frontUrl="https://img/front.jpg"
        backUrl="https://img/back.jpg"
        size={200}
        name="Abbey Road"
      />
    )
    expect(screen.getByAltText('Abbey Road')).toBeInTheDocument()
    expect(screen.getByAltText('Abbey Road - verso')).toBeInTheDocument()
  })

  it('modo tilt: não renderiza verso quando backUrl é null', () => {
    render(
      <FlippableCover
        frontUrl="https://img/front.jpg"
        backUrl={null}
        size={200}
        name="Album"
      />
    )
    expect(screen.queryByAltText('Album - verso')).not.toBeInTheDocument()
  })

  it('chama onClick ao clicar', async () => {
    const onClick = vi.fn()
    render(<FlippableCover frontUrl="https://img/front.jpg" size={200} onClick={onClick} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('renderiza children na face da frente', () => {
    render(
      <FlippableCover frontUrl="https://img/front.jpg" backUrl="https://img/back.jpg" size={200}>
        <div data-testid="overlay">Overlay</div>
      </FlippableCover>
    )
    expect(screen.getByTestId('overlay')).toBeInTheDocument()
  })

  it('renderiza placeholder quando frontUrl é undefined', () => {
    render(<FlippableCover size={200} name="Sem capa" />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('♪')).toBeInTheDocument()
  })
})
