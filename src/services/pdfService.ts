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
      const isBold = fontNameLower.includes('bold') || fontNameLower.includes('black') || fontNameLower.includes('heavy')
      const isItalic = fontNameLower.includes('italic') || fontNameLower.includes('oblique')

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
