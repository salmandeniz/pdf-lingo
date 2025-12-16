import * as pdfjsLib from 'pdfjs-dist'
import type { PositionedTextItem } from '../types'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

export interface PdfPageInfo {
  pageNumber: number
  width: number
  height: number
}

export class PdfService {
  private document: pdfjsLib.PDFDocumentProxy | null = null

  async loadDocument(data: ArrayBuffer): Promise<number> {
    const loadingTask = pdfjsLib.getDocument({ data })
    this.document = await loadingTask.promise
    return this.document.numPages
  }

  async getPage(pageNumber: number): Promise<pdfjsLib.PDFPageProxy | null> {
    if (!this.document) return null
    return this.document.getPage(pageNumber)
  }

  async renderPage(
    pageNumber: number,
    canvas: HTMLCanvasElement,
    scale: number,
    maxRetries: number = 3
  ): Promise<PdfPageInfo | null> {
    const page = await this.getPage(pageNumber)
    if (!page) return null

    const viewport = page.getViewport({ scale })
    const context = canvas.getContext('2d')
    if (!context) return null

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Set canvas dimensions
        canvas.height = viewport.height
        canvas.width = viewport.width

        // Clear canvas before rendering
        context.clearRect(0, 0, canvas.width, canvas.height)

        // Create render task
        const renderTask = page.render({
          canvasContext: context,
          viewport,
          canvas,
        })

        // Wait for render to complete
        await renderTask.promise
        return {
          pageNumber,
          width: viewport.width,
          height: viewport.height,
        }

      } catch (error) {
        // Handle rendering cancellation by retrying
        if (error && typeof error === 'object' && 'name' in error && error.name === 'RenderingCancelledException') {
          console.log(`Render attempt ${attempt + 1} cancelled, retrying...`)
          if (attempt === maxRetries - 1) {
            console.warn('Max retries reached for render cancellation')
            return null
          }
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 100))
          continue
        } else {
          console.error('Canvas render error:', error)
          throw error
        }
      }
    }

    return null
  }

  async getTextContent(pageNumber: number): Promise<string> {
    const page = await this.getPage(pageNumber)
    if (!page) return ''

    const textContent = await page.getTextContent()
    return textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
  }

  async searchText(query: string): Promise<Map<number, number[]>> {
    const results = new Map<number, number[]>()
    if (!this.document || !query) return results

    const numPages = this.document.numPages
    const lowerQuery = query.toLowerCase()

    for (let i = 1; i <= numPages; i++) {
      const text = await this.getTextContent(i)
      const lowerText = text.toLowerCase()
      const indices: number[] = []
      let idx = lowerText.indexOf(lowerQuery)
      while (idx !== -1) {
        indices.push(idx)
        idx = lowerText.indexOf(lowerQuery, idx + 1)
      }
      if (indices.length > 0) {
        results.set(i, indices)
      }
    }

    return results
  }

  getTotalPages(): number {
    return this.document?.numPages ?? 0
  }

  async getTextItemsWithPositions(
    pageNumber: number,
    scale: number
  ): Promise<{
    items: PositionedTextItem[]
    pageWidth: number
    pageHeight: number
  }> {
    const page = await this.getPage(pageNumber)
    if (!page) {
      return { items: [], pageWidth: 0, pageHeight: 0 }
    }

    const viewport = page.getViewport({ scale })
    const textContent = await page.getTextContent()
    const styles = textContent.styles as Record<string, { fontFamily: string }>

    const items: PositionedTextItem[] = []

    for (const item of textContent.items) {
      if (!('str' in item) || !('transform' in item)) continue
      const textItem = item as { str: string; transform: number[]; width: number; fontName: string }
      if (!textItem.str.trim()) continue

      const tx = textItem.transform[4]
      const ty = textItem.transform[5]
      const fontSize = Math.abs(textItem.transform[0]) || Math.abs(textItem.transform[3]) || 12
      const [x, y] = viewport.convertToViewportPoint(tx, ty)

      const fontStyle = styles[textItem.fontName]
      const fontFamilyFromStyle = fontStyle?.fontFamily || ''
      const fontNameLower = (fontFamilyFromStyle || textItem.fontName || '').toLowerCase()
      
      // Enhanced bold detection - check multiple sources
      let isBold = fontNameLower.includes('bold') || fontNameLower.includes('black') || fontNameLower.includes('heavy')
      let isItalic = fontNameLower.includes('italic') || fontNameLower.includes('oblique')

      // Additional detection for embedded fonts and generic names
      // Many PDFs use font names like "g_d0_f1", "FontFile2", etc.
      if (!isBold && !isItalic) {
        // Check font weight/style hints in the font name itself
        const fontNameParts = textItem.fontName.toLowerCase().split(/[-_]/)
        isBold = fontNameParts.some(part =>
          ['bold', 'black', 'heavy', 'thick', 'b'].includes(part)
        )
        isItalic = fontNameParts.some(part =>
          ['italic', 'oblique', 'slant', 'i'].includes(part)
        )
        
        // Fallback for generic font names: analyze context and patterns
        if (!isBold && !isItalic) {
          const genericFontPattern = /^g_d\d+_f\d+$/.test(textItem.fontName.toLowerCase())
          if (genericFontPattern) {
            // For generic fonts, we might need to analyze the text content and positioning
            // This is a heuristic - short headers often use bold fonts
            const text = textItem.str.trim()
            const isShortHeader = text.length < 50 && !text.includes('.')
            const isAllCaps = text === text.toUpperCase() && text.length > 3
            const hasHeaderKeywords = /\b(Chapter|Section|Introduction|Conclusion|Tips|Guide|Safety|Understanding)\b/i.test(text)
            
            if (isShortHeader || isAllCaps || hasHeaderKeywords) {
              isBold = true // Assume bold for likely headers
            }
          }
        }
      }

      // Debug logging for font detection (only for "Reassurances for Parents" text)
      if (textItem.str.includes('Reassurances for Parents')) {
        const text = textItem.str.trim()
        const isShortHeader = text.length < 50 && !text.includes('.')
        const isAllCaps = text === text.toUpperCase() && text.length > 3
        const hasHeaderKeywords = /\b(Chapter|Section|Introduction|Conclusion|Tips|Guide|Safety|Understanding)\b/i.test(text)
        const genericFontPattern = /^g_d\d+_f\d+$/.test(textItem.fontName.toLowerCase())
        
        console.log(`[PDF Font Detection] Text: "${textItem.str}"`, {
          fontName: textItem.fontName,
          fontFamilyFromStyle,
          fontNameLower,
          isBold,
          isItalic,
          fontSize,
          fullFontName: `${fontFamilyFromStyle || textItem.fontName}`,
          fontNameParts: textItem.fontName.toLowerCase().split(/[-_]/),
          enhancedDetectionApplied: !fontNameLower.includes('bold') && !fontNameLower.includes('italic'),
          heuristicAnalysis: {
            genericFontPattern,
            isShortHeader,
            isAllCaps,
            hasHeaderKeywords,
            textLength: text.length,
            containsPeriod: text.includes('.')
          }
        })
      }

      items.push({
        str: textItem.str,
        x,
        y: y - fontSize * scale,
        width: textItem.width * scale,
        height: fontSize * scale,
        fontSize: fontSize * scale,
        fontFamily: fontFamilyFromStyle || textItem.fontName || 'sans-serif',
        fontWeight: isBold ? 'bold' : 'normal',
        fontStyle: isItalic ? 'italic' : 'normal',
      })
    }

    return {
      items,
      pageWidth: viewport.width,
      pageHeight: viewport.height,
    }
  }

  destroy(): void {
    this.document?.destroy()
    this.document = null
  }
}

export const pdfService = new PdfService()
