import type { TranscriptUpdatePayload } from '../../types'

interface LiveCaptionProps {
  transcript: TranscriptUpdatePayload | null
  translatingLabel: string
}

export function LiveCaption({ transcript, translatingLabel }: LiveCaptionProps) {
  return (
    <div className="flex h-16 w-full flex-col justify-center gap-1 overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--surface-elevated)] px-3 py-2 text-left">
      {transcript ? (
        <>
          <p className="line-clamp-1 text-caption text-muted">{transcript.original}</p>
          <p className="line-clamp-1 text-body text-[var(--text-primary)]">
            {transcript.translated ?? translatingLabel}
          </p>
        </>
      ) : (
        <p className="text-caption text-muted">···</p>
      )}
    </div>
  )
}
