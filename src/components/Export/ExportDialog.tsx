import { useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import {
  downloadJSON,
  downloadPNG,
  downloadSVG,
  downloadPDF,
  type PNGSize,
  type PDFPageCount,
} from '@/services/exporters';

type ExportFormat = 'json' | 'png' | 'svg' | 'pdf';

export function ExportDialog() {
  const project = useProjectStore((state) => state.project);
  const selection = useProjectStore((state) => state.selection);
  const closeDialog = useUIStore((state) => state.closeDialog);

  const [format, setFormat] = useState<ExportFormat>('png');
  const [pngSize, setPngSize] = useState<PNGSize>('medium');
  const [customWidth, setCustomWidth] = useState(1200);
  const [pdfPages, setPdfPages] = useState<PDFPageCount>(1);
  const [svgCellSize, setSvgCellSize] = useState(20);
  const [includeGridLines, setIncludeGridLines] = useState(true);
  const [includeLegend, setIncludeLegend] = useState(true);
  const [exportSelection, setExportSelection] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!project) return null;

  const hasSelection = !!selection;

  const handleExport = async () => {
    if (!project) return;

    setIsExporting(true);

    try {
      const selectionBounds =
        exportSelection && selection
          ? {
              startRow: selection.startRow,
              endRow: selection.endRow,
              startCol: selection.startCol,
              endCol: selection.endCol,
            }
          : undefined;

      switch (format) {
        case 'json':
          downloadJSON(project);
          break;

        case 'png':
          await downloadPNG(project, {
            size: pngSize,
            customWidth: pngSize === 'custom' ? customWidth : undefined,
            includeGridLines,
            includeLegend,
            backgroundColor: '#ffffff',
            selection: selectionBounds,
          });
          break;

        case 'svg':
          downloadSVG(project, {
            cellSize: svgCellSize,
            includeGridLines,
            includeLegend,
            backgroundColor: '#ffffff',
            selection: selectionBounds,
          });
          break;

        case 'pdf':
          await downloadPDF(project, {
            pages: pdfPages,
            includeGridLines,
            includeLegend,
            backgroundColor: '#ffffff',
            selection: selectionBounds,
          });
          break;
      }

      closeDialog();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-[420px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Export Chart
        </h2>

        {/* Format selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Format
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['json', 'png', 'svg', 'pdf'] as ExportFormat[]).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  format === f
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Format-specific options */}
        {format === 'png' && (
          <div className="mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Size
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['small', 'medium', 'large', 'custom'] as PNGSize[]).map((size) => (
                  <button
                    key={size}
                    onClick={() => setPngSize(size)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      pngSize === size
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {size === 'small' ? '600px' : size === 'medium' ? '1200px' : size === 'large' ? '2000px' : 'Custom'}
                  </button>
                ))}
              </div>
            </div>
            {pngSize === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Width (pixels)
                </label>
                <input
                  type="number"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(Number(e.target.value))}
                  min={100}
                  max={10000}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            )}
          </div>
        )}

        {format === 'svg' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cell Size (pixels)
            </label>
            <input
              type="number"
              value={svgCellSize}
              onChange={(e) => setSvgCellSize(Number(e.target.value))}
              min={5}
              max={100}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        )}

        {format === 'pdf' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Pages
            </label>
            <div className="grid grid-cols-4 gap-2">
              {([1, 4, 9, 16] as PDFPageCount[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPdfPages(p)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    pdfPages === p
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {p} {p === 1 ? 'page' : 'pages'}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Multi-page exports split the chart across pages for detailed printing.
            </p>
          </div>
        )}

        {/* Common options for image formats */}
        {format !== 'json' && (
          <div className="mb-6 space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={includeGridLines}
                onChange={(e) => setIncludeGridLines(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Include grid lines</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={includeLegend}
                onChange={(e) => setIncludeLegend(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Include color legend</span>
            </label>

            {hasSelection && (
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={exportSelection}
                  onChange={(e) => setExportSelection(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Export selection only</span>
              </label>
            )}
          </div>
        )}

        {/* JSON info */}
        {format === 'json' && (
          <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              JSON exports the complete project including all grid data, colors, and settings.
              Use this format for backups and sharing.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={closeDialog}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
}
