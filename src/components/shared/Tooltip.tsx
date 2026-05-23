import type { ReactNode } from 'react'

interface TooltipProps {
  content: string
  children: ReactNode
}

export function Tooltip({ content, children }: TooltipProps) {
  return (
    <span className="relative group/tooltip inline-block">
      {children}
      <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-xs text-white opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-150 z-50">
        {content}
      </span>
    </span>
  )
}
