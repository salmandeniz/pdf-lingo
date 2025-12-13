import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../stores/appStore'
import { pdfService } from '../services/pdfService'
import { AnnotationLayer } from './AnnotationLayer'
import { TranslationPanel } from './TranslationPanel'

export function PdfViewer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  const {
    currentDocument,
    currentPage,
    zoom,
    showTranslationPanel,
  } = useAppStore()

  useEffect(() => {
    const renderPage = async () => {
      if (!currentDocument || !canvasRef.current) return

      setIsLoading(true)
      const pageInfo = await pdfService.renderPage(currentPage, canvasRef.current, zoom)
      if (pageInfo) {
        setCanvasSize({ width: pageInfo.width, height: pageInfo.height })
      }
      setIsLoading(false)
    }

    renderPage()
  }, [currentDocument, currentPage, zoom])

  if (!currentDocument) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <svg
            className="w-24 h-24 mx-auto text-gray-600 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-gray-400 text-lg">Open a PDF file to get started</p>
          <p className="text-gray-500 text-sm mt-2">
            Use the &quot;Open PDF&quot; button in the toolbar
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-900 flex justify-center p-8"
      >
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 z-30">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <canvas
            ref={canvasRef}
            className="shadow-2xl"
            style={{ maxWidth: '100%', height: 'auto' }}
          />

          {canvasSize.width > 0 && canvasSize.height > 0 && (
            <AnnotationLayer
              width={canvasSize.width}
              height={canvasSize.height}
              pageNumber={currentPage}
            />
          )}
        </div>
      </div>

      {showTranslationPanel && canvasSize.width > 0 && (
        <TranslationPanel
          width={canvasSize.width}
          height={canvasSize.height + 48}
        />
      )}
    </div>
  )
}
