import { useState } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useProjectStore } from '@/stores/projectStore';
import { saveProject } from '@/services/db';
import { v4 as uuidv4 } from 'uuid';
import type { Project } from '@/types';

interface URLImportDialogProps {
  project: Project;
  onClose: () => void;
}

export function URLImportDialog({ project, onClose }: URLImportDialogProps) {
  const setView = useUIStore((state) => state.setView);
  const loadProject = useProjectStore((state) => state.loadProject);
  const addToast = useUIStore((state) => state.addToast);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    setImporting(true);
    setError(null);

    try {
      // Clone with new ID to avoid conflicts
      const importedProject: Project = {
        ...project,
        id: uuidv4(),
        name: `${project.name} (shared)`,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(),
      };

      await saveProject(importedProject);
      const loaded = await loadProject(importedProject.id);

      if (loaded) {
        addToast('Pattern imported successfully!', 'success');
        onClose();
        setView('editor');
      } else {
        setError('Failed to load imported project');
      }
    } catch (err) {
      setError('Import failed: ' + String(err));
    } finally {
      setImporting(false);
    }
  };

  // Format chart type for display
  const chartTypeDisplay = {
    c2c: 'Corner-to-Corner (C2C)',
    colorwork: 'Colorwork',
    filet: 'Filet',
    mosaic: 'Overlay Mosaic',
    freeform: 'Freeform',
    tunisian: 'Tunisian',
  }[project.chartType] || project.chartType;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-[420px]">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Import Shared Pattern
        </h2>

        <div className="mb-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4">
            <p className="font-medium text-gray-900 dark:text-white">{project.name}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {chartTypeDisplay}
              {project.settings &&
                ` • ${project.settings.width} × ${project.settings.height}`}
            </p>
            {project.palette && project.palette.length > 0 && (
              <div className="flex gap-1 mt-2">
                {project.palette.slice(0, 8).map((entry) => (
                  <div
                    key={entry.id}
                    className="w-5 h-5 rounded border border-gray-300 dark:border-gray-600"
                    style={{ backgroundColor: entry.color }}
                    title={entry.name}
                  />
                ))}
                {project.palette.length > 8 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1 self-center">
                    +{project.palette.length - 8} more
                  </span>
                )}
              </div>
            )}
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300">
            Someone shared this pattern with you. Would you like to import it to your library?
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={importing}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={importing}
            className="flex-1 px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {importing ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
}
