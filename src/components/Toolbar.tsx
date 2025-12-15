import { useAppStore } from '../stores/appStore'
import { open } from '@tauri-apps/plugin-dialog'
import { readFile } from '@tauri-apps/plugin-fs'
import { pdfService } from '../services/pdfService'
import { TtsControls } from './TtsControls'

export function Toolbar() {
  const {
    currentDocument,
    currentPage,
    zoom,
    setCurrentDocument,
    setCurrentPage,
    setZoom,
    setIsSearchOpen,
    isSearchOpen,
    setIsSettingsOpen,
    showTranslationPanel,
    setShowTranslationPanel,
  } = useAppStore()

  const handleOpenFile = async () => {
    const selected = await open({
      multiple: false,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    })

    if (selected) {
      const path = typeof selected === 'string' ? selected : selected[0]
      const data = await readFile(path)
      const totalPages = await pdfService.loadDocument(data.buffer)
      setCurrentDocument({
        path,
        name: path.split('/').pop() || 'document.pdf',
        totalPages,
      })
    }
  }

  const handleZoomIn = () => setZoom(zoom + 0.25)
  const handleZoomOut = () => setZoom(zoom - 0.25)

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1)
  }

  const handleNextPage = () => {
    if (currentDocument && currentPage < currentDocument.totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  return (
    <div className="h-14 bg-gray-800 flex items-center px-4 gap-4 border-b border-gray-700">
      <button
        onClick={handleOpenFile}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
      >
        Open PDF
      </button>

      {currentDocument && (
        <>
          <div className="h-6 w-px bg-gray-600" />

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className="p-2 hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm min-w-[100px] text-center">
              {currentPage} / {currentDocument.totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage >= currentDocument.totalPages}
              className="p-2 hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="h-6 w-px bg-gray-600" />

          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 0.25}
              className="p-2 hover:bg-gray-700 rounded disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="text-sm min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              className="p-2 hover:bg-gray-700 rounded disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <div className="h-6 w-px bg-gray-600" />

          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`p-2 rounded transition-colors ${
              isSearchOpen ? 'bg-blue-600' : 'hover:bg-gray-700'
            }`}
            title="Search (Ctrl+F)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          <button
            onClick={() => setShowTranslationPanel(!showTranslationPanel)}
            className={`p-2 rounded transition-colors ${
              showTranslationPanel ? 'bg-blue-600' : 'hover:bg-gray-700'
            }`}
            title="Toggle Translation Panel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
          </button>

          <div className="h-6 w-px bg-gray-600" />

          <TtsControls />

          <div className="flex-1" />

          <span className="text-sm text-gray-400 truncate max-w-[200px]" title={currentDocument.name}>
            {currentDocument.name}
          </span>
        </>
      )}

      <button
        onClick={() => setIsSettingsOpen(true)}
        className="p-2 hover:bg-gray-700 rounded"
        title="Settings"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
  )
}
