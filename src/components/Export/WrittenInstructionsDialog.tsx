import { useState, useMemo } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import {
  generateWrittenInstructions,
  copyToClipboard,
  downloadAsText,
  type InstructionOptions,
} from '@/services/writtenInstructions';

export function WrittenInstructionsDialog() {
  const project = useProjectStore((state) => state.project);
  const closeDialog = useUIStore((state) => state.closeDialog);
  const addToast = useUIStore((state) => state.addToast);

  const [options, setOptions] = useState<InstructionOptions>({
    direction: 'bottom-to-top',
    includeRowNumbers: true,
    includeStitchCounts: true,
    format: 'plain',
    c2cNotation: project?.chartType === 'c2c',
  });

  const instructions = useMemo(() => {
    if (!project) return null;
    try {
      return generateWrittenInstructions(project, options);
    } catch {
      return null;
    }
  }, [project, options]);

  if (!project) return null;

  const handleCopy = async () => {
    if (instructions) {
      await copyToClipboard(instructions.text);
      addToast('Copied to clipboard', 'success');
    }
  };

  const handleDownload = () => {
    if (instructions) {
      const ext = options.format === 'markdown' ? 'md' : 'txt';
      downloadAsText(
        instructions.text,
        `${project.name.replace(/[^a-zA-Z0-9-_]/g, '_')}_instructions.${ext}`
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[700px] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Written Instructions
          </h2>
        </div>

        {/* Options */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Direction
              </label>
              <select
                value={options.direction}
                onChange={(e) =>
                  setOptions({ ...options, direction: e.target.value as InstructionOptions['direction'] })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="bottom-to-top">Bottom to Top</option>
                <option value="top-to-bottom">Top to Bottom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Format
              </label>
              <select
                value={options.format}
                onChange={(e) =>
                  setOptions({ ...options, format: e.target.value as InstructionOptions['format'] })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="plain">Plain Text</option>
                <option value="markdown">Markdown</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={options.includeRowNumbers}
                onChange={(e) => setOptions({ ...options, includeRowNumbers: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Row numbers</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={options.includeStitchCounts}
                onChange={(e) => setOptions({ ...options, includeStitchCounts: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Stitch counts</span>
            </label>
            {project.chartType === 'c2c' && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={options.c2cNotation}
                  onChange={(e) => setOptions({ ...options, c2cNotation: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">C2C diagonal notation</span>
              </label>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-hidden p-4">
          {instructions ? (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {instructions.rowCount} rows, {instructions.totalStitches} stitches,{' '}
                  {instructions.colorsUsed.length} colors
                </span>
              </div>
              <div className="flex-1 overflow-auto">
                <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono bg-gray-50 dark:bg-gray-900 p-4 rounded-lg h-full overflow-auto">
                  {instructions.text}
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Unable to generate instructions
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <button
            onClick={closeDialog}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
          <div className="flex-1" />
          <button
            onClick={handleCopy}
            disabled={!instructions}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <span>📋</span> Copy
          </button>
          <button
            onClick={handleDownload}
            disabled={!instructions}
            className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <span>📥</span> Download
          </button>
        </div>
      </div>
    </div>
  );
}
