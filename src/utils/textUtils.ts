import type { PositionedTextItem } from '../types'

export interface LineGeometry {
    mask: {
        x: number
        y: number
        width: number
        height: number
    }
    bounds: {
        text: string
        x: number
        y: number
        width: number
        fontSize: number
    }
}

export function getBackgroundColor(canvas: HTMLCanvasElement): string {
    const ctx = canvas.getContext('2d')
    if (!ctx) return 'rgb(255, 255, 255)'
    // Sample a few pixels to be safer, but top-left (5,5) is usually fine for docs
    const pixel = ctx.getImageData(5, 5, 1, 1).data
    return `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`
}

export function groupIntoLines(items: PositionedTextItem[]): PositionedTextItem[][] {
    if (items.length === 0) return []

    const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x)
    const lines: PositionedTextItem[][] = []
    let currentLine: PositionedTextItem[] = [sorted[0]]
    let currentY = sorted[0].y

    for (let i = 1; i < sorted.length; i++) {
        const item = sorted[i]
        const yTolerance = (currentLine[0].fontSize || item.fontSize) * 0.5

        if (Math.abs(item.y - currentY) <= yTolerance) {
            currentLine.push(item)
        } else {
            lines.push(currentLine)
            currentLine = [item]
            currentY = item.y
        }
    }

    if (currentLine.length > 0) {
        lines.push(currentLine)
    }

    return lines
}

export interface Paragraph {
    lines: PositionedTextItem[][]
    text: string
    x: number
    y: number
    width: number
    height: number
    fontSize: number
}

export function groupIntoParagraphs(lines: PositionedTextItem[][]): Paragraph[] {
    if (lines.length === 0) return []

    const paragraphs: Paragraph[] = []
    let currentParagraphLines: PositionedTextItem[][] = [lines[0]]

    for (let i = 1; i < lines.length; i++) {
        const prevLine = lines[i - 1]
        const currLine = lines[i]

        const prevY = Math.min(...prevLine.map(item => item.y))
        const prevHeight = Math.max(...prevLine.map(item => item.height))
        const prevBottom = prevY + prevHeight

        const currY = Math.min(...currLine.map(item => item.y))
        const currFontSize = currLine.reduce((sum, item) => sum + item.fontSize, 0) / currLine.length

        const gap = currY - prevBottom
        const paragraphGapThreshold = currFontSize * 0.8

        const prevX = Math.min(...prevLine.map(item => item.x))
        const currX = Math.min(...currLine.map(item => item.x))
        const xDiff = Math.abs(currX - prevX)
        const isNewIndent = xDiff > currFontSize * 2

        if (gap > paragraphGapThreshold || isNewIndent) {
            paragraphs.push(buildParagraph(currentParagraphLines))
            currentParagraphLines = [currLine]
        } else {
            currentParagraphLines.push(currLine)
        }
    }

    if (currentParagraphLines.length > 0) {
        paragraphs.push(buildParagraph(currentParagraphLines))
    }

    return paragraphs
}

function buildParagraph(lines: PositionedTextItem[][]): Paragraph {
    const allItems = lines.flat()
    const text = lines
        .map(line => line.sort((a, b) => a.x - b.x).map(item => item.str).join(' '))
        .join(' ')

    const x = Math.min(...allItems.map(item => item.x))
    const y = Math.min(...allItems.map(item => item.y))
    const maxX = Math.max(...allItems.map(item => item.x + item.width))
    const maxY = Math.max(...allItems.map(item => item.y + item.height))
    const avgFontSize = allItems.reduce((sum, item) => sum + item.fontSize, 0) / allItems.length

    return {
        lines,
        text,
        x,
        y,
        width: maxX - x,
        height: maxY - y,
        fontSize: avgFontSize,
    }
}

export function calculateLineGeometry(
    lineItems: PositionedTextItem[],
    pageWidth: number
): LineGeometry {
    // Sort by X to get correct text order and bounds
    const sortedByX = [...lineItems].sort((a, b) => a.x - b.x)

    const minX = sortedByX[0].x
    // We want the visual bottom/top, but the items usually have y as baseline or bottom-left.
    // Assuming y is bottom-left based on pdf.js usually.
    const minY = Math.min(...lineItems.map((item) => item.y))

    // For mask height, we want to cover the tallest item
    const maxHeight = Math.max(...lineItems.map((item) => item.height))

    // Calculate average font size for the translated text style
    const avgFontSize =
        lineItems.reduce((sum, item) => sum + item.fontSize, 0) / lineItems.length

    const text = sortedByX.map((item) => item.str).join(' ')

    const padding = 6

    return {
        mask: {
            x: minX - padding,
            y: minY - padding,
            width: pageWidth - minX + padding,
            height: maxHeight + padding * 2,
        },
        bounds: {
            text,
            x: minX,
            y: minY,
            width: pageWidth - minX - 20, // Leaving some margin on the right
            fontSize: avgFontSize,
        },
    }
}

export async function concurrentMap<T, R>(
    items: T[],
    concurrency: number,
    fn: (item: T) => Promise<R>
): Promise<R[]> {
    const results: R[] = new Array(items.length)
    const iterator = items.entries()

    const workers = new Array(Math.min(concurrency, items.length))
        .fill(null)
        .map(async () => {
            for (const [index, item] of iterator) {
                try {
                    results[index] = await fn(item)
                } catch (error) {
                    // Log error but don't crash other workers
                    console.error(`Error processing item ${index}`, error)
                    throw error // Re-throw to be caught by Promise.all if we want to fail fast, or handle gracefully
                }
            }
        })

    await Promise.all(workers)
    return results
}
