interface StatusBadgeProps {
  isSaving: boolean
  isSaved: boolean
  error: string | null
}

export function StatusBadge({ isSaving, isSaved, error }: StatusBadgeProps) {
  if (isSaving) {
    return <span className="text-xs text-gray-400 animate-pulse">Saving…</span>
  }
  if (error) {
    return <span className="text-xs text-red-400">{error}</span>
  }
  if (isSaved) {
    return <span className="text-xs text-green-400">Saved ✓</span>
  }
  return null
}
