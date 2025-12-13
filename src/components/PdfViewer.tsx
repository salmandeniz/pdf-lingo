import { useEffect, useRef, useState, useCallback } from 'react'
import { useAppStore } from '../stores/appStore'
import { pdfService } from '../services/pdfService'
import { translate } from '../services/translationService'
import { TranslationOverlay } from './TranslationOverlay'
import { AnnotationLayer } from './AnnotationLayer'

export function PdfViewer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [pageText, setPageText] = useState('')
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [hoveredParagraph, setHoveredParagraph] = useState<{
    text: string
    rect: DOMRect
  } | null>(null)

  const {
    currentDocument,
    currentPage,
    zoom,
    isCtrlPressed,
    settings,
    translations,
    activeTool,
    addTranslation,
    removeTranslation,
  } = useAppStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control') {
        useAppStore.getState().setIsCtrlPressed(true)
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control') {
        useAppStore.getState().setIsCtrlPressed(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useEffect(() => {
    const renderPage = async () => {
      if (!currentDocument || !canvasRef.current) return

      setIsLoading(true)
      const pageInfo = await pdfService.renderPage(currentPage, canvasRef.current, zoom)
      if (pageInfo) {
        setCanvasSize({ width: pageInfo.width, height: pageInfo.height })
      }
      const text = await pdfService.getTextContent(currentPage)
      setPageText(text)
      setIsLoading(false)
    }

    renderPage()
  }, [currentDocument, currentPage, zoom])

  const handleMouseMove = useCallback(
    async (e: React.MouseEvent) => {
      if (!isCtrlPressed || !containerRef.current || activeTool !== 'select') {
        setHoveredParagraph(null)
        return
      }

      const selection = window.getSelection()
      if (selection && selection.toString().trim()) {
        return
      }

      const rect = containerRef.current.getBoundingClientRect()
      const y = e.clientY - rect.top

      const paragraphs = pageText.split(/\n\n+/).filter((p) => p.trim())
      if (paragraphs.length === 0) return

      const paragraphIndex = Math.floor((y / rect.height) * paragraphs.length)
      const paragraph = paragraphs[Math.min(paragraphIndex, paragraphs.length - 1)]

      if (paragraph && paragraph.trim().length > 10) {
        setHoveredParagraph({
          text: paragraph.trim(),
          rect: new DOMRect(rect.left + 20, e.clientY, rect.width - 40, 0),
        })
      }
    },
    [isCtrlPressed, pageText, activeTool]
  )

  const handleTranslate = useCallback(async () => {
    if (!hoveredParagraph) return

    const existingTranslation = translations.find(
      (t) => t.originalText === hoveredParagraph.text && t.pageNumber === currentPage
    )
    if (existingTranslation) return

    const result = await translate(
      hoveredParagraph.text,
      settings.targetLanguage,
      settings.translationService,
      settings.openRouterApiKey,
      settings.openRouterModel
    )

    addTranslation({
      id: crypto.randomUUID(),
      originalText: hoveredParagraph.text,
      translatedText: result.translatedText,
      sourceLang: result.detectedSourceLang || 'auto',
      targetLang: settings.targetLanguage,
      pageNumber: currentPage,
      position: { x: hoveredParagraph.rect.x, y: hoveredParagraph.rect.y },
      visible: true,
    })
  }, [hoveredParagraph, translations, currentPage, settings, addTranslation])

  useEffect(() => {
    if (isCtrlPressed && hoveredParagraph && activeTool === 'select') {
      handleTranslate()
    }
  }, [hoveredParagraph, isCtrlPressed, activeTool, handleTranslate])

  const currentTranslations = translations.filter((t) => t.pageNumber === currentPage)

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
    <div
      ref={containerRef}
      className="flex-1 overflow-auto bg-gray-900 flex justify-center p-8"
      onMouseMove={handleMouseMove}
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

        {hoveredParagraph && isCtrlPressed && activeTool === 'select' && (
          <div
            className="absolute left-0 right-0 bg-blue-500/20 border-l-4 border-blue-500 pointer-events-none z-20"
            style={{
              top: hoveredParagraph.rect.y - (containerRef.current?.getBoundingClientRect().top || 0),
              padding: '8px',
            }}
          />
        )}

        {currentTranslations.map((translation) => (
          <TranslationOverlay
            key={translation.id}
            translation={translation}
            onClose={() => removeTranslation(translation.id)}
          />
        ))}
      </div>
    </div>
  )
}
