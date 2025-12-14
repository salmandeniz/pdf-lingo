import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PdfDocument, Annotation, AppSettings, AnnotationTool, TranslatedTextItem } from '../types'

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
  pageTranslation: string
  isTranslating: boolean
  translatedItems: TranslatedTextItem[]

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
  setPageTranslation: (text: string) => void
  setIsTranslating: (translating: boolean) => void
  setTranslatedItems: (items: TranslatedTextItem[]) => void
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
      pageTranslation: '',
      isTranslating: false,
      translatedItems: [],

      setCurrentDocument: (doc) => set({ currentDocument: doc, currentPage: 1, annotations: [], pageTranslation: '', translatedItems: [] }),
      setCurrentPage: (page) => set({ currentPage: page, pageTranslation: '', translatedItems: [] }),
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
      setPageTranslation: (text) => set({ pageTranslation: text }),
      setIsTranslating: (translating) => set({ isTranslating: translating }),
      setTranslatedItems: (items) => set({ translatedItems: items }),
    }),
    {
      name: 'pdf-reader-storage',
      partialize: (state) => ({ settings: state.settings, annotations: state.annotations }),
    }
  )
)
