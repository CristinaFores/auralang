import { useState } from 'react'

interface ApiKeyInputProps {
  value: string
  onChange: (value: string) => void
}

export function ApiKeyInput({ value, onChange }: ApiKeyInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
        OpenAI API Key
      </label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="sk-..."
          autoComplete="off"
          spellCheck={false}
          className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 pr-10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
          aria-label={visible ? 'Hide API key' : 'Show API key'}
        >
          {visible ? '🙈' : '👁️'}
        </button>
      </div>
    </div>
  )
}
