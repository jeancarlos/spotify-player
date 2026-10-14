import { useTranslation } from 'react-i18next'
import { pickImage, srcSetOf } from '@/lib/utils'
import type { TooltipProps } from 'recharts'
import type { ChartEntry } from './chartData'

export function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  const { t, i18n } = useTranslation()
  if (!active || !payload?.[0]) return null
  const e = payload[0].payload as ChartEntry
  return (
    <div className="flex items-start gap-3 bg-white/96 backdrop-blur-sm border border-black/[0.07] rounded-2xl p-3 shadow-xl max-w-[260px] pointer-events-none">
      <img
        src={pickImage(e.albumImages, 56)?.url}
        srcSet={srcSetOf(e.albumImages)}
        sizes="56px"
        decoding="async"
        alt=""
        className="w-14 h-14 rounded-xl object-cover shrink-0 shadow-sm"
      />
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-bold text-black leading-snug line-clamp-2">{e.name}</p>
        <p className="text-[10px] text-black/60 mt-0.5 truncate">{e.artists}</p>
        <p className="text-[9px] text-black/60 truncate mt-0.5 italic">{e.albumName}</p>
        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-black/[0.06]">
          <div>
            <p className="text-[13px] font-black tabular-nums text-black leading-none">
              {e.rank.toLocaleString(i18n.language)}
            </p>
            <p className="text-[7px] uppercase tracking-widest text-black/60 mt-0.5">{t('artistDetail.deezerRank')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
