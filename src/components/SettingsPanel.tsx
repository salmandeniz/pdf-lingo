import { useState } from 'react'
import { useAppStore } from '../stores/appStore'

export function SettingsPanel() {
  const { isSettingsOpen, setIsSettingsOpen, settings, updateSettings } = useAppStore()
  const [activeTab, setActiveTab] = useState<'translation' | 'aifix'>('translation')

  if (!isSettingsOpen) return null

  const languages = [
    { code: 'tr', name: 'Turkish' },
    { code: 'en', name: 'English' },
    { code: 'de', name: 'German' },
    { code: 'fr', name: 'French' },
    { code: 'es', name: 'Spanish' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ar', name: 'Arabic' },
  ]

  const openRouterModels = [
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
    { id: 'openai/gpt-4o', name: 'GPT-4o' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
    { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku' },
    { id: 'google/gemini-pro', name: 'Gemini Pro' },
    { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B' },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-600 rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="p-2 hover:bg-gray-700 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('translation')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'translation'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Translation
          </button>
          <button
            onClick={() => setActiveTab('aifix')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'aifix'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            AI Fix
          </button>
        </div>

        <div className="p-4 space-y-4">
          {activeTab === 'translation' && (
            <>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Service</label>
                <select
                  value={settings.translationService}
                  onChange={(e) =>
                    updateSettings({ translationService: e.target.value as 'google' | 'openrouter' })
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="google">Google Translate (Free)</option>
                  <option value="openrouter">OpenRouter (AI)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Target Language</label>
                <select
                  value={settings.targetLanguage}
                  onChange={(e) => updateSettings({ targetLanguage: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              {settings.translationService === 'openrouter' && (
                <>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">OpenRouter API Key</label>
                    <input
                      type="password"
                      value={settings.openRouterApiKey}
                      onChange={(e) => updateSettings({ openRouterApiKey: e.target.value })}
                      placeholder="sk-or-..."
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Get your API key from{' '}
                      <a
                        href="https://openrouter.ai/keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        openrouter.ai/keys
                      </a>
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Translation Model</label>
                    <input
                      type="text"
                      list="model-suggestions"
                      value={settings.openRouterModel}
                      onChange={(e) => updateSettings({ openRouterModel: e.target.value })}
                      placeholder="e.g. openai/gpt-4o-mini"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <datalist id="model-suggestions">
                      {openRouterModels.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </datalist>
                  </div>
                </>
              )}

              <div className="pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-400">
                  <strong>Tip:</strong> Hold <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs">Ctrl</kbd> and hover over a paragraph to translate it.
                </p>
              </div>
            </>
          )}

          {activeTab === 'aifix' && (
            <>
              <div>
                <label className="block text-sm text-gray-400 mb-1">OpenRouter API Key</label>
                <input
                  type="password"
                  value={settings.openRouterApiKey}
                  onChange={(e) => updateSettings({ openRouterApiKey: e.target.value })}
                  placeholder="sk-or-..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Required for AI Fix.{' '}
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    Get API key
                  </a>
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Vision Model</label>
                <input
                  type="text"
                  list="vision-model-suggestions"
                  value={settings.visionModel}
                  onChange={(e) => updateSettings({ visionModel: e.target.value })}
                  placeholder="e.g. anthropic/claude-sonnet-4"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <datalist id="vision-model-suggestions">
                  <option value="anthropic/claude-sonnet-4">Claude Sonnet 4</option>
                  <option value="anthropic/claude-opus-4">Claude Opus 4</option>
                  <option value="openai/gpt-4o">GPT-4o</option>
                  <option value="google/gemini-2.0-flash-001">Gemini 2.0 Flash</option>
                </datalist>
                <p className="text-xs text-gray-500 mt-1">
                  Vision-capable model for layout detection.{' '}
                  <a
                    href="https://openrouter.ai/models?q=vision"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    Browse vision models
                  </a>
                </p>
              </div>

              <div className="pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-400">
                  <strong>AI Fix</strong> uses vision AI to detect bold text, paragraphs, and layout from the page image.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
