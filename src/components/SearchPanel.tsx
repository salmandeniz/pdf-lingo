import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '../stores/appStore'
import { pdfService } from '../services/pdfService'

export function SearchPanel() {
  const {
    isSearchOpen,
    setIsSearchOpen,
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    setCurrentPage,
  } = useAppStore()

  const [isSearching, setIsSearching] = useState(false)
  const [currentResultIndex, setCurrentResultIndex] = useState(0)

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    const results = await pdfService.searchText(searchQuery)
    const pageNumbers = Array.from(results.keys())
    setSearchResults(pageNumbers)
    setCurrentResultIndex(0)
    if (pageNumbers.length > 0) {
      setCurrentPage(pageNumbers[0])
    }
    setIsSearching(false)
  }, [searchQuery, setSearchResults, setCurrentPage])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) handleSearch()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, handleSearch])

  const goToResult = (direction: 'prev' | 'next') => {
    if (searchResults.length === 0) return

    let newIndex = currentResultIndex
    if (direction === 'next') {
      newIndex = (currentResultIndex + 1) % searchResults.length
    } else {
      newIndex = (currentResultIndex - 1 + searchResults.length) % searchResults.length
    }
    setCurrentResultIndex(newIndex)
    setCurrentPage(searchResults[newIndex])
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        setIsSearchOpen(true)
      }
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSearchOpen, setIsSearchOpen])

  if (!isSearchOpen) return null

  return (
    <div className="absolute top-16 right-4 bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-4 w-80 z-50">
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in document..."
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        <button
          onClick={() => setIsSearchOpen(false)}
          className="p-2 hover:bg-gray-700 rounded"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {searchResults.length > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">
            {currentResultIndex + 1} of {searchResults.length} pages
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => goToResult('prev')}
              className="p-1 hover:bg-gray-700 rounded"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => goToResult('next')}
              className="p-1 hover:bg-gray-700 rounded"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {searchQuery && !isSearching && searchResults.length === 0 && (
        <p className="text-gray-400 text-sm">No results found</p>
      )}
    </div>
  )
}
