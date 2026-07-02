import { useEffect, useRef } from 'react'
import type { TranscriptUpdatePayload } from '../../types'

interface TranscriptFeedProps {
  transcripts: TranscriptUpdatePayload[]
  translatingLabel: string
}

export function TranscriptFeed({ transcripts, translatingLabel }: TranscriptFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [transcripts])

  return (
    <div className="transcript-feed flex min-h-0 w-full flex-1 flex-col gap-2 overflow-y-auto rounded-xl border border-[var(--border-color)] bg-[var(--surface-elevated)] p-3 text-left">
      {transcripts.length === 0 ? (
        <p className="text-caption text-muted">···</p>
      ) : (
        transcripts.map((entry, i) => (
          <div
            key={i}
            className={`flex flex-col gap-0.5 ${i === transcripts.length - 1 ? '' : 'opacity-70'}`}
          >
            <p className="text-caption leading-snug text-muted">{entry.original}</p>
            <p className="text-body leading-snug text-[var(--text-primary)]">
              {entry.translated ?? translatingLabel}
            </p>
          </div>
        ))
      )}
      <div ref={bottomRef} />
    </div>
  )
}
