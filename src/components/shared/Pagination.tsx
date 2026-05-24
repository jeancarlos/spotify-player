import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  hasNext: boolean
  onPrev: () => void
  onNext: () => void
  className?: string
}

export function Pagination({ page, hasNext, onPrev, onNext, className }: PaginationProps) {
  const { t } = useTranslation()
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-8 py-6 border-t border-black/8',
        className
      )}
    >
      <button
        onClick={onPrev}
        disabled={page <= 1}
        className="flex items-center gap-1.5 text-sm text-black/50 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={16} />
        {t('artists.previous')}
      </button>
      <span className="text-sm text-black/30 font-mono">{page}</span>
      <button
        onClick={onNext}
        disabled={!hasNext}
        className="flex items-center gap-1.5 text-sm text-black/50 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        {t('artists.next')}
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
