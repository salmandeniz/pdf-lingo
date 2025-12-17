import { useEffect, useRef, useState, useCallback } from 'react'
import { useAppStore } from '../stores/appStore'
import { pdfService } from '../services/pdfService'
import { AnnotationLayer } from './AnnotationLayer'
import { TranslationPanel } from './TranslationPanel'
import { TtsHighlight } from './TtsHighlight'

export function PdfViewer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [isDragging, setIsDragging] = useState(false)

  const {
    currentDocument,
    currentPage,
    zoom,
    showTranslationPanel,
    translationPanelWidth,
    setTranslationPanelWidth,
    setCurrentDocument,
    isTtsPlaying,
    currentTtsParagraphIndex,
    ttsParagraphs,
  } = useAppStore()

  const loadPdfFromFile = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') return
    setIsLoading(true)
    const arrayBuffer = await file.arrayBuffer()
    const totalPages = await pdfService.loadDocument(arrayBuffer)
    setCurrentDocument({
      path: file.name,
      name: file.name,
      totalPages,
    })
    setIsLoading(false)
  }, [setCurrentDocument])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) loadPdfFromFile(file)
  }, [loadPdfFromFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) loadPdfFromFile(file)
  }, [loadPdfFromFile])

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
      <div
        className="flex-1 flex items-center justify-center bg-gray-900"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileInput}
          className="hidden"
        />
        <div
          className={`text-center p-12 border-2 border-dashed rounded-xl transition-colors cursor-pointer ${
            isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-500'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <svg
            className={`w-24 h-24 mx-auto mb-4 transition-colors ${isDragging ? 'text-blue-500' : 'text-gray-600'}`}
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
          <p className={`text-lg transition-colors ${isDragging ? 'text-blue-400' : 'text-gray-400'}`}>
            {isDragging ? 'Drop PDF here' : 'Drag & drop a PDF file here'}
          </p>
          <p className="text-gray-500 text-sm mt-2">
            or click to browse
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      <div
        ref={containerRef}
        className={`flex-1 overflow-auto bg-gray-900 flex justify-center py-8 pl-8 ${showTranslationPanel ? 'pr-2' : 'pr-8'}`}
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

          {isTtsPlaying && currentTtsParagraphIndex >= 0 && ttsParagraphs[currentTtsParagraphIndex] && (
            <TtsHighlight paragraph={ttsParagraphs[currentTtsParagraphIndex]} />
          )}
        </div>
      </div>

      {showTranslationPanel && canvasSize.width > 0 && (
        <TranslationPanel
          width={translationPanelWidth || canvasSize.width}
          height={canvasSize.height + 48}
          onWidthChange={setTranslationPanelWidth}
        />
      )}
    </div>
  )
}
