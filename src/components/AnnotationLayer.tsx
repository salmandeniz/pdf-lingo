import { useRef, useState, useEffect, useCallback } from 'react'
import { useAppStore } from '../stores/appStore'

interface AnnotationLayerProps {
  width: number
  height: number
  pageNumber: number
}

export function AnnotationLayer({ width, height, pageNumber }: AnnotationLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([])
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null)
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [noteInput, setNoteInput] = useState<{ x: number; y: number; text: string } | null>(null)

  const {
    annotations,
    activeTool,
    activeColor,
    selectedAnnotationId,
    addAnnotation,
    removeAnnotation,
    setSelectedAnnotationId,
  } = useAppStore()

  const pageAnnotations = annotations.filter((a) => a.pageNumber === pageNumber)

  const drawAnnotations = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, width, height)

    pageAnnotations.forEach((annotation) => {
      ctx.globalAlpha = 0.4

      if (annotation.type === 'highlight') {
        ctx.fillStyle = annotation.color
        ctx.fillRect(
          annotation.position.x,
          annotation.position.y,
          annotation.position.width,
          annotation.position.height
        )
      } else if (annotation.type === 'drawing' && annotation.points) {
        ctx.globalAlpha = 1
        ctx.strokeStyle = annotation.color
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        annotation.points.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y)
          } else {
            ctx.lineTo(point.x, point.y)
          }
        })
        ctx.stroke()
      } else if (annotation.type === 'note') {
        ctx.globalAlpha = 1
        ctx.fillStyle = annotation.color
        ctx.beginPath()
        ctx.arc(annotation.position.x + 12, annotation.position.y + 12, 12, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#000'
        ctx.font = 'bold 14px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('!', annotation.position.x + 12, annotation.position.y + 12)
      }

      if (selectedAnnotationId === annotation.id) {
        ctx.globalAlpha = 1
        ctx.strokeStyle = '#2196f3'
        ctx.lineWidth = 2
        ctx.setLineDash([4, 4])
        ctx.strokeRect(
          annotation.position.x - 2,
          annotation.position.y - 2,
          annotation.position.width + 4,
          annotation.position.height + 4
        )
        ctx.setLineDash([])
      }
    })

    if (selectionRect && (activeTool === 'highlight' || activeTool === 'note')) {
      ctx.globalAlpha = 0.3
      ctx.fillStyle = activeColor
      ctx.fillRect(selectionRect.x, selectionRect.y, selectionRect.width, selectionRect.height)
      ctx.globalAlpha = 1
      ctx.strokeStyle = activeColor
      ctx.lineWidth = 1
      ctx.strokeRect(selectionRect.x, selectionRect.y, selectionRect.width, selectionRect.height)
    }

    if (currentPath.length > 1 && activeTool === 'draw') {
      ctx.globalAlpha = 1
      ctx.strokeStyle = activeColor
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      currentPath.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y)
        } else {
          ctx.lineTo(point.x, point.y)
        }
      })
      ctx.stroke()
    }
  }, [pageAnnotations, width, height, selectionRect, currentPath, activeTool, activeColor, selectedAnnotationId])

  useEffect(() => {
    drawAnnotations()
  }, [drawAnnotations])

  const getMousePos = (e: React.MouseEvent): { x: number; y: number } => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getMousePos(e)

    if (activeTool === 'select') {
      const clicked = pageAnnotations.find((a) => {
        return (
          pos.x >= a.position.x &&
          pos.x <= a.position.x + a.position.width &&
          pos.y >= a.position.y &&
          pos.y <= a.position.y + a.position.height
        )
      })
      setSelectedAnnotationId(clicked?.id || null)
      return
    }

    if (activeTool === 'eraser') {
      const clicked = pageAnnotations.find((a) => {
        if (a.type === 'drawing' && a.points) {
          return a.points.some(
            (p) => Math.abs(p.x - pos.x) < 10 && Math.abs(p.y - pos.y) < 10
          )
        }
        return (
          pos.x >= a.position.x &&
          pos.x <= a.position.x + a.position.width &&
          pos.y >= a.position.y &&
          pos.y <= a.position.y + a.position.height
        )
      })
      if (clicked) {
        removeAnnotation(clicked.id)
      }
      return
    }

    if (activeTool === 'draw') {
      setIsDrawing(true)
      setCurrentPath([pos])
      return
    }

    if (activeTool === 'highlight' || activeTool === 'note') {
      setSelectionStart(pos)
      setSelectionRect({ x: pos.x, y: pos.y, width: 0, height: 0 })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getMousePos(e)

    if (activeTool === 'draw' && isDrawing) {
      setCurrentPath((prev) => [...prev, pos])
    }

    if ((activeTool === 'highlight' || activeTool === 'note') && selectionStart) {
      setSelectionRect({
        x: Math.min(selectionStart.x, pos.x),
        y: Math.min(selectionStart.y, pos.y),
        width: Math.abs(pos.x - selectionStart.x),
        height: Math.abs(pos.y - selectionStart.y),
      })
    }
  }

  const handleMouseUp = () => {
    if (activeTool === 'draw' && isDrawing && currentPath.length > 1) {
      const bounds = currentPath.reduce(
        (acc, p) => ({
          minX: Math.min(acc.minX, p.x),
          minY: Math.min(acc.minY, p.y),
          maxX: Math.max(acc.maxX, p.x),
          maxY: Math.max(acc.maxY, p.y),
        }),
        { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
      )

      addAnnotation({
        id: crypto.randomUUID(),
        pageNumber,
        type: 'drawing',
        content: '',
        position: {
          x: bounds.minX,
          y: bounds.minY,
          width: bounds.maxX - bounds.minX,
          height: bounds.maxY - bounds.minY,
        },
        color: activeColor,
        createdAt: Date.now(),
        points: currentPath,
      })
      setCurrentPath([])
      setIsDrawing(false)
    }

    if (activeTool === 'highlight' && selectionRect && selectionRect.width > 5 && selectionRect.height > 5) {
      addAnnotation({
        id: crypto.randomUUID(),
        pageNumber,
        type: 'highlight',
        content: '',
        position: selectionRect,
        color: activeColor,
        createdAt: Date.now(),
      })
    }

    if (activeTool === 'note' && selectionRect && selectionRect.width > 5 && selectionRect.height > 5) {
      setNoteInput({ x: selectionRect.x, y: selectionRect.y, text: '' })
    }

    setSelectionStart(null)
    setSelectionRect(null)
  }

  const handleNoteSubmit = () => {
    if (noteInput && noteInput.text.trim()) {
      addAnnotation({
        id: crypto.randomUUID(),
        pageNumber,
        type: 'note',
        content: noteInput.text,
        position: { x: noteInput.x, y: noteInput.y, width: 24, height: 24 },
        color: activeColor,
        createdAt: Date.now(),
      })
    }
    setNoteInput(null)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedAnnotationId && !noteInput) {
          removeAnnotation(selectedAnnotationId)
        }
      }
      if (e.key === 'Escape') {
        setSelectedAnnotationId(null)
        setNoteInput(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedAnnotationId, noteInput, removeAnnotation, setSelectedAnnotationId])

  return (
    <>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute top-0 left-0 pointer-events-auto"
        style={{ cursor: activeTool === 'select' ? 'default' : activeTool === 'eraser' ? 'crosshair' : 'crosshair' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {noteInput && (
        <div
          className="absolute bg-gray-800 border border-gray-600 rounded-lg p-2 shadow-xl z-50"
          style={{ left: noteInput.x, top: noteInput.y + 30 }}
        >
          <textarea
            value={noteInput.text}
            onChange={(e) => setNoteInput({ ...noteInput, text: e.target.value })}
            placeholder="Enter your note..."
            className="w-48 h-20 bg-gray-700 border border-gray-600 rounded p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setNoteInput(null)}
              className="px-3 py-1 text-sm text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleNoteSubmit}
              className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {pageAnnotations.filter((a) => a.type === 'note').map((note) => (
        <div
          key={`tooltip-${note.id}`}
          className="absolute group"
          style={{ left: note.position.x, top: note.position.y }}
        >
          <div className="hidden group-hover:block absolute left-8 top-0 bg-gray-800 border border-gray-600 rounded-lg p-2 shadow-xl z-50 min-w-[150px] max-w-[250px]">
            <p className="text-sm whitespace-pre-wrap">{note.content}</p>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(note.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </>
  )
}
