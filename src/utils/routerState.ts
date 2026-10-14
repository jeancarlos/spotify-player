export function currentPath(location: { pathname: string; search: string }): string {
  return location.pathname + location.search
}

export function getFromPath(state: unknown): string {
  if (state !== null && typeof state === 'object' && 'from' in state) {
    const stateObj = state as Record<string, unknown>
    if (typeof stateObj.from === 'string') {
      return stateObj.from
    }
  }
  return '/'
}
