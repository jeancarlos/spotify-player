import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { useArtists } from '@/hooks/queries/useArtists'
import { useSearchAlbums } from '@/hooks/queries/useSearchAlbums'
import { useSearchPlaylists } from '@/hooks/queries/useSearchPlaylists'
import { useChartAlbums, useChartArtists, useChartPlaylists } from '@/hooks/queries/useChart'
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
  const [searchParams, setSearchParams] = useSearchParams()

  const saved = loadLastSearch()
  const { query, tab, page } = extractPageParams(searchParams, saved)

  const isSearch = query.trim().length > 0
  const chartTab = isSearch ? null : tab

  const searchArtists = useArtists(tab === 'artist' ? query : '', page)
  const searchAlbums = useSearchAlbums(tab === 'album' ? query : '', page)
  const searchPlaylists = useSearchPlaylists(tab === 'playlist' ? query : '', page)
  const chartArtists = useChartArtists(chartTab === 'artist')
  const chartAlbums = useChartAlbums(chartTab === 'album')
  const chartPlaylists = useChartPlaylists(chartTab === 'playlist')

  const artists = isSearch ? searchArtists : chartArtists
  const albums = isSearch ? searchAlbums : chartAlbums
  const playlists = isSearch ? searchPlaylists : chartPlaylists

  const activeQuery = useMemo(
    () => getActiveQuery(tab, artists, albums, playlists),
    [tab, artists, albums, playlists]
  )

  const { data, isPending: isLoading } = activeQuery
  const hasNext = useMemo(
    () => (data ? data.offset + data.items.length < data.total : false),
    [data]
  )
  const headerLabel = useMemo(
    () => (isSearch ? getHeaderLabel(tab, t) : t('artists.charts')),
    [isSearch, tab, t]
  )

  const handleSearch = useCallback(
    (searchQuery: string, nextTab: SearchTab) => {
      setSearchParams({ q: searchQuery, tab: nextTab, page: '1' }, { replace: true })
    },
    [setSearchParams]
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
