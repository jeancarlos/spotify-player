import { useRef, useEffect, useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useRelatedArtists } from '@/hooks/queries/useRelatedArtists'
import { ArtistCard } from '@/components/shared/ArtistCard'

const INITIAL_COUNT = 7
const PAGE_SIZE = 7

interface RelatedArtistsProps {
  artistId: string | undefined
}

export function RelatedArtists({ artistId }: RelatedArtistsProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const related = useRelatedArtists(artistId)
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const handleNavigate = useCallback(
    (id: string) => {
      navigate(`/artists/${id}`, { state: { from: location.pathname } })
    },
    [navigate, location.pathname]
  )

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !related.data) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((c) => Math.min(c + PAGE_SIZE, related.data.length))
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(sentinel)
    return () => { observer.disconnect(); }
  }, [related.data])

  if (!related.data || related.data.length === 0) return null

  const visible = related.data.slice(0, visibleCount)

  return (
    <section className="mb-8">
      <h3 className="text-sm font-bold text-black/50 mb-3 px-2">
        {t('artistDetail.relatedArtists')}
      </h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 px-2">
        {visible.map((artist) => (
          <ArtistCard key={artist.id} artist={artist} onNavigate={handleNavigate} />
        ))}
      </div>
      {visibleCount < related.data.length && <div ref={sentinelRef} className="h-4 mt-2" />}
    </section>
  )
}
