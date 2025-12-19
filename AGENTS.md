# AGENTS.md

## Commands
```bash
npm run tauri dev      # Dev mode (frontend + Tauri)
npm run build          # Build frontend (TypeScript + Vite)
npm run tauri build    # Build production app
```
No test framework configured.

## Code Style
- **No comments** in code
- **No try-catch** in business logic (let errors propagate)
- **TypeScript strict mode** enabled with `noUnusedLocals` and `noUnusedParameters`
- **Imports**: React hooks from 'react', local imports use relative paths (`../stores/appStore`)
- **Components**: Named exports as function declarations (`export function PdfViewer()`)
- **Services**: Classes with singleton export (`export const pdfService = new PdfService()`)
- **State**: Zustand with persist middleware, interfaces define state shape
- **Types**: Defined in `src/types/index.ts`, use `type` imports for type-only imports
- **Naming**: PascalCase for components/types, camelCase for functions/variables
- **Styling**: Tailwind CSS v4 with inline classes, no separate CSS modules
- **Error handling**: Console.error for logging, throw for fatal errors
- **Tests**: Use BDD `given_when_then` naming (lowercase method names)
- **Commits**: No signatures in commit messages
