interface WaveformBarsProps {
  size?: 'sm' | 'lg'
  className?: string
  animated?: boolean
}

export function WaveformBars({ size = 'lg', className = '', animated = true }: WaveformBarsProps) {
  const barWidth = size === 'sm' ? 'w-[3px]' : 'w-2'
  const heights = size === 'sm' ? [5, 8, 11, 8, 5] : [14, 26, 44, 26, 14]

  return (
    <div
      className={`flex shrink-0 items-center justify-center ${size === 'lg' ? 'h-[44px] gap-1' : 'h-3.5 gap-[3px]'} ${className}`}
    >
      {heights.map((h, i) => (
        <span
          key={i}
          className={`${barWidth} shrink-0 origin-center rounded-full bg-brand-purple ${
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
