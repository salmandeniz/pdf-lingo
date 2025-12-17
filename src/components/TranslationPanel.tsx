import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../stores/appStore'
import { pdfService } from '../services/pdfService'
import { translate } from '../services/translationService'
import { translateWithVision, type VisionTranslatedBlock } from '../services/visionTranslationService'
import {
  getBackgroundColor,
  groupIntoLines,
  groupIntoParagraphs,
  concurrentMap,
  calculateLineHeight,
} from '../utils/textUtils'
import { checkTextBoldStatus } from '../utils/boldTest'
import type { Paragraph } from '../utils/textUtils'

interface TranslationPanelProps {
  width: number
  height: number
  onWidthChange?: (width: number) => void
}

interface TranslatedCell {
  translatedText: string
  x: number
  y: number
  width: number
  height: number
  fontSize: number
  fontFamily: string
  fontWeight: 'normal' | 'bold'
  fontStyle: 'normal' | 'italic'
}

interface TranslatedParagraph {
  translatedText: string
  x: number
  y: number
  width: number
  height: number
  fontSize: number
  fontFamily: string
  fontWeight: 'normal' | 'bold'
  fontStyle: 'normal' | 'italic'
  marginTop: number
  lineHeight: number
  isList: boolean
  isTableRow: boolean
  cells?: TranslatedCell[]
}

interface ParagraphMask {
  x: number
  y: number
  width: number
  height: number
}

export function TranslationPanel({ width, height, onWidthChange }: TranslationPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 })
  const [bgColor, setBgColor] = useState('rgb(255, 255, 255)')
  const [paragraphMasks, setParagraphMasks] = useState<ParagraphMask[]>([])
  const [translatedParagraphs, setTranslatedParagraphs] = useState<TranslatedParagraph[]>([])
  const [visionBlocks, setVisionBlocks] = useState<VisionTranslatedBlock[]>([])
  const [isVisionMode, setIsVisionMode] = useState(false)
  const [isVisionProcessing, setIsVisionProcessing] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null)

  const {
    currentPage,
    zoom,
    showTranslationPanel,
    isTranslating,
    settings,
    setIsTranslating,
    setShowTranslationPanel,
  } = useAppStore()

  useEffect(() => {
    const renderAndTranslate = async () => {
      if (!showTranslationPanel || !canvasRef.current) return

      setIsTranslating(true)
      setParagraphMasks([])
      setTranslatedParagraphs([])
      setVisionBlocks([])
      setIsVisionMode(false)

      try {
        const pageInfo = await pdfService.renderPage(currentPage, canvasRef.current, zoom)
        if (!pageInfo) {
          setIsTranslating(false)
          return
        }

        setPageSize({ width: pageInfo.width, height: pageInfo.height })

        const detectedBgColor = getBackgroundColor(canvasRef.current)
        setBgColor(detectedBgColor)

        const { items } = await pdfService.getTextItemsWithPositions(currentPage, zoom)
        if (items.length === 0) {
          setIsTranslating(false)
          return
        }

        const lines = groupIntoLines(items)
        const paragraphs = groupIntoParagraphs(lines)

        const masks = paragraphs
          .filter((p) => !p.isTableRow)
          .map((p) => {
            const verticalPadding = 4
            const leftPadding = 2
            const rightPadding = 4
            return {
              x: p.x - leftPadding,
              y: p.y - verticalPadding,
              width: p.width + leftPadding + rightPadding,
              height: p.height + verticalPadding * 2,
            }
          })
        setParagraphMasks(masks)

        const results = await concurrentMap(
          paragraphs,
          3,
          async (para: Paragraph) => {
            if (!para.text.trim()) return null

            try {
              let translatedCells: TranslatedCell[] | undefined

              if (para.isTableRow && para.cells && para.cells.length > 0) {
                translatedCells = await Promise.all(
                  para.cells.map(async (cell) => {
                    const cellResult = await translate(
                      cell.text,
                      settings.targetLanguage,
                      settings.translationService,
                      settings.openRouterApiKey,
                      settings.openRouterModel
                    )
                    return {
                      translatedText: cellResult.translatedText,
                      x: cell.x,
                      y: cell.y,
                      width: cell.width,
                      height: cell.height,
                      fontSize: cell.fontSize,
                      fontFamily: cell.fontFamily,
                      fontWeight: cell.fontWeight,
                      fontStyle: cell.fontStyle,
                    }
                  })
                )
              }

              const result = await translate(
                para.text,
                settings.targetLanguage,
                settings.translationService,
                settings.openRouterApiKey,
                settings.openRouterModel
              )

              return {
                translatedText: result.translatedText,
                x: para.x,
                y: para.y,
                width: pageInfo.width - para.x - 20,
                height: para.height,
                fontSize: para.fontSize,
                fontFamily: para.fontFamily,
                fontWeight: para.fontWeight,
                fontStyle: para.fontStyle,
                marginTop: 0,
                lineHeight: calculateLineHeight(para),
                isList: para.isList,
                isTableRow: para.isTableRow,
                cells: translatedCells,
              }
            } catch (error) {
              console.error('Translation failed for paragraph:', para.text.substring(0, 50), error)
              return null
            }
          }
        )

        const validTranslations: TranslatedParagraph[] = []
        
        results.forEach((res, index) => {
          if (!res) return

          const currentPara = paragraphs[index]
          
          // Calculate improved marginTop based on paragraph positioning
          let marginTop = 0
          
          if (index === 0) {
            // First paragraph starts at the original Y position
            marginTop = currentPara.y
          } else {
            // For subsequent paragraphs, calculate spacing based on previous paragraph
            const prevPara = paragraphs[index - 1]
            const prevBottom = prevPara.y + prevPara.height
            const gap = currentPara.y - prevBottom
            
            // Preserve more of the original spacing, especially for paragraph breaks
            // Use a more generous cap for larger gaps that represent meaningful breaks
            const maxGap = gap > currentPara.fontSize ? currentPara.fontSize * 1.5 : currentPara.fontSize * 0.5
            marginTop = Math.max(0, Math.min(gap, maxGap))
          }

          // Add logging to check line height values and font formatting
          console.log(`Paragraph ${index}:`, {
            text: currentPara.text,
            fontSize: currentPara.fontSize,
            lineHeight: res.lineHeight,
            lines: currentPara.lines.length,
            fontWeight: currentPara.fontWeight,
            fontStyle: currentPara.fontStyle,
            fontFamily: currentPara.fontFamily,
            isNumberedList: /^\s*\d+[\.\)]\s+/.test(currentPara.text),
            isList: currentPara.isList,
            marginTop,
            calculatedGap: index > 0 ? currentPara.y - (paragraphs[index - 1].y + paragraphs[index - 1].height) : 0,
            isBoldDetected: currentPara.fontWeight === 'bold'
          })

          validTranslations.push({
            ...res,
            marginTop
          })
        })

        // Summary logging for line height analysis
        console.log('Line Height Analysis:', {
          totalParagraphs: validTranslations.length,
          lineHeights: validTranslations.map(p => p.lineHeight),
          averageLineHeight: validTranslations.reduce((sum, p) => sum + p.lineHeight, 0) / validTranslations.length,
          minLineHeight: Math.min(...validTranslations.map(p => p.lineHeight)),
          maxLineHeight: Math.max(...validTranslations.map(p => p.lineHeight)),
          listCount: validTranslations.filter(p => p.isList).length
        })

        // Test specifically for "Reassurances for Parents" bold detection
        const reassuranceTest = checkTextBoldStatus(items, "Reassurances for Parents")
        console.log('[BOLD TEST] "Reassurances for Parents":', {
          isBoldDetected: reassuranceTest.isBold,
          confidence: reassuranceTest.confidence,
          fontName: reassuranceTest.fontName,
          detectedWeight: reassuranceTest.detectedWeight,
          method: reassuranceTest.method,
          totalTextItems: items.length,
          matchingItems: items.filter(item => item.str.toLowerCase().includes('reassurances for parents')).length
        })

        setTranslatedParagraphs(validTranslations)
      } catch (error) {
        console.error('Error during rendering/translation:', error)
      } finally {
        setIsTranslating(false)
      }
    }

    renderAndTranslate()
  }, [
    currentPage,
    showTranslationPanel,
    zoom,
    settings.targetLanguage,
    settings.translationService,
    settings.openRouterApiKey,
    settings.openRouterModel,
  ])

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    resizeRef.current = { startX: e.clientX, startWidth: width }
  }

  useEffect(() => {
    const handleResizeMove = (e: MouseEvent) => {
      if (!resizeRef.current || !onWidthChange) return
      const delta = resizeRef.current.startX - e.clientX
      const newWidth = Math.max(200, Math.min(window.innerWidth * 0.8, resizeRef.current.startWidth + delta))
      onWidthChange(newWidth)
    }

    const handleResizeEnd = () => {
      setIsResizing(false)
      resizeRef.current = null
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove)
      document.addEventListener('mouseup', handleResizeEnd)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleResizeMove)
      document.removeEventListener('mouseup', handleResizeEnd)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, onWidthChange])

  const handleVisionFix = async () => {
    if (!canvasRef.current || !settings.openRouterApiKey) {
      alert('OpenRouter API key is required for AI fix')
      return
    }

    setIsVisionProcessing(true)
    setVisionBlocks([])

    const result = await translateWithVision(
      canvasRef.current,
      settings.targetLanguage,
      settings.openRouterApiKey,
      settings.visionModel
    )

    if (result.success) {
      setVisionBlocks(result.blocks)
      setIsVisionMode(true)
    } else {
      alert(`AI fix failed: ${result.error}`)
    }

    setIsVisionProcessing(false)
  }

  if (!showTranslationPanel) return null

  return (
    <div
      className="bg-gray-800 border-l border-gray-700 flex flex-col relative"
      style={{ width, minWidth: width }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/50 z-50 transition-colors"
        onMouseDown={handleResizeStart}
      />
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-gray-850">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          <span className="text-sm font-medium">Translation</span>
          <span className="text-xs text-gray-500 uppercase">{settings.targetLanguage}</span>
          {isVisionMode && <span className="text-xs text-green-400 ml-2">AI</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleVisionFix}
            disabled={isVisionProcessing || isTranslating}
            className="px-2 py-1 text-xs bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded transition-colors flex items-center gap-1"
            title="AI ile layout ve font sorunlarini duzelt"
          >
            {isVisionProcessing ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>AI Fix</span>
              </>
            )}
          </button>
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
      </div>

      <div
        className="flex-1 overflow-auto bg-gray-900 flex justify-center py-4 pr-4 pl-2"
        style={{ height: height - 45 }}
      >
        <div className="relative" style={{ minWidth: pageSize.width || width, minHeight: pageSize.height || height - 45 }}>
          <canvas
            ref={canvasRef}
            className="shadow-2xl"
            style={{ maxWidth: '100%', height: 'auto' }}
          />

          {isTranslating && translatedParagraphs.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/70 z-30">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm mt-4">Translating page {currentPage}...</p>
            </div>
          )}

          {/* Masks Layer */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ width: pageSize.width, height: pageSize.height, zIndex: 10 }}
          >
            {paragraphMasks.map((mask, idx) => (
              <div
                key={`mask-${idx}`}
                className="absolute"
                style={{
                  left: mask.x,
                  top: mask.y,
                  width: mask.width,
                  height: mask.height,
                  backgroundColor: bgColor,
                }}
              />
            ))}
          </div>

          {/* Translated Paragraphs Layer */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ width: pageSize.width, zIndex: 20 }}
          >
            {isVisionMode ? (
              visionBlocks.map((block, idx) => {
                // Use consistent line height calculation for vision mode (same as regular mode)
                const isNumberedList = /^\s*\d+[\.\)]\s+/.test(block.text)
                let consistentLineHeight
                if (isNumberedList) {
                  consistentLineHeight = 1.0 // Single spacing for numbered lists
                } else {
                  consistentLineHeight = 1.05 // Slightly more than single spacing for regular paragraphs
                }
                return (
                  <div
                    key={`vision-${idx}`}
                    className="absolute"
                    style={{
                      left: `${block.x}%`,
                      top: `${block.y}%`,
                      width: `${block.width}%`,
                      fontSize: block.fontSize,
                      fontWeight: block.fontWeight,
                      fontStyle: block.fontStyle,
                      color: '#000',
                      lineHeight: consistentLineHeight,
                      whiteSpace: 'normal',
                      wordWrap: 'break-word',
                      backgroundColor: bgColor,
                      padding: '2px 4px',
                    }}
                  >
                    {block.text}
                  </div>
                )
              })
            ) : (
              translatedParagraphs.map((para, idx) => {
                if (para.isTableRow && para.cells && para.cells.length > 0) {
                  return para.cells.map((cell, cellIdx) => (
                    <div
                      key={`para-${idx}-cell-${cellIdx}`}
                      style={{
                        position: 'absolute',
                        left: cell.x,
                        top: cell.y,
                        width: cell.width,
                        fontSize: cell.fontSize,
                        fontFamily: cell.fontFamily,
                        fontWeight: cell.fontWeight,
                        fontStyle: cell.fontStyle,
                        color: '#000',
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        backgroundColor: bgColor,
                      }}
                    >
                      {cell.translatedText}
                    </div>
                  ))
                }

                return (
                  <div
                    key={`para-${idx}`}
                    style={{
                      position: 'absolute',
                      left: para.x,
                      top: para.y,
                      width: para.isTableRow ? para.width : undefined,
                      maxWidth: para.isTableRow ? undefined : para.width,
                      fontSize: para.fontSize,
                      fontFamily: para.fontFamily,
                      fontWeight: para.fontWeight,
                      fontStyle: para.fontStyle,
                      color: '#000',
                      lineHeight: para.lineHeight,
                      whiteSpace: para.isTableRow ? 'nowrap' : (para.isList ? 'pre-line' : 'normal'),
                      wordWrap: para.isTableRow ? undefined : 'break-word',
                      backgroundColor: bgColor,
                    }}
                  >
                    {para.translatedText}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
