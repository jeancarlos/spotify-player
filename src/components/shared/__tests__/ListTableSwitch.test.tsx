import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ListTableSwitch } from '../ListTableSwitch'

describe('ListTableSwitch', () => {
  it('renderiza os dois botões', () => {
    render(<ListTableSwitch view="list" onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /lista/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /tabela/i })).toBeInTheDocument()
  })

  it('chama onChange com "table" ao clicar em Tabela', async () => {
    const onChange = vi.fn()
    render(<ListTableSwitch view="list" onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: /tabela/i }))
    expect(onChange).toHaveBeenCalledWith('table')
  })

  it('chama onChange com "list" ao clicar em Lista', async () => {
    const onChange = vi.fn()
    render(<ListTableSwitch view="table" onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: /lista/i }))
    expect(onChange).toHaveBeenCalledWith('list')
  })
})
