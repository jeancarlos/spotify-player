import { useArtistBio } from '@/hooks/queries/useArtistBio'
import { useDebounce } from '@/hooks/useDebounce'
import { useTranslation } from 'react-i18next'

interface ArtistBioProps {
  artistName: string | undefined
}

export function ArtistBio({ artistName }: ArtistBioProps) {
  const { t } = useTranslation()
  const debouncedName = useDebounce(artistName, 400)
  const bio = useArtistBio(debouncedName)

  if (!bio.data) return null

  return (
    <section className="mb-8 px-2">
      <h3 className="text-sm font-bold text-black/50 mb-3">{t('artistDetail.bio')}</h3>
      <p className="text-sm text-black/70 leading-relaxed">{bio.data.extract}</p>
      <a
        href={bio.data.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-black/40 hover:text-black/70 underline mt-2 inline-block transition-colors"
      >
        Wikipedia {bio.data.lang === 'en' ? '(EN)' : ''} →
      </a>
    </section>
  )
}
