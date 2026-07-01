interface WaveformBarsProps {
  className?: string
  animated?: boolean
}

const BAR_HEIGHTS = [14, 26, 44, 26, 14]

export function WaveformBars({ className = '', animated = true }: WaveformBarsProps) {
  return (
    <div className={`flex h-[44px] shrink-0 items-center justify-center gap-1 ${className}`}>
      {BAR_HEIGHTS.map((h, i) => (
        <span
          key={i}
          className={`w-2 shrink-0 origin-center rounded-full bg-brand-purple ${
            animated ? 'animate-waveform' : ''
          }`}
          style={{
            height: `${h}px`,
            animationDelay: animated ? `${i * 0.12}s` : undefined,
          }}
        />
      ))}
    </div>
  )
}
