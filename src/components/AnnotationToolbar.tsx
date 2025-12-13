import { useAppStore } from '../stores/appStore'
import type { AnnotationTool } from '../types'

const tools: { id: AnnotationTool; icon: string; label: string }[] = [
  { id: 'select', icon: 'M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z', label: 'Select' },
  { id: 'highlight', icon: 'M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z', label: 'Highlight' },
  { id: 'note', icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z', label: 'Note' },
  { id: 'draw', icon: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 000-1.41l-2.34-2.34a.996.996 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z', label: 'Draw' },
  { id: 'eraser', icon: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z', label: 'Eraser' },
]

const colors = [
  '#ffeb3b',
  '#ff9800',
  '#f44336',
  '#e91e63',
  '#9c27b0',
  '#2196f3',
  '#4caf50',
]

export function AnnotationToolbar() {
  const { currentDocument, activeTool, activeColor, setActiveTool, setActiveColor } = useAppStore()

  if (!currentDocument) return null

  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-2 flex flex-col gap-1 z-40">
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => setActiveTool(tool.id)}
          className={`p-2 rounded transition-colors ${
            activeTool === tool.id
              ? 'bg-blue-600 text-white'
              : 'hover:bg-gray-700 text-gray-300'
          }`}
          title={tool.label}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d={tool.icon} />
          </svg>
        </button>
      ))}

      {(activeTool === 'highlight' || activeTool === 'draw' || activeTool === 'note') && (
        <>
          <div className="h-px bg-gray-600 my-1" />
          <div className="flex flex-col gap-1">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setActiveColor(color)}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${
                  activeColor === color ? 'border-white scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
