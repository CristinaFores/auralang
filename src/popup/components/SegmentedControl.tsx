interface SegmentedOption<T extends string> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string> {
  value: T
  options: SegmentedOption<T>[]
  onChange: (value: T) => void
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div className="flex rounded-xl border border-[var(--border-color)] p-0.5 bg-[var(--surface-bg)]">
      {options.map((option) => {
        const isActive = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex-1 py-2 text-caption font-semibold rounded-lg transition-all ${
              isActive
                ? 'bg-brand-purple text-white shadow-sm'
                : 'bg-transparent text-muted hover:text-[var(--text-primary)]'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
