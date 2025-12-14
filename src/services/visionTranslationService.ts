export interface VisionTranslatedBlock {
  text: string
  x: number
  y: number
  width: number
  fontSize: number
  fontWeight: 'normal' | 'bold'
  fontStyle: 'normal' | 'italic'
}

export interface VisionTranslationResult {
  blocks: VisionTranslatedBlock[]
  success: boolean
  error?: string
}

const languageNames: Record<string, string> = {
  tr: 'Turkish',
  en: 'English',
  de: 'German',
  fr: 'French',
  es: 'Spanish',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  ar: 'Arabic',
}

export async function translateWithVision(
  canvas: HTMLCanvasElement,
  targetLang: string,
  apiKey: string,
  model: string = 'anthropic/claude-sonnet-4'
): Promise<VisionTranslationResult> {
  const base64Image = canvas.toDataURL('image/png').split(',')[1]
  const targetLanguageName = languageNames[targetLang] || targetLang

  const prompt = `Analyze this document page and translate ALL text to ${targetLanguageName}.

Return a JSON array of text blocks. For each text block, detect:
- The translated text
- Approximate position (x, y as percentage of page width/height, 0-100)
- Approximate width (as percentage of page width, 0-100)
- Font size (estimate: small=14, medium=18, large=24, title=32)
- Whether it's bold or normal
- Whether it's italic or normal

IMPORTANT:
- Preserve the document structure (titles, paragraphs, lists)
- Keep each logical text block separate (don't merge everything)
- Detect bold text from visual appearance

Respond ONLY with valid JSON array, no markdown, no explanation:
[{"text": "translated text", "x": 5, "y": 10, "width": 90, "fontSize": 18, "fontWeight": "bold", "fontStyle": "normal"}]`

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${base64Image}`,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
      max_tokens: 4096,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    return {
      blocks: [],
      success: false,
      error: `API request failed: ${response.status} - ${errorText}`,
    }
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content || ''

  const jsonMatch = content.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    return {
      blocks: [],
      success: false,
      error: 'Could not parse JSON from response',
    }
  }

  const blocks: VisionTranslatedBlock[] = JSON.parse(jsonMatch[0])

  return {
    blocks,
    success: true,
  }
}
