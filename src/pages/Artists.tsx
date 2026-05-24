import { AnimatePresence, motion } from 'framer-motion'
import { CardSkeleton } from '@/components/shared/CardSkeleton'
import { SearchBar } from '@/components/shared/SearchBar'
import { Pagination } from '@/components/shared/Pagination'
import { SearchResultsGrid } from '@/components/search/SearchResultsGrid'
import { useArtistsPage } from '@/hooks/useArtistsPage'
import { useTranslation } from 'react-i18next'

export function Artists() {
  const { t } = useTranslation()
  const {
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
  } = useArtistsPage()

  function renderResults() {
    if (isLoading) {
      return (
        <motion.div
          key="skeleton"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-3"
        >
          {Array.from({ length: 21 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </motion.div>
      )
    }
    if (data) {
      return (
        <motion.div
          key={`${query}-${tab}-${String(page)}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <SearchResultsGrid
            tab={tab}
            artists={artists.data?.items}
            albums={albums.data?.items}
            playlists={playlists.data?.items}
            hasNext={hasNext}
            onNextPage={() => {
              handlePageChange(page + 1)
            }}
          />
        </motion.div>
      )
    }
    return null
  }

  return (
    <div className="min-h-screen max-w-3xl mx-auto ">
      <div className="fixed top-14 left-0 right-0 z-20 flex justify-center px-4 pt-2">
        <SearchBar
          onSearch={handleSearch}
          defaultTab={tab}
          defaultQuery={query}
          className="shadow-sm"
        />
      </div>

      <div className="pt-36 px-6 pb-32">
        {query && (
          <p className="text-sm text-black/40 mb-6" aria-live="polite">
            {headerLabel}
            {data && ` — ${t('artists.result', { count: data.total })}`}
          </p>
        )}

        {!query && <p className="text-center text-black/30 mt-20">{t('artists.searchPrompt')}</p>}

        <AnimatePresence mode="wait">{renderResults()}</AnimatePresence>

        {!isLoading && query && data?.items.length === 0 && (
          <p className="text-center text-black/30 mt-20">{t('artists.noResults')}</p>
        )}

        {data && data.items.length > 0 && (
          <Pagination
            page={page}
            hasNext={hasNext}
            onPrev={() => {
              handlePageChange(Math.max(1, page - 1))
            }}
            onNext={() => {
              handlePageChange(page + 1)
            }}
            className="mt-12"
          />
        )}
      </div>
    </div>
  )
}
