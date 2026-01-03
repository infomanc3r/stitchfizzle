import { useState } from 'react';
import type { ChartType } from '@/types';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { useSettingsStore } from '@/stores/settingsStore';

interface ChartTypeOption {
  type: ChartType;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const CHART_TYPES: ChartTypeOption[] = [
  {
    type: 'colorwork',
    name: 'Colorwork',
    description: 'Graphgans, pixel designs, tapestry crochet',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 32 32" fill="currentColor">
        <rect x="4" y="4" width="8" height="8" />
        <rect x="12" y="4" width="8" height="8" opacity="0.5" />
        <rect x="20" y="4" width="8" height="8" />
        <rect x="4" y="12" width="8" height="8" opacity="0.5" />
        <rect x="12" y="12" width="8" height="8" />
        <rect x="20" y="12" width="8" height="8" opacity="0.5" />
        <rect x="4" y="20" width="8" height="8" />
        <rect x="12" y="20" width="8" height="8" opacity="0.5" />
        <rect x="20" y="20" width="8" height="8" />
      </svg>
    ),
  },
  {
    type: 'c2c',
    name: 'Corner to Corner (C2C)',
    description: 'Diagonal colorwork, worked corner to corner',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 32 32" fill="currentColor">
        <rect x="4" y="4" width="8" height="8" transform="rotate(45 8 8)" />
        <rect x="12" y="12" width="8" height="8" transform="rotate(45 16 16)" opacity="0.5" />
        <rect x="20" y="20" width="8" height="8" transform="rotate(45 24 24)" />
      </svg>
    ),
  },
  {
    type: 'filet',
    name: 'Filet Crochet',
    description: 'Open and filled squares pattern',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="4" width="8" height="8" />
        <rect x="12" y="4" width="8" height="8" fill="currentColor" />
        <rect x="20" y="4" width="8" height="8" />
        <rect x="4" y="12" width="8" height="8" fill="currentColor" />
        <rect x="12" y="12" width="8" height="8" />
        <rect x="20" y="12" width="8" height="8" fill="currentColor" />
        <rect x="4" y="20" width="8" height="8" />
        <rect x="12" y="20" width="8" height="8" fill="currentColor" />
        <rect x="20" y="20" width="8" height="8" />
      </svg>
    ),
  },
  {
    type: 'mosaic',
    name: 'Overlay Mosaic',
    description: 'Two-color rows with overlay stitches',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 32 32" fill="currentColor">
        <rect x="4" y="4" width="24" height="4" />
        <rect x="4" y="12" width="24" height="4" opacity="0.5" />
        <rect x="4" y="20" width="24" height="4" />
        <text x="16" y="18" textAnchor="middle" fontSize="10" fill="currentColor">X</text>
      </svg>
    ),
  },
  {
    type: 'tunisian',
    name: 'Tunisian',
    description: 'Forward and return pass visualization',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 32 32" fill="currentColor">
        <rect x="4" y="6" width="24" height="3" />
        <rect x="4" y="11" width="24" height="3" opacity="0.3" />
        <rect x="4" y="16" width="24" height="3" />
        <rect x="4" y="21" width="24" height="3" opacity="0.3" />
      </svg>
    ),
  },
  {
    type: 'freeform',
    name: 'Freeform',
    description: 'Place symbols freely, create custom patterns',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 32 32" fill="currentColor">
        <circle cx="10" cy="10" r="4" />
        <circle cx="22" cy="8" r="3" opacity="0.5" />
        <circle cx="16" cy="18" r="5" />
        <circle cx="8" cy="24" r="3" opacity="0.5" />
        <circle cx="24" cy="22" r="4" />
      </svg>
    ),
  },
];

export function NewProjectDialog() {
  const settings = useSettingsStore((state) => state.settings);
  const createProject = useProjectStore((state) => state.createProject);
  const closeDialog = useUIStore((state) => state.closeDialog);
  const setView = useUIStore((state) => state.setView);
  const addToast = useUIStore((state) => state.addToast);

  const [name, setName] = useState('Untitled Chart');
  const [chartType, setChartType] = useState<ChartType>('colorwork');
  const [width, setWidth] = useState(settings.defaultGridWidth);
  const [height, setHeight] = useState(settings.defaultGridHeight);

  const handleCreate = () => {
    if (!name.trim()) {
      addToast('Please enter a chart name', 'error');
      return;
    }

    createProject(name.trim(), chartType, {
      width,
      height,
      gaugeH: settings.defaultGaugeH,
      gaugeV: settings.defaultGaugeV,
      gridLines: {
        show: true,
        color: '#cccccc',
        thickness: 1,
        highlight5: true,
        highlight10: true,
        highlight5Color: '#999999',
        highlight10Color: '#666666',
      },
    });

    closeDialog();
    setView('editor');
    addToast('Chart created', 'success');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Create New Chart
          </h2>
          <button
            onClick={closeDialog}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Name input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Chart Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter chart name"
            />
          </div>

          {/* Chart type selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Chart Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CHART_TYPES.map((option) => (
                <button
                  key={option.type}
                  onClick={() => setChartType(option.type)}
                  className={`
                    p-4 rounded-lg border-2 text-left transition-all
                    ${
                      chartType === option.type
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }
                  `}
                >
                  <div
                    className={`mb-2 ${
                      chartType === option.type
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    {option.icon}
                  </div>
                  <h3
                    className={`font-medium text-sm ${
                      chartType === option.type
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {option.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {option.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Size inputs (not for freeform) */}
          {chartType !== 'freeform' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Chart Size
              </label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Width (columns)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={width}
                    onChange={(e) => setWidth(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <span className="text-gray-400 mt-5">x</span>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Height (rows)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={height}
                    onChange={(e) => setHeight(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={closeDialog}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Chart
          </button>
        </div>
      </div>
    </div>
  );
}
