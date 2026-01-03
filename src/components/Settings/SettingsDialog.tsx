import { useUIStore } from '@/stores/uiStore';
import { useSettingsStore } from '@/stores/settingsStore';

export function SettingsDialog() {
  const closeDialog = useUIStore((state) => state.closeDialog);
  const settings = useSettingsStore((state) => state.settings);
  const updateSettings = useSettingsStore((state) => state.updateSettings);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[480px] max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Settings
          </h2>

          <div className="space-y-6">
            {/* Appearance */}
            <section>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                Appearance
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Dark Mode
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Use dark theme for the interface
                    </p>
                  </div>
                  <button
                    onClick={() => updateSettings({ darkMode: !settings.darkMode })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      settings.darkMode ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.darkMode ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </section>

            {/* Preferences */}
            <section>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                Preferences
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Units
                  </label>
                  <select
                    value={settings.units}
                    onChange={(e) => updateSettings({ units: e.target.value as 'imperial' | 'metric' })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="metric">Metric (cm, mm)</option>
                    <option value="imperial">Imperial (in)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Handedness
                  </label>
                  <select
                    value={settings.handedness}
                    onChange={(e) => updateSettings({ handedness: e.target.value as 'left' | 'right' })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="right">Right-handed</option>
                    <option value="left">Left-handed</option>
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Affects row numbering direction in instructions
                  </p>
                </div>
              </div>
            </section>

            {/* Default Grid Settings */}
            <section>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                Default New Chart Settings
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Width
                  </label>
                  <input
                    type="number"
                    value={settings.defaultGridWidth}
                    onChange={(e) => updateSettings({ defaultGridWidth: Number(e.target.value) })}
                    min={1}
                    max={1000}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Height
                  </label>
                  <input
                    type="number"
                    value={settings.defaultGridHeight}
                    onChange={(e) => updateSettings({ defaultGridHeight: Number(e.target.value) })}
                    min={1}
                    max={1000}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Gauge H
                  </label>
                  <input
                    type="number"
                    value={settings.defaultGaugeH}
                    onChange={(e) => updateSettings({ defaultGaugeH: Number(e.target.value) })}
                    min={0.1}
                    max={10}
                    step={0.1}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Gauge V
                  </label>
                  <input
                    type="number"
                    value={settings.defaultGaugeV}
                    onChange={(e) => updateSettings({ defaultGaugeV: Number(e.target.value) })}
                    min={0.1}
                    max={10}
                    step={0.1}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Gauge affects stitch proportions for non-square stitches
              </p>
            </section>

            {/* About */}
            <section>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                About
              </h3>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  StitchFizzle v1.0.0
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Free, open-source crochet chart creator. All data stored locally.
                </p>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline mt-2 inline-block"
                >
                  View on GitHub
                </a>
              </div>
            </section>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={closeDialog}
              className="flex-1 px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
