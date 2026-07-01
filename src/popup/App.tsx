import { useApiConfig } from './hooks/useApiConfig'
import { useTranslation } from './hooks/useTranslation'
import { StatusBadge } from './components/StatusBadge'

const LANGUAGES = [
  { code: 'es', label: 'Spanish' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'it', label: 'Italian' },
  { code: 'ja', label: 'Japanese' },
  { code: 'zh', label: 'Chinese' },
]

export default function App() {
  const { config, isSaving, isSaved, error: saveError, updateField, save } = useApiConfig()
  const { state: translation, toggle } = useTranslation(config)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void save()
  }

  return (
    <div className="w-80 bg-gray-900 text-white p-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-sm">
          🎙
        </div>
        <h1 className="font-semibold text-base">AuraLang</h1>
        {translation.isActive && (
          <span className="ml-auto text-xs text-red-400 animate-pulse">Live ●</span>
        )}
        {!translation.isActive && translation.isModelReady && (
          <span className="ml-auto text-xs text-green-400">Model ready ✓</span>
        )}
        {!translation.isModelReady && (
          <span className="ml-auto text-xs text-yellow-400 animate-pulse">Loading model…</span>
        )}
      </div>

      {/* Language selector */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Audio language
          </label>
          <select
            value={config.sourceLanguage}
            onChange={(e) => updateField('sourceLanguage', e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Translate to
          </label>
          <select
            value={config.targetLanguage}
            onChange={(e) => updateField('targetLanguage', e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between">
          <StatusBadge isSaving={isSaving} isSaved={isSaved} error={saveError} />
          <button
            type="submit"
            disabled={isSaving}
            className="ml-auto bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
          >
            Save
          </button>
        </div>
      </form>

      {/* Translation toggle */}
      <div className="border-t border-gray-800 pt-4 flex flex-col gap-2">
        <button
          onClick={toggle}
          disabled={!translation.isModelReady || translation.isLoading}
          className={`w-full text-sm font-medium py-2 rounded-md transition-colors ${
            translation.isActive
              ? 'bg-red-600 hover:bg-red-500 text-white'
              : 'bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white'
          }`}
        >
          {translation.isLoading
            ? 'Connecting…'
            : translation.isActive
              ? 'Stop Translation'
              : 'Start Translation'}
        </button>

        {translation.error && (
          <p className="text-xs text-red-400 text-center">{translation.error}</p>
        )}

        {!translation.isModelReady && (
          <p className="text-center text-xs text-gray-600">
            Downloading Whisper model (~75MB)…
          </p>
        )}
      </div>
    </div>
  )
}
