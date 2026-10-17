import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface DeezerAttributionProps {
  href?: string
  label?: string
  className?: string
}

export function DeezerAttribution({
  href = 'https://www.deezer.com',
  label,
  className,
}: DeezerAttributionProps) {
  const { t } = useTranslation()
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label ?? t('common.poweredByDeezer')}
      title={t('common.poweredByDeezer')}
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium opacity-70 transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded',
        className
      )}
    >
      <img src="/deezer-logo.png" alt="" className="block h-4 w-auto shrink-0" />
      {label && <span>{label}</span>}
    </a>
  )
}
