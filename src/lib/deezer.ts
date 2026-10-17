export class DeezerError extends Error {
  readonly code: number

  constructor(code: number, message: string) {
    super(message)
    this.name = 'DeezerError'
    this.code = code
  }
}

export const DEEZER_TIMEOUT_CODE = -1

export function isNoData(error: unknown): boolean {
  return error instanceof DeezerError && error.code === 800
}

interface DeezerErrorBody {
  error: { type?: string; message?: string; code?: number }
}

type Callbacks = Record<string, ((data: unknown) => void) | undefined>

function isErrorBody(data: unknown): data is DeezerErrorBody {
  return (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    typeof data.error === 'object' &&
    data.error !== null
  )
}

let counter = 0

export async function deezer<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
  timeoutMs = 8000
): Promise<T> {
  const callbackName = `__deezer_cb_${Date.now()}_${counter++}`
  const url = new URL(`https://api.deezer.com/${path}`)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }
  url.searchParams.set('output', 'jsonp')
  url.searchParams.set('callback', callbackName)

  const callbacks = window as unknown as Callbacks
  const script = document.createElement('script')

  return new Promise<T>((resolve, reject) => {
    const settle = () => {
      clearTimeout(timer)
      script.remove()
    }
    const retire = () => {
      settle()
      callbacks[callbackName] = () => {
        Reflect.deleteProperty(callbacks, callbackName)
      }
    }
    const timer = setTimeout(() => {
      retire()
      reject(new DeezerError(DEEZER_TIMEOUT_CODE, 'timeout'))
    }, timeoutMs)
    callbacks[callbackName] = (data: unknown) => {
      settle()
      Reflect.deleteProperty(callbacks, callbackName)
      if (isErrorBody(data)) {
        reject(new DeezerError(data.error.code ?? 0, data.error.message ?? 'Deezer error'))
      } else {
        resolve(data as T)
      }
    }
    script.onerror = () => {
      retire()
      reject(new DeezerError(DEEZER_TIMEOUT_CODE, 'network'))
    }
    script.src = url.toString()
    document.head.appendChild(script)
  })
}
