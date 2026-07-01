import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getLanguageLabel } from '../i18n'
import type { UiLanguage } from '../../types'
import { LANGUAGES } from '../../constants/languages'
import { useClickOutside } from '../hooks/useClickOutside'
import { normalizeSearch } from '../utils/search'
import { CheckIcon, ChevronDownIcon, SearchIcon } from './Icons'

interface LanguageSelectProps {
  label: string
  value: string
  uiLanguage: UiLanguage
  searchPlaceholder: string
  noResultsText: string
  onChange: (value: string) => void
  disabled?: boolean
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  placement?: 'top' | 'bottom'
}

export function LanguageSelect({
  label,
  value,
  uiLanguage,
  searchPlaceholder,
  noResultsText,
  onChange,
  disabled,
  isOpen,
  onOpenChange,
  placement = 'bottom',
}: LanguageSelectProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')

  const selectedLabel = getLanguageLabel(value, uiLanguage)

  const options = useMemo(
    () =>
      LANGUAGES.map((lang) => ({
        code: lang.code,
        label: getLanguageLabel(lang.code, uiLanguage),
      })),
    [uiLanguage],
  )

  const filtered = useMemo(() => {
    const normalized = normalizeSearch(query)
    if (!normalized) return options
    return options.filter(
      (option) =>
        normalizeSearch(option.label).includes(normalized) ||
        normalizeSearch(option.code).includes(normalized),
    )
  }, [options, query])

  const closeDropdown = useCallback(() => {
    setQuery('')
    onOpenChange(false)
  }, [onOpenChange])

  useClickOutside(rootRef, closeDropdown, isOpen)

  useEffect(() => {
    if (!isOpen) return
    searchRef.current?.focus()
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        closeDropdown()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closeDropdown])

  const handleSelect = (code: string) => {
    onChange(code)
    closeDropdown()
  }

  const panelPosition =
    placement === 'top'
      ? 'bottom-[calc(100%+6px)] dropdown-panel-up'
      : 'top-[calc(100%+6px)] dropdown-panel-down'

  return (
    <div ref={rootRef} className="flex flex-col gap-1.5">
      <span className="text-caption font-medium text-muted">{label}</span>

      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onClick={() => {
            if (isOpen) {
              closeDropdown()
              return
            }
            onOpenChange(true)
          }}
          className={`flex w-full items-center justify-between gap-3 rounded-xl border bg-[var(--surface-elevated)] px-3.5 py-3 text-left text-body text-[var(--text-primary)] shadow-[var(--surface-shadow)] transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
            isOpen
              ? 'border-brand-purple ring-2 ring-brand-purple/20'
              : 'border-[var(--border-color)] hover:border-brand-purple/40'
          }`}
        >
          <span className="truncate flex-1 min-w-0">{selectedLabel}</span>
          <ChevronDownIcon
            size={16}
            className={`shrink-0 text-muted transition-transform duration-200 ${isOpen ? 'rotate-180 text-brand-purple' : ''}`}
          />
        </button>

        {isOpen && (
          <div
            className={`dropdown-panel absolute left-0 right-0 z-30 flex flex-col overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--surface-elevated)] shadow-[0_12px_32px_rgba(15,23,42,0.18)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.45)] ${panelPosition}`}
          >
            <div className="p-2 border-b border-[var(--border-color)]">
              <div className="relative flex items-center">
                <span className="pointer-events-none absolute left-3 inline-flex items-center justify-center text-muted">
                  <SearchIcon size={16} />
                </span>
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--surface-bg)] py-2 pl-9 pr-3 text-body text-[var(--text-primary)] placeholder:text-muted focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
                />
              </div>
            </div>

            <ul role="listbox" className="dropdown-list max-h-36 overflow-y-auto p-1.5">
              {filtered.length === 0 ? (
                <li className="px-3 py-4 text-center text-caption text-muted">{noResultsText}</li>
              ) : (
                filtered.map((option) => {
                  const isSelected = option.code === value
                  return (
                    <li key={option.code} role="option" aria-selected={isSelected}>
                      <button
                        type="button"
                        onClick={() => handleSelect(option.code)}
                        className={`w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-body transition-colors ${
                          isSelected
                            ? 'bg-brand-purple/15 text-brand-purple font-medium'
                            : 'text-[var(--text-primary)] hover:bg-brand-purple/10'
                        }`}
                      >
                        <span className="truncate text-left">{option.label}</span>
                        {isSelected && <CheckIcon size={16} className="shrink-0 text-brand-purple" />}
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
