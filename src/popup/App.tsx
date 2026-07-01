import { useApiConfig } from './hooks/useApiConfig'
import { ApiKeyInput } from './components/ApiKeyInput'
import { StatusBadge } from './components/StatusBadge'

export default function App() {
  const { config, isSaving, isSaved, error, updateField, save } = useApiConfig()

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
        <span className="ml-auto text-xs text-gray-500">BYOK</span>
      </div>

      {/* Config form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <ApiKeyInput
          value={config.openaiKey}
          onChange={(v) => updateField('openaiKey', v)}
        />

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Target Language
          </label>
          <select
            value={config.targetLanguage}
            onChange={(e) => updateField('targetLanguage', e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="es">Spanish</option>
            <option value="en">English</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="pt">Portuguese</option>
            <option value="it">Italian</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <StatusBadge isSaving={isSaving} isSaved={isSaved} error={error} />
          <button
            type="submit"
            disabled={isSaving || !config.openaiKey.trim()}
            className="ml-auto bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
          >
            Save
          </button>
        </div>
      </form>

      {/* Translation toggle — wired in Phase 3 */}
      <div className="border-t border-gray-800 pt-4">
        <button
          disabled
          className="w-full bg-gray-800 text-gray-500 text-sm font-medium py-2 rounded-md cursor-not-allowed"
        >
          Start Translation
        </button>
        <p className="text-center text-xs text-gray-600 mt-2">
          Save your API key first
        </p>
      </div>
    </div>
  )
}
