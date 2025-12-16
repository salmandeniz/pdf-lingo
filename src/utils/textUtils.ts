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
    fontFamily: string
    fontWeight: 'normal' | 'bold'
    fontStyle: 'normal' | 'italic'
    isList: boolean
}

export function calculateLineHeight(_paragraph: Paragraph): number {
    // Use a consistent line height for all paragraph types
    // This ensures uniform spacing between paragraphs
    return 1.2
}

function getLineNumber(text: string): number | null {
    // Extract the number from patterns like "6. ", "10. ", etc.
    const match = text.match(/^\s*(\d+)[\.\)]\s+/)
    return match ? parseInt(match[1], 10) : null
}

function isNumberedListItem(text: string): boolean {
    // Match patterns like "1. ", "2. ", "10. ", "1) ", "2) ", etc.
    const numberedPattern = /^\s*\d+[\.\)]\s+/
    return numberedPattern.test(text)
}

function isBulletPoint(text: string): boolean {
    // Match bullet points like "• ", "◦ ", "▪ ", "- ", "* ", etc.
    const bulletPattern = /^\s*([•◦▪\-*·▪◊])\s+/
    return bulletPattern.test(text)
}

function isListParagraph(lines: PositionedTextItem[][]): boolean {
    // Check if most lines in the paragraph are list items
    if (lines.length < 2) return false
    
    let listItemCount = 0
    let totalLines = lines.length
    
    for (const line of lines) {
        const lineText = line.map(item => item.str).join(' ').trim()
        if (isNumberedListItem(lineText) || isBulletPoint(lineText)) {
            listItemCount++
        }
    }
    
    // Consider it a list if at least 60% of lines are list items
    return (listItemCount / totalLines) >= 0.6
}

function isSectionHeader(text: string): boolean {
    // Heuristic: short lines that are likely section headers (under 40 chars and no period at end)
    return text.length < 40 && !text.includes('.') && text.trim().length > 0
}

export function groupIntoParagraphs(lines: PositionedTextItem[][]): Paragraph[] {
    if (lines.length === 0) return []

    const paragraphs: Paragraph[] = []
    let currentParagraphLines: PositionedTextItem[][] = [lines[0]]
    
    // Track the current numbered item being processed
    let currentNumberedItem: number | null = getLineNumber(lines[0].map(item => item.str).join(' ').trim())

    for (let i = 1; i < lines.length; i++) {
        const prevLine = lines[i - 1]
        const currLine = lines[i]

        // Calculate previous line metrics
        const prevY = Math.min(...prevLine.map(item => item.y))
        const prevHeight = Math.max(...prevLine.map(item => item.height))
        const prevBottom = prevY + prevHeight
        const prevX = Math.min(...prevLine.map(item => item.x))

        // Calculate current line metrics
        const currY = Math.min(...currLine.map(item => item.y))
        const currFontSize = currLine.reduce((sum, item) => sum + item.fontSize, 0) / currLine.length
        const currX = Math.min(...currLine.map(item => item.x))
        const currText = currLine.map(item => item.str).join(' ').trim()

        // Calculate gap and thresholds
        const gap = currY - prevBottom
        const paragraphGapThreshold = currFontSize * 0.8
        const xDiff = Math.abs(currX - prevX)
        const isNewIndent = xDiff > currFontSize * 2
        
        // Check for numbered list items and section headers
        const isCurrNumbered = isNumberedListItem(currText)
        const currNumber = getLineNumber(currText)
        const isCurrSectionHeader = isSectionHeader(currText)

        // Enhanced decision logic with numbered item state tracking
        let shouldStartNewParagraph = false

        if (gap > paragraphGapThreshold) {
            shouldStartNewParagraph = true
        } else if (isCurrSectionHeader) {
            shouldStartNewParagraph = true
        } else if (isCurrNumbered && currNumber !== currentNumberedItem) {
            shouldStartNewParagraph = true
        } else if (isNewIndent) {
            shouldStartNewParagraph = true
        }

        // Update current numbered item state
        if (isCurrNumbered) {
            currentNumberedItem = currNumber
        }

        if (shouldStartNewParagraph) {
            paragraphs.push(buildParagraph(currentParagraphLines))
            currentParagraphLines = [currLine]
            
            // Reset state for new paragraph
            if (isCurrNumbered) {
                currentNumberedItem = currNumber
            } else {
                currentNumberedItem = null
            }
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
    
    // Detect if this paragraph is a list
    const isList = isListParagraph(lines)
    
    // For lists, preserve line breaks; for regular paragraphs, join with spaces
    const text = isList 
        ? lines
            .map(line => line.sort((a, b) => a.x - b.x).map(item => item.str).join(' '))
            .join('\n')
        : lines
            .map(line => line.sort((a, b) => a.x - b.x).map(item => item.str).join(' '))
            .join(' ')

    const x = Math.min(...allItems.map(item => item.x))
    const y = Math.min(...allItems.map(item => item.y))
    const maxX = Math.max(...allItems.map(item => item.x + item.width))
    const maxY = Math.max(...allItems.map(item => item.y + item.height))
    const avgFontSize = allItems.reduce((sum, item) => sum + item.fontSize, 0) / allItems.length

    const fontCounts = new Map<string, number>()
    allItems.forEach(item => {
        const count = fontCounts.get(item.fontFamily) || 0
        fontCounts.set(item.fontFamily, count + 1)
    })
    const fontFamily = [...fontCounts.entries()]
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'serif'

    const boldCount = allItems.filter(item => item.fontWeight === 'bold').length
    const italicCount = allItems.filter(item => item.fontStyle === 'italic').length
    const fontWeight = boldCount > allItems.length / 2 ? 'bold' : 'normal'
    const fontStyle = italicCount > allItems.length / 2 ? 'italic' : 'normal'

    return {
        lines,
        text,
        x,
        y,
        width: maxX - x,
        height: maxY - y,
        fontSize: avgFontSize,
        fontFamily,
        fontWeight,
        fontStyle,
        isList,
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
