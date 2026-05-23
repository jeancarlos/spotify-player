declare module 'color-thief-ts' {
  export default class ColorThief {
    getColor(img: HTMLImageElement, quality?: number): number[]
    getPalette(img: HTMLImageElement, colorCount?: number, quality?: number): number[][]
  }
}

declare module 'virtual:pwa-register/react' {
  import type { Dispatch, SetStateAction } from 'react'

  export interface RegisterSWOptions {
    immediate?: boolean
    onNeedRefresh?: () => void
    onOfflineReady?: () => void
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void
    onRegisterError?: (error: unknown) => void
  }

  export function useRegisterSW(options?: RegisterSWOptions): {
    needRefresh: [boolean, Dispatch<SetStateAction<boolean>>]
    offlineReady: [boolean, Dispatch<SetStateAction<boolean>>]
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>
  }
}

declare module '*.webp' {
  const content: string
  export default content
}
