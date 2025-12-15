import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PdfDocument, Annotation, AppSettings, AnnotationTool, TranslatedTextItem } from '../types'
import type { Paragraph } from '../utils/textUtils'

interface AppState {
  currentDocument: PdfDocument | null
  currentPage: number
  zoom: number
  annotations: Annotation[]
  searchQuery: string
  searchResults: number[]
  isSearchOpen: boolean
  isSettingsOpen: boolean
  settings: AppSettings
  activeTool: AnnotationTool
  activeColor: string
  selectedAnnotationId: string | null
  showTranslationPanel: boolean
  translationPanelPosition: 'left' | 'right'
  translationPanelWidth: number | null
  pageTranslation: string
  isTranslating: boolean
  translatedItems: TranslatedTextItem[]
  isTtsPlaying: boolean
  isTtsPaused: boolean
  currentTtsParagraphIndex: number
  ttsRate: number
  selectedVoiceUri: string | null
  ttsParagraphs: Paragraph[]

  setCurrentDocument: (doc: PdfDocument | null) => void
  setCurrentPage: (page: number) => void
  setZoom: (zoom: number) => void
  addAnnotation: (annotation: Annotation) => void
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void
  removeAnnotation: (id: string) => void
  setSearchQuery: (query: string) => void
  setSearchResults: (results: number[]) => void
  setIsSearchOpen: (open: boolean) => void
  setIsSettingsOpen: (open: boolean) => void
  updateSettings: (settings: Partial<AppSettings>) => void
  setActiveTool: (tool: AnnotationTool) => void
  setActiveColor: (color: string) => void
  setSelectedAnnotationId: (id: string | null) => void
  setShowTranslationPanel: (show: boolean) => void
  setTranslationPanelWidth: (width: number | null) => void
  setPageTranslation: (text: string) => void
  setIsTranslating: (translating: boolean) => void
  setTranslatedItems: (items: TranslatedTextItem[]) => void
  setIsTtsPlaying: (playing: boolean) => void
  setIsTtsPaused: (paused: boolean) => void
  setCurrentTtsParagraphIndex: (index: number) => void
  setTtsRate: (rate: number) => void
  setSelectedVoiceUri: (uri: string | null) => void
  setTtsParagraphs: (paragraphs: Paragraph[]) => void
  stopTts: () => void
}

const defaultSettings: AppSettings = {
  translationService: 'google',
  openRouterApiKey: '',
  openRouterModel: '',
  visionModel: '',
  targetLanguage: 'tr',
  theme: 'system',
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentDocument: null,
      currentPage: 1,
      zoom: 1,
      annotations: [],
      searchQuery: '',
      searchResults: [],
      isSearchOpen: false,
      isSettingsOpen: false,
      settings: defaultSettings,
      activeTool: 'select',
      activeColor: '#ffeb3b',
      selectedAnnotationId: null,
      showTranslationPanel: false,
      translationPanelPosition: 'right',
      translationPanelWidth: null,
      pageTranslation: '',
      isTranslating: false,
      translatedItems: [],
      isTtsPlaying: false,
      isTtsPaused: false,
      currentTtsParagraphIndex: -1,
      ttsRate: 1,
      selectedVoiceUri: null,
      ttsParagraphs: [],

      setCurrentDocument: (doc) => set({ currentDocument: doc, currentPage: 1, annotations: [], pageTranslation: '', translatedItems: [], isTtsPlaying: false, isTtsPaused: false, currentTtsParagraphIndex: -1, ttsParagraphs: [] }),
      setCurrentPage: (page) => set({ currentPage: page, pageTranslation: '', translatedItems: [], isTtsPlaying: false, isTtsPaused: false, currentTtsParagraphIndex: -1, ttsParagraphs: [] }),
      setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(3, zoom)) }),
      addAnnotation: (annotation) =>
        set((state) => ({ annotations: [...state.annotations, annotation] })),
      updateAnnotation: (id, updates) =>
        set((state) => ({
          annotations: state.annotations.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        })),
      removeAnnotation: (id) =>
        set((state) => ({
          annotations: state.annotations.filter((a) => a.id !== id),
          selectedAnnotationId: state.selectedAnnotationId === id ? null : state.selectedAnnotationId,
        })),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSearchResults: (results) => set({ searchResults: results }),
      setIsSearchOpen: (open) => set({ isSearchOpen: open }),
      setIsSettingsOpen: (open) => set({ isSettingsOpen: open }),
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      setActiveTool: (tool) => set({ activeTool: tool, selectedAnnotationId: null }),
      setActiveColor: (color) => set({ activeColor: color }),
      setSelectedAnnotationId: (id) => set({ selectedAnnotationId: id }),
      setShowTranslationPanel: (show) => set({ showTranslationPanel: show, pageTranslation: '', translatedItems: [] }),
      setTranslationPanelWidth: (width) => set({ translationPanelWidth: width }),
      setPageTranslation: (text) => set({ pageTranslation: text }),
      setIsTranslating: (translating) => set({ isTranslating: translating }),
      setTranslatedItems: (items) => set({ translatedItems: items }),
      setIsTtsPlaying: (playing) => set({ isTtsPlaying: playing }),
      setIsTtsPaused: (paused) => set({ isTtsPaused: paused }),
      setCurrentTtsParagraphIndex: (index) => set({ currentTtsParagraphIndex: index }),
      setTtsRate: (rate) => set({ ttsRate: rate }),
      setSelectedVoiceUri: (uri) => set({ selectedVoiceUri: uri }),
      setTtsParagraphs: (paragraphs) => set({ ttsParagraphs: paragraphs }),
      stopTts: () => set({ isTtsPlaying: false, isTtsPaused: false, currentTtsParagraphIndex: -1, ttsParagraphs: [] }),
    }),
    {
      name: 'pdf-reader-storage',
      partialize: (state) => ({ settings: state.settings, annotations: state.annotations, translationPanelWidth: state.translationPanelWidth, ttsRate: state.ttsRate, selectedVoiceUri: state.selectedVoiceUri }),
    }
  )
)
