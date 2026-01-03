import { useProjectStore } from '@/stores/projectStore';
import type { ProgressState } from '@/types';

export function ProgressPanel() {
  const project = useProjectStore((state) => state.project);
  const progressTracker = project?.progressTracker;
  const initProgressTracker = useProjectStore((state) => state.initProgressTracker);
  const setProgressRow = useProjectStore((state) => state.setProgressRow);
  const nextProgressRow = useProjectStore((state) => state.nextProgressRow);
  const prevProgressRow = useProjectStore((state) => state.prevProgressRow);
  const updateProgressSettings = useProjectStore((state) => state.updateProgressSettings);
  const clearProgressTracker = useProjectStore((state) => state.clearProgressTracker);

  if (!project) return null;

  if (!progressTracker) {
    return (
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Progress Tracker
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Track your progress through the chart row by row
          </p>
          <button
            onClick={initProgressTracker}
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Enable Tracking
          </button>
        </div>
      </div>
    );
  }

  const currentRow = progressTracker.currentRow;
  const totalRows = project.settings.height;
  const progressPercent = Math.round(((currentRow + 1) / totalRows) * 100);

  return (
    <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Progress Tracker
        </h3>
        <button
          onClick={clearProgressTracker}
          className="text-xs text-gray-500 hover:text-red-500 transition-colors"
          title="Disable tracking"
        >
          Disable
        </button>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Row {currentRow + 1} of {totalRows}</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Row controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={prevProgressRow}
          disabled={currentRow <= 0}
          className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Previous row"
        >
          <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <input
          type="number"
          value={currentRow + 1}
          onChange={(e) => setProgressRow(Number(e.target.value) - 1)}
          min={1}
          max={totalRows}
          className="flex-1 px-3 py-2 text-center text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />

        <button
          onClick={nextProgressRow}
          disabled={currentRow >= totalRows - 1}
          className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Next row"
        >
          <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Settings */}
      <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Direction
          </label>
          <select
            value={progressTracker.direction}
            onChange={(e) =>
              updateProgressSettings({ direction: e.target.value as ProgressState['direction'] })
            }
            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="horizontal">Horizontal (rows)</option>
            <option value="vertical">Vertical (columns)</option>
            <option value="diagonal">Diagonal (C2C)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Darken Mode
          </label>
          <select
            value={progressTracker.darkenMode}
            onChange={(e) =>
              updateProgressSettings({ darkenMode: e.target.value as ProgressState['darkenMode'] })
            }
            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="done">Darken completed rows</option>
            <option value="todo">Darken remaining rows</option>
            <option value="except-current">Darken all except current</option>
            <option value="none">No darkening</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Brightness: {progressTracker.brightness}%
          </label>
          <input
            type="range"
            value={progressTracker.brightness}
            onChange={(e) => updateProgressSettings({ brightness: Number(e.target.value) })}
            min={10}
            max={90}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
