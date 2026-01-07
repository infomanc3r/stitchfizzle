import { useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import type { EditorTool } from '@/types';

export function Toolbar() {
  const activeTool = useProjectStore((state) => state.activeTool);
  const setActiveTool = useProjectStore((state) => state.setActiveTool);
  const zoom = useProjectStore((state) => state.zoom);
  const setZoom = useProjectStore((state) => state.setZoom);
  const undo = useProjectStore((state) => state.undo);
  const redo = useProjectStore((state) => state.redo);
  const undoStack = useProjectStore((state) => state.undoStack);
  const redoStack = useProjectStore((state) => state.redoStack);
  const project = useProjectStore((state) => state.project);
  const selection = useProjectStore((state) => state.selection);
  const insertRow = useProjectStore((state) => state.insertRow);
  const deleteRow = useProjectStore((state) => state.deleteRow);
  const insertColumn = useProjectStore((state) => state.insertColumn);
  const deleteColumn = useProjectStore((state) => state.deleteColumn);
  const resizeGrid = useProjectStore((state) => state.resizeGrid);
  const toggleShowNumbers = useProjectStore((state) => state.toggleShowNumbers);
  const openDialog = useUIStore((state) => state.openDialog);

  const [showGridDialog, setShowGridDialog] = useState(false);

  const tools: { id: EditorTool; label: string; icon: string; shortcut: string }[] = [
    { id: 'draw', label: 'Draw', icon: '✏️', shortcut: 'D' },
    { id: 'erase', label: 'Erase', icon: '🧹', shortcut: 'E' },
    { id: 'fill', label: 'Fill', icon: '🪣', shortcut: 'F' },
    { id: 'select', label: 'Select', icon: '⬚', shortcut: 'S' },
    { id: 'eyedropper', label: 'Eyedropper', icon: '💧', shortcut: 'I' },
    { id: 'pan', label: 'Pan', icon: '✋', shortcut: 'Space' },
  ];

  const getSelectedRowCol = () => {
    if (!selection) return null;
    const minRow = Math.min(selection.startRow, selection.endRow);
    const maxRow = Math.max(selection.startRow, selection.endRow);
    const minCol = Math.min(selection.startCol, selection.endCol);
    const maxCol = Math.max(selection.startCol, selection.endCol);
    return { minRow, maxRow, minCol, maxCol };
  };

  const handleInsertRowAbove = () => {
    const sel = getSelectedRowCol();
    if (sel) insertRow(sel.minRow);
  };

  const handleInsertRowBelow = () => {
    const sel = getSelectedRowCol();
    if (sel) insertRow(sel.maxRow + 1);
  };

  const handleDeleteRows = () => {
    const sel = getSelectedRowCol();
    if (sel) {
      for (let i = sel.maxRow; i >= sel.minRow; i--) {
        deleteRow(i);
      }
    }
  };

  const handleInsertColLeft = () => {
    const sel = getSelectedRowCol();
    if (sel) insertColumn(sel.minCol);
  };

  const handleInsertColRight = () => {
    const sel = getSelectedRowCol();
    if (sel) insertColumn(sel.maxCol + 1);
  };

  const handleDeleteCols = () => {
    const sel = getSelectedRowCol();
    if (sel) {
      for (let i = sel.maxCol; i >= sel.minCol; i--) {
        deleteColumn(i);
      }
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-thin">
      {/* Tool buttons */}
      <div className="flex items-center gap-1 pr-2 border-r border-gray-200 dark:border-gray-600 flex-shrink-0">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            title={`${tool.label} (${tool.shortcut})`}
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
              activeTool === tool.id
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span className="text-lg">{tool.icon}</span>
          </button>
        ))}
      </div>

      {/* Undo/Redo */}
      <div className="flex items-center gap-1 pr-2 border-r border-gray-200 dark:border-gray-600 flex-shrink-0">
        <button
          onClick={undo}
          disabled={undoStack.length === 0}
          title="Undo (Ctrl+Z)"
          className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="text-lg">↩️</span>
        </button>
        <button
          onClick={redo}
          disabled={redoStack.length === 0}
          title="Redo (Ctrl+Y)"
          className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="text-lg">↪️</span>
        </button>
      </div>

      {/* Zoom controls */}
      <div className="flex items-center gap-1 pr-2 border-r border-gray-200 dark:border-gray-600 flex-shrink-0">
        <button
          onClick={() => setZoom(zoom - 0.25)}
          disabled={zoom <= 0.25}
          title="Zoom Out (Ctrl+-)"
          className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="text-lg">➖</span>
        </button>
        <span className="w-14 text-center text-sm text-gray-600 dark:text-gray-300">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom(zoom + 0.25)}
          disabled={zoom >= 10}
          title="Zoom In (Ctrl++)"
          className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="text-lg">➕</span>
        </button>
        <button
          onClick={() => setZoom(1)}
          title="Reset Zoom (Ctrl+0)"
          className="px-2 h-9 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          100%
        </button>
      </div>

      {/* Row/Column operations (only when selection exists) */}
      {selection && (
        <div className="flex items-center gap-1 pr-2 border-r border-gray-200 dark:border-gray-600 flex-shrink-0">
          <div className="relative group">
            <button
              title="Row operations"
              className="px-2 h-9 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-1"
            >
              <span>Rows</span>
              <span className="text-xs">▼</span>
            </button>
            <div className="absolute left-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 min-w-40 z-50 hidden group-hover:block">
              <button
                onClick={handleInsertRowAbove}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Insert row above
              </button>
              <button
                onClick={handleInsertRowBelow}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Insert row below
              </button>
              <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
              <button
                onClick={handleDeleteRows}
                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Delete selected rows
              </button>
            </div>
          </div>
          <div className="relative group">
            <button
              title="Column operations"
              className="px-2 h-9 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-1"
            >
              <span>Columns</span>
              <span className="text-xs">▼</span>
            </button>
            <div className="absolute left-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 min-w-40 z-50 hidden group-hover:block">
              <button
                onClick={handleInsertColLeft}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Insert column left
              </button>
              <button
                onClick={handleInsertColRight}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Insert column right
              </button>
              <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
              <button
                onClick={handleDeleteCols}
                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Delete selected columns
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid size & options */}
      <div className="flex items-center gap-1 pr-2 border-r border-gray-200 dark:border-gray-600 flex-shrink-0">
        <button
          onClick={() => setShowGridDialog(true)}
          title="Resize grid"
          className="px-3 h-9 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-1"
        >
          <span>Grid: {project?.settings.width} x {project?.settings.height}</span>
        </button>
        <button
          onClick={toggleShowNumbers}
          title="Toggle row/column numbers"
          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
            project?.settings.showNumbers
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <span className="text-sm font-mono">#</span>
        </button>
      </div>

      {/* Export, Share & Instructions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => openDialog('writtenInstructions')}
          title="Generate written instructions"
          className="px-3 h-9 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2"
        >
          <span>📝</span>
          <span>Instructions</span>
        </button>
        <button
          onClick={() => openDialog('export')}
          title="Export chart"
          className="px-3 h-9 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2"
        >
          <span>💾</span>
          <span>Export</span>
        </button>
        <button
          onClick={() => openDialog('share')}
          title="Share pattern (QR code, link, or native share)"
          className="px-3 h-9 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2"
        >
          <span>📤</span>
          <span>Share</span>
        </button>
      </div>

      {/* Grid Resize Dialog */}
      {showGridDialog && project && (
        <GridResizeDialog
          currentWidth={project.settings.width}
          currentHeight={project.settings.height}
          onResize={(w, h) => {
            resizeGrid(w, h);
            setShowGridDialog(false);
          }}
          onClose={() => setShowGridDialog(false)}
        />
      )}
    </div>
  );
}

interface GridResizeDialogProps {
  currentWidth: number;
  currentHeight: number;
  onResize: (width: number, height: number) => void;
  onClose: () => void;
}

function GridResizeDialog({ currentWidth, currentHeight, onResize, onClose }: GridResizeDialogProps) {
  const [width, setWidth] = useState(currentWidth);
  const [height, setHeight] = useState(currentHeight);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (width >= 1 && width <= 1000 && height >= 1 && height <= 1000) {
      onResize(width, height);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-80">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Resize Grid
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Width (columns)
            </label>
            <input
              type="number"
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              min={1}
              max={1000}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Height (rows)
            </label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              min={1}
              max={1000}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Maximum size: 1000 x 1000. Shrinking the grid will crop existing content.
          </p>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Resize
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
