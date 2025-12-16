import type { PositionedTextItem } from '../types'

export interface BoldTestResult {
  isBold: boolean
  confidence: number
  fontName: string
  detectedWeight: 'normal' | 'bold'
  method: 'font-name' | 'visual-comparison'
}

/**
 * Test if text appears bold based on PDF font information
 */
export function testBoldFromFontInfo(items: PositionedTextItem[]): BoldTestResult {
  if (items.length === 0) {
    return {
      isBold: false,
      confidence: 0,
      fontName: 'unknown',
      detectedWeight: 'normal',
      method: 'font-name'
    }
  }

  // Get the most common font information
  const fontCounts = new Map<string, number>()
  const boldCounts = new Map<string, number>()

  items.forEach(item => {
    const fontKey = `${item.fontFamily}-${item.fontWeight}`
    fontCounts.set(fontKey, (fontCounts.get(fontKey) || 0) + 1)
    
    if (item.fontWeight === 'bold') {
      boldCounts.set(fontKey, (boldCounts.get(fontKey) || 0) + 1)
    }
  })

  // Find the most common font
  const mostCommonFont = [...fontCounts.entries()]
    .sort((a, b) => b[1] - a[1])[0]

  if (!mostCommonFont) {
    return {
      isBold: false,
      confidence: 0,
      fontName: 'unknown',
      detectedWeight: 'normal',
      method: 'font-name'
    }
  }

  const [fontKey, count] = mostCommonFont
  const [fontFamily, fontWeight] = fontKey.split('-')
  const boldCount = boldCounts.get(fontKey) || 0
  const confidence = count / items.length

  const isBold = fontWeight === 'bold' && boldCount > items.length / 2

  return {
    isBold,
    confidence,
    fontName: fontFamily,
    detectedWeight: fontWeight as 'normal' | 'bold',
    method: 'font-name'
  }
}

/**
 * Test if text appears bold by comparing rendered font weights
 * This is a more advanced test that could be implemented with canvas rendering
 */
export function testBoldVisually(
  canvas: HTMLCanvasElement,
  textItems: PositionedTextItem[]
): BoldTestResult {
  // This would require more complex canvas-based font rendering comparison
  // For now, return the font-based result
  return testBoldFromFontInfo(textItems)
}

/**
 * Comprehensive bold test that combines multiple detection methods
 */
export function comprehensiveBoldTest(
  items: PositionedTextItem[],
  canvas?: HTMLCanvasElement
): BoldTestResult {
  const fontResult = testBoldFromFontInfo(items)
  
  // If we have canvas for visual testing, we could add that here
  if (canvas) {
    const visualResult = testBoldVisually(canvas, items)
    // Combine results with confidence weighting
    if (visualResult.confidence > fontResult.confidence) {
      return visualResult
    }
  }

  return fontResult
}

/**
 * Utility function to check if a specific text is bold in the PDF
 */
export function checkTextBoldStatus(
  allItems: PositionedTextItem[],
  targetText: string
): BoldTestResult {
  // Find items that contain the target text
  const matchingItems = allItems.filter(item => 
    item.str.toLowerCase().includes(targetText.toLowerCase())
  )

  if (matchingItems.length === 0) {
    return {
      isBold: false,
      confidence: 0,
      fontName: 'not-found',
      detectedWeight: 'normal',
      method: 'font-name'
    }
  }

  return comprehensiveBoldTest(matchingItems)
}