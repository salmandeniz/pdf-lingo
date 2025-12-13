import { useEffect } from 'react'
import { useAppStore } from '../stores/appStore'
import { pdfService } from '../services/pdfService'
import { translate } from '../services/translationService'

interface TranslationPanelProps {
  width: number
  height: number
}

export function TranslationPanel({ width, height }: TranslationPanelProps) {
  const {
    currentPage,
    showTranslationPanel,
    pageTranslation,
    isTranslating,
    settings,
    setPageTranslation,
    setIsTranslating,
    setShowTranslationPanel,
  } = useAppStore()

  useEffect(() => {
    const translatePage = async () => {
      if (!showTranslationPanel) return

      setIsTranslating(true)
      setPageTranslation('')

      const text = await pdfService.getTextContent(currentPage)
      if (!text.trim()) {
        setPageTranslation('No text found on this page.')
        setIsTranslating(false)
        return
      }

      const result = await translate(
        text,
        settings.targetLanguage,
        settings.translationService,
        settings.openRouterApiKey,
        settings.openRouterModel
      )

      setPageTranslation(result.translatedText)
      setIsTranslating(false)
    }

    translatePage()
  }, [currentPage, showTranslationPanel, settings.targetLanguage, settings.translationService])

  if (!showTranslationPanel) return null

  return (
    <div
      className="bg-gray-800 border-l border-gray-700 flex flex-col"
      style={{ width, minWidth: width }}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-gray-850">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          <span className="text-sm font-medium">Translation</span>
          <span className="text-xs text-gray-500 uppercase">{settings.targetLanguage}</span>
        </div>
        <button
          onClick={() => setShowTranslationPanel(false)}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
          title="Close translation panel"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div
        className="flex-1 overflow-auto p-6"
        style={{ height: height - 45 }}
      >
        {isTranslating ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Translating page {currentPage}...</p>
          </div>
        ) : (
          <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
            {pageTranslation || 'No translation available.'}
          </div>
        )}
      </div>
    </div>
  )
}
