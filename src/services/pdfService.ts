import * as pdfjsLib from 'pdfjs-dist'

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
    scale: number
  ): Promise<PdfPageInfo | null> {
    const page = await this.getPage(pageNumber)
    if (!page) return null

    const viewport = page.getViewport({ scale })
    const context = canvas.getContext('2d')
    if (!context) return null

    canvas.height = viewport.height
    canvas.width = viewport.width

    await page.render({
      canvasContext: context,
      viewport,
      canvas,
    }).promise

    return {
      pageNumber,
      width: viewport.width,
      height: viewport.height,
    }
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

  destroy(): void {
    this.document?.destroy()
    this.document = null
  }
}

export const pdfService = new PdfService()
