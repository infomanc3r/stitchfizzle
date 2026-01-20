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

  const { direction } = progressTracker;
  const { width, height } = project.settings;
  const currentPosition = progressTracker.currentRow;

  // Calculate total count based on direction
  let totalCount: number;
  let label: string;
  switch (direction) {
    case 'vertical':
      totalCount = width;
      label = 'Column';
      break;
    case 'diagonal':
      totalCount = height + width - 1;
      label = 'Diagonal';
      break;
    case 'horizontal':
    default:
      totalCount = height;
      label = 'Row';
      break;
  }

  const progressPercent = Math.round(((currentPosition + 1) / totalCount) * 100);

  const handleDirectionChange = (newDirection: ProgressState['direction']) => {
    updateProgressSettings({ direction: newDirection });
    // Reset to position 0 when direction changes to avoid out-of-bounds
    setProgressRow(0);
  };

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
          <span>{label} {currentPosition + 1} of {totalCount}</span>
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
          disabled={currentPosition <= 0}
          className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title={`Previous ${label.toLowerCase()}`}
        >
          <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <input
          type="number"
          value={currentPosition + 1}
          onChange={(e) => setProgressRow(Number(e.target.value) - 1)}
          min={1}
          max={totalCount}
          className="flex-1 px-3 py-2 text-center text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />

        <button
          onClick={nextProgressRow}
          disabled={currentPosition >= totalCount - 1}
          className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title={`Next ${label.toLowerCase()}`}
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
            onChange={(e) => handleDirectionChange(e.target.value as ProgressState['direction'])}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="horizontal">Horizontal (rows)</option>
            <option value="vertical">Vertical (columns)</option>
            <option value="diagonal">Diagonal (C2C)</option>
          </select>
        </div>

        {direction === 'diagonal' && (
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Diagonal Direction
            </label>
            <select
              value={progressTracker.diagonalDirection || 'bottom-left'}
              onChange={(e) =>
                updateProgressSettings({ diagonalDirection: e.target.value as ProgressState['diagonalDirection'] })
              }
              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="bottom-left">Bottom-left to top-right</option>
              <option value="top-left">Top-left to bottom-right</option>
            </select>
          </div>
        )}

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
            <option value="done">Darken completed {label.toLowerCase()}s</option>
            <option value="todo">Darken remaining {label.toLowerCase()}s</option>
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
