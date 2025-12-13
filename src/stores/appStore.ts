import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PdfDocument, Annotation, Translation, AppSettings, AnnotationTool } from '../types'

interface AppState {
  currentDocument: PdfDocument | null
  currentPage: number
  zoom: number
  annotations: Annotation[]
  translations: Translation[]
  searchQuery: string
  searchResults: number[]
  isSearchOpen: boolean
  isSettingsOpen: boolean
  isCtrlPressed: boolean
  settings: AppSettings
  activeTool: AnnotationTool
  activeColor: string
  selectedAnnotationId: string | null

  setCurrentDocument: (doc: PdfDocument | null) => void
  setCurrentPage: (page: number) => void
  setZoom: (zoom: number) => void
  addAnnotation: (annotation: Annotation) => void
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void
  removeAnnotation: (id: string) => void
  addTranslation: (translation: Translation) => void
  removeTranslation: (id: string) => void
  clearTranslations: () => void
  setSearchQuery: (query: string) => void
  setSearchResults: (results: number[]) => void
  setIsSearchOpen: (open: boolean) => void
  setIsSettingsOpen: (open: boolean) => void
  setIsCtrlPressed: (pressed: boolean) => void
  updateSettings: (settings: Partial<AppSettings>) => void
  setActiveTool: (tool: AnnotationTool) => void
  setActiveColor: (color: string) => void
  setSelectedAnnotationId: (id: string | null) => void
}

const defaultSettings: AppSettings = {
  translationService: 'google',
  openRouterApiKey: '',
  openRouterModel: 'openai/gpt-4o-mini',
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
      translations: [],
      searchQuery: '',
      searchResults: [],
      isSearchOpen: false,
      isSettingsOpen: false,
      isCtrlPressed: false,
      settings: defaultSettings,
      activeTool: 'select',
      activeColor: '#ffeb3b',
      selectedAnnotationId: null,

      setCurrentDocument: (doc) => set({ currentDocument: doc, currentPage: 1, annotations: [] }),
      setCurrentPage: (page) => set({ currentPage: page }),
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
      addTranslation: (translation) =>
        set((state) => ({ translations: [...state.translations, translation] })),
      removeTranslation: (id) =>
        set((state) => ({
          translations: state.translations.filter((t) => t.id !== id),
        })),
      clearTranslations: () => set({ translations: [] }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSearchResults: (results) => set({ searchResults: results }),
      setIsSearchOpen: (open) => set({ isSearchOpen: open }),
      setIsSettingsOpen: (open) => set({ isSettingsOpen: open }),
      setIsCtrlPressed: (pressed) => set({ isCtrlPressed: pressed }),
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      setActiveTool: (tool) => set({ activeTool: tool, selectedAnnotationId: null }),
      setActiveColor: (color) => set({ activeColor: color }),
      setSelectedAnnotationId: (id) => set({ selectedAnnotationId: id }),
    }),
    {
      name: 'pdf-reader-storage',
      partialize: (state) => ({ settings: state.settings, annotations: state.annotations }),
    }
  )
)
