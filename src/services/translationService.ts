export interface TranslationResult {
  translatedText: string
  detectedSourceLang?: string
}

export async function translateWithGoogle(
  text: string,
  targetLang: string
): Promise<TranslationResult> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Google Translate request failed')
  }

  const data = await response.json()
  const translatedText = data[0]
    .map((item: [string]) => item[0])
    .join('')
  const detectedSourceLang = data[2]

  return { translatedText, detectedSourceLang }
}

export async function translateWithOpenRouter(
  text: string,
  targetLang: string,
  apiKey: string,
  model: string
): Promise<TranslationResult> {
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

  const targetLanguageName = languageNames[targetLang] || targetLang

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
          role: 'system',
          content: `You are a translator. Translate the given text to ${targetLanguageName}. Only respond with the translation, nothing else.`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error('OpenRouter request failed')
  }

  const data = await response.json()
  const translatedText = data.choices[0]?.message?.content || ''

  return { translatedText }
}

export async function translate(
  text: string,
  targetLang: string,
  service: 'google' | 'openrouter',
  apiKey?: string,
  model?: string
): Promise<TranslationResult> {
  if (service === 'google') {
    return translateWithGoogle(text, targetLang)
  }

  if (!apiKey) {
    throw new Error('OpenRouter API key is required')
  }

  return translateWithOpenRouter(
    text,
    targetLang,
    apiKey,
    model || 'openai/gpt-4o-mini'
  )
}
