import { useEffect, useState, useCallback, useRef } from 'react'
import { useAppStore } from '../stores/appStore'
import { ttsService } from '../services/ttsService'
import { pdfService } from '../services/pdfService'
import { groupIntoLines, groupIntoParagraphs, type Paragraph } from '../utils/textUtils'

export function TtsControls() {
  const {
    currentPage,
    zoom,
    isTtsPlaying,
    isTtsPaused,
    currentTtsParagraphIndex,
    ttsRate,
    selectedVoiceUri,
    ttsParagraphs,
    setIsTtsPlaying,
    setIsTtsPaused,
    setCurrentTtsParagraphIndex,
    setTtsRate,
    setSelectedVoiceUri,
    setTtsParagraphs,
    stopTts,
  } = useAppStore()

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const paragraphsRef = useRef<Paragraph[]>([])

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = ttsService.getVoices()
      setVoices(availableVoices)
    }

    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices

    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [])

  const loadParagraphs = useCallback(async () => {
    const { items } = await pdfService.getTextItemsWithPositions(currentPage, zoom)
    const lines = groupIntoLines(items)
    const paras = groupIntoParagraphs(lines)
    setTtsParagraphs(paras)
    paragraphsRef.current = paras
    return paras
  }, [currentPage, zoom, setTtsParagraphs])

  const speakParagraph = useCallback((index: number, paras: Paragraph[]) => {
    if (index >= paras.length) {
      setIsTtsPlaying(false)
      setCurrentTtsParagraphIndex(-1)
      setTtsParagraphs([])
      return
    }

    const para = paras[index]
    const voice = voices.find(v => v.voiceURI === selectedVoiceUri) || null

    setCurrentTtsParagraphIndex(index)

    ttsService.speak(para.text, {
      rate: ttsRate,
      voice,
      onEnd: () => {
        speakParagraph(index + 1, paras)
      },
    })
  }, [voices, selectedVoiceUri, ttsRate, setIsTtsPlaying, setCurrentTtsParagraphIndex, setTtsParagraphs])

  const handlePlay = useCallback(async () => {
    if (isTtsPaused) {
      ttsService.resume()
      setIsTtsPaused(false)
      return
    }

    const paras = await loadParagraphs()
    if (paras.length === 0) return

    setIsTtsPlaying(true)
    setIsTtsPaused(false)
    speakParagraph(0, paras)
  }, [isTtsPaused, loadParagraphs, setIsTtsPlaying, setIsTtsPaused, speakParagraph])

  const handlePause = useCallback(() => {
    ttsService.pause()
    setIsTtsPaused(true)
  }, [setIsTtsPaused])

  const handleStop = useCallback(() => {
    ttsService.stop()
    stopTts()
  }, [stopTts])

  const handleRateChange = (newRate: number) => {
    setTtsRate(newRate)
    if (isTtsPlaying && !isTtsPaused) {
      ttsService.stop()
      const currentParas = paragraphsRef.current
      if (currentParas.length > 0 && currentTtsParagraphIndex >= 0) {
        setTimeout(() => {
          speakParagraph(currentTtsParagraphIndex, currentParas)
        }, 100)
      }
    }
  }

  useEffect(() => {
    return () => {
      ttsService.stop()
    }
  }, [])

  useEffect(() => {
    ttsService.stop()
    stopTts()
  }, [currentPage, stopTts])

  return (
    <div className="flex items-center gap-2">
      {!isTtsPlaying ? (
        <button
          onClick={handlePlay}
          className="p-2 hover:bg-gray-700 rounded transition-colors"
          title="Read aloud"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        </button>
      ) : (
        <>
          {isTtsPaused ? (
            <button
              onClick={handlePlay}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
              title="Resume"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
              title="Pause"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}

          <button
            onClick={handleStop}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="Stop"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
          </button>

          <span className="text-xs text-gray-400">
            {currentTtsParagraphIndex + 1}/{ttsParagraphs.length}
          </span>
        </>
      )}

      <select
        value={ttsRate}
        onChange={(e) => handleRateChange(parseFloat(e.target.value))}
        className="bg-gray-700 text-white text-xs rounded px-2 py-1 border border-gray-600"
        title="Speed"
      >
        <option value={0.5}>0.5x</option>
        <option value={0.75}>0.75x</option>
        <option value={1}>1x</option>
        <option value={1.25}>1.25x</option>
        <option value={1.5}>1.5x</option>
        <option value={2}>2x</option>
      </select>

      {voices.length > 0 && (
        <select
          value={selectedVoiceUri || ''}
          onChange={(e) => setSelectedVoiceUri(e.target.value || null)}
          className="bg-gray-700 text-white text-xs rounded px-2 py-1 border border-gray-600 max-w-[120px]"
          title="Voice"
        >
          <option value="">Default</option>
          {voices.map((voice) => (
            <option key={voice.voiceURI} value={voice.voiceURI}>
              {voice.name} ({voice.lang})
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
