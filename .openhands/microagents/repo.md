# PDF Lingo

PDF Lingo is a cross-platform desktop PDF reader application built with Tauri 2, React 19, and TypeScript. It provides PDF viewing capabilities with integrated translation features (Google Translate and OpenRouter AI), text-to-speech (TTS), annotations (highlighting, drawing, text notes), and search functionality.

## File Structure

- **`src/`** - React frontend code
  - `components/` - UI components (PdfViewer, Toolbar, SearchPanel, SettingsPanel, AnnotationToolbar, TranslationPanel, TtsControls)
  - `services/` - Business logic (pdfService, translationService, ttsService, visionTranslationService)
  - `stores/` - Zustand state management (appStore.ts)
  - `types/` - TypeScript type definitions
  - `utils/` - Utility functions
- **`src-tauri/`** - Rust backend (Tauri)
  - `src/` - Rust source files (main.rs, lib.rs)
  - `tauri.conf.json` - Tauri configuration
  - `Cargo.toml` - Rust dependencies
- **`public/`** - Static assets

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server (web only)
npm run dev:tauri    # Start Tauri development mode (desktop app)
npm run build        # Build for production
npm run preview      # Preview production build
```

## Key Technologies

- **Tauri 2** - Desktop app framework with Rust backend
- **React 19** - UI framework
- **Zustand** - State management with persistence
- **PDF.js** - PDF rendering
- **Tailwind CSS 4** - Styling
- **Vite 7** - Build tool

## Notes for Developers

- The app uses Tauri plugins for file dialogs (`@tauri-apps/plugin-dialog`) and filesystem access (`@tauri-apps/plugin-fs`)
- Translation supports both free Google Translate API and OpenRouter AI models
- State is persisted to local storage via Zustand's persist middleware
- The app requires Rust toolchain for Tauri development
