# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PDFlingo is an AI-powered PDF reader desktop application built with Tauri 2.0, React 18, and TypeScript. Key features include PDF viewing, text search, AI translation (Google Translate + OpenRouter), and annotations.

## Commands

```bash
npm run tauri dev      # Start development mode (frontend + Tauri)
npm run tauri build    # Build production app (.app, .dmg)
npm run build          # Build frontend only (TypeScript + Vite)
```

## Architecture

### Tech Stack
- **Desktop**: Tauri 2.0 (Rust backend)
- **Frontend**: React 18 + TypeScript + Vite
- **PDF**: PDF.js (Mozilla)
- **State**: Zustand (persisted)
- **Styling**: Tailwind CSS v4 (Vite plugin)
- **Translation**: Google Translate API + OpenRouter API

### Key Directories
- `src/components/` - React UI components
- `src/services/` - Business logic (PDF rendering, translation)
- `src/stores/` - Zustand state management
- `src/types/` - TypeScript type definitions
- `src-tauri/` - Rust backend and Tauri config

### Data Flow
1. User opens PDF → `pdfService.ts` loads via PDF.js
2. State stored in `appStore.ts` (Zustand)
3. Translation: Ctrl+hover → `translationService.ts` → inline display
4. Annotations stored in Zustand (persisted to localStorage)

### Tauri Plugins Used
- `tauri-plugin-dialog` - File picker
- `tauri-plugin-fs` - File system access

## Translation Feature

- **Google Translate**: Free, uses unofficial API endpoint
- **OpenRouter**: Paid, supports GPT-4, Claude, Gemini models
- **Trigger**: Hold Ctrl + hover over paragraph
- **Display**: Inline below original text, closeable with X button
