import { useTranslation } from 'react-i18next'

interface LyricsViewProps {
  lines: string[]
}

export function LyricsView({ lines }: LyricsViewProps) {
  const { t } = useTranslation()
  if (lines.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-white/60 text-sm">{t('lyrics.noLyricsAvailable')}</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto px-8 pt-4 pb-40">
      <div className="mx-auto max-w-2xl flex flex-col gap-4 text-center">
        {lines.map((line, i) => (
          <p key={i} className="text-white/80 text-lg md:text-xl leading-snug">
            {line}
          </p>
        ))}
      </div>
    </div>
  )
}
