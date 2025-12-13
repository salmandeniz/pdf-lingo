import type { Translation } from '../types'

interface TranslationOverlayProps {
  translation: Translation
  onClose: () => void
}

export function TranslationOverlay({ translation, onClose }: TranslationOverlayProps) {
  return (
    <div
      className="relative mt-2 bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <button
        onClick={onClose}
        className="absolute top-2 right-2 p-1 hover:bg-gray-700 rounded transition-colors"
        title="Close translation"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="pr-8">
        <div className="text-xs text-gray-400 mb-1 flex items-center gap-2">
          <span className="uppercase">{translation.sourceLang}</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
          <span className="uppercase">{translation.targetLang}</span>
        </div>

        <div className="text-sm text-gray-300 mb-2 pb-2 border-b border-gray-700 line-clamp-3">
          {translation.originalText}
        </div>

        <div className="text-sm text-blue-300">
          {translation.translatedText}
        </div>
      </div>
    </div>
  )
}
