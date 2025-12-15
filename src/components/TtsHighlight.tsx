import type { Paragraph } from '../utils/textUtils'

interface TtsHighlightProps {
  paragraph: Paragraph
}

export function TtsHighlight({ paragraph }: TtsHighlightProps) {
  return (
    <div
      className="absolute pointer-events-none transition-all duration-300 ease-in-out"
      style={{
        left: paragraph.x - 4,
        top: paragraph.y - 4,
        width: paragraph.width + 8,
        height: paragraph.height + 8,
        backgroundColor: 'rgba(255, 200, 0, 0.25)',
        borderRadius: 4,
        border: '2px solid rgba(255, 200, 0, 0.5)',
      }}
    />
  )
}
