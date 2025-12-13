export interface PdfDocument {
  path: string
  name: string
  totalPages: number
}

export interface Annotation {
  id: string
  pageNumber: number
  type: 'highlight' | 'note' | 'drawing'
  content: string
  position: { x: number; y: number; width: number; height: number }
  color: string
  createdAt: number
  points?: { x: number; y: number }[]
}

export type AnnotationTool = 'select' | 'highlight' | 'note' | 'draw' | 'eraser'

export interface DrawingPath {
  points: { x: number; y: number }[]
  color: string
  width: number
}

export interface Translation {
  id: string
  originalText: string
  translatedText: string
  sourceLang: string
  targetLang: string
  pageNumber: number
  position: { x: number; y: number }
  visible: boolean
}

export interface TranslationService {
  id: 'google' | 'openrouter'
  name: string
  requiresApiKey: boolean
}

export interface AppSettings {
  translationService: 'google' | 'openrouter'
  openRouterApiKey: string
  openRouterModel: string
  targetLanguage: string
  theme: 'light' | 'dark' | 'system'
}
