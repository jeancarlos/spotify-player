import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/components/ui/skeleton'

interface SectionRowProps {
  title: string
  seeMoreHref?: string
  isLoading?: boolean
  children: React.ReactNode
}

export function SectionRow({ title, seeMoreHref, isLoading, children }: SectionRowProps) {
  const { t } = useTranslation()

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold tracking-wide uppercase text-white/70">{title}</h2>
        {seeMoreHref && (
          <Link
            to={seeMoreHref}
            className="text-xs text-white/40 hover:text-white/80 transition-colors"
          >
            {t('home.seeMore')} →
          </Link>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="w-40 h-56 rounded-2xl shrink-0" />
            ))
          : children}
      </div>
    </section>
  )
}
