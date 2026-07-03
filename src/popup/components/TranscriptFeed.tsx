import { useEffect, useRef } from 'react'
import type { TranscriptUpdatePayload } from '../../types'

interface TranscriptFeedProps {
  transcripts: TranscriptUpdatePayload[]
  translatingLabel: string
  // Shown centered when there are no transcripts yet (e.g. "play the video").
  emptyHint?: string
  // Karaoke: original transcription of the line currently being read aloud.
  speakingOriginal: string | null
}

export function TranscriptFeed({
  transcripts,
  translatingLabel,
  emptyHint,
  speakingOriginal,
}: TranscriptFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const speakingRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [transcripts])

  // Follow the spoken line (karaoke) — scroll it into view as playback advances.
  useEffect(() => {
    if (speakingOriginal) speakingRef.current?.scrollIntoView({ block: 'nearest' })
  }, [speakingOriginal])

  return (
    <div className="transcript-feed flex min-h-0 w-full flex-1 flex-col gap-2 overflow-y-auto rounded-xl border border-[var(--border-color)] bg-[var(--surface-elevated)] p-3 text-left">
      {transcripts.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-4 text-center">
          <p className="text-caption text-muted">{emptyHint ?? '···'}</p>
        </div>
      ) : (
        transcripts.map((entry, i) => {
          const isSpeaking = speakingOriginal !== null && entry.original === speakingOriginal
          return (
            <div
              key={i}
              ref={isSpeaking ? speakingRef : undefined}
              className={`flex flex-col gap-0.5 rounded-lg px-2 py-1 transition-colors ${
                isSpeaking ? 'bg-brand-purple/10' : i === transcripts.length - 1 ? '' : 'opacity-70'
              }`}
            >
              <p className="text-caption leading-snug text-muted">{entry.original}</p>
              <p
                className={`text-body leading-snug ${
                  isSpeaking ? 'font-semibold text-brand-purple' : 'text-[var(--text-primary)]'
                }`}
              >
                {entry.translated ?? translatingLabel}
              </p>
            </div>
          )
        })
      )}
      <div ref={bottomRef} />
    </div>
  )
}
