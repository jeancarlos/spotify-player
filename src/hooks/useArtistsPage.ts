import { useCallback, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { useArtists } from '@/hooks/queries/useArtists'
import { useSearchAlbums } from '@/hooks/queries/useSearchAlbums'
import { useSearchPlaylists } from '@/hooks/queries/useSearchPlaylists'
import { loadLastSearch, type SearchTab } from '@/utils/search'

interface PageParams {
  query: string
  tab: SearchTab
  page: number
}

function extractPageParams(
  searchParams: URLSearchParams,
  saved: ReturnType<typeof loadLastSearch>
): PageParams {
  const query = searchParams.get('q') ?? saved?.q ?? ''
  const tab = (searchParams.get('tab') as SearchTab | null) ?? saved?.tab ?? 'artist'
  const page = Number(searchParams.get('page') ?? '1')
  return { query, tab, page }
}

function getActiveQuery(
  tab: SearchTab,
  artists: ReturnType<typeof useArtists>,
  albums: ReturnType<typeof useSearchAlbums>,
  playlists: ReturnType<typeof useSearchPlaylists>
) {
  if (tab === 'artist') return artists
  if (tab === 'album') return albums
  return playlists
}

function getHeaderLabel(tab: SearchTab, t: TFunction): string {
  const labels: Record<SearchTab, string> = {
    artist: t('artists.searchArtists'),
    album: t('artists.searchAlbums'),
    playlist: t('artists.searchPlaylists'),
  }
  return labels[tab]
}

export function useArtistsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const saved = loadLastSearch()
  const { query, tab, page } = extractPageParams(searchParams, saved)

  useEffect(() => {
    if (!query.trim()) navigate('/', { replace: true })
  }, [query, navigate])

  const artists = useArtists(tab === 'artist' ? query : '', page)
  const albums = useSearchAlbums(tab === 'album' ? query : '', page)
  const playlists = useSearchPlaylists(tab === 'playlist' ? query : '', page)

  const activeQuery = useMemo(
    () => getActiveQuery(tab, artists, albums, playlists),
    [tab, artists, albums, playlists]
  )

  const { data, isPending: isLoading } = activeQuery
  const hasNext = useMemo(
    () => (data ? data.offset + data.items.length < data.total : false),
    [data]
  )
  const headerLabel = useMemo(() => getHeaderLabel(tab, t), [tab, t])

  const handleSearch = useCallback(
    (searchQuery: string, nextTab: SearchTab) => {
      if (!searchQuery.trim()) {
        navigate('/', { replace: true })
        return
      }
      setSearchParams({ q: searchQuery, tab: nextTab, page: '1' }, { replace: true })
    },
    [navigate, setSearchParams]
  )

  const handlePageChange = useCallback(
    (newPage: number) => {
      setSearchParams({ q: query, tab, page: String(newPage) }, { replace: true })
      document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [query, tab, setSearchParams]
  )

  return {
    query,
    tab,
    page,
    data,
    isLoading,
    hasNext,
    headerLabel,
    artists,
    albums,
    playlists,
    handleSearch,
    handlePageChange,
  }
}
