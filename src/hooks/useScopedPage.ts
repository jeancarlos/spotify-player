import { useCallback, useState, type Dispatch, type SetStateAction } from 'react'

export function useScopedPage(scope: string | undefined): [number, Dispatch<SetStateAction<number>>] {
  const [state, setState] = useState({ scope, page: 1 })
  const page = state.scope === scope ? state.page : 1
  const setPage = useCallback<Dispatch<SetStateAction<number>>>(
    (update) => {
      setState((prev) => {
        const current = prev.scope === scope ? prev.page : 1
        return { scope, page: typeof update === 'function' ? update(current) : update }
      })
    },
    [scope]
  )
  return [page, setPage]
}
