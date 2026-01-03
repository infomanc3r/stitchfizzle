import { useEffect } from 'react';
import { MainLayout } from '@/components/Layout';
import { ProjectList, NewProjectDialog } from '@/components/FileManager';
import { GridCanvas } from '@/components/Editor';
import { PalettePanel } from '@/components/Palette';
import { useUIStore } from '@/stores/uiStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useProjectStore } from '@/stores/projectStore';
import { useKeyboardShortcuts } from '@/hooks';

function App() {
  const view = useUIStore((state) => state.view);
  const activeDialog = useUIStore((state) => state.activeDialog);
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const project = useProjectStore((state) => state.project);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  return (
    <MainLayout>
      {view === 'projects' && <ProjectList />}
      {view === 'editor' && project && <EditorView />}

      {/* Dialogs */}
      {activeDialog === 'newProject' && <NewProjectDialog />}
    </MainLayout>
  );
}

// Editor view with grid canvas and palette
function EditorView() {
  const project = useProjectStore((state) => state.project);
  const zoom = useProjectStore((state) => state.zoom);
  const setZoom = useProjectStore((state) => state.setZoom);

  if (!project) return null;

  return (
    <div className="flex h-full">
      {/* Color palette sidebar */}
      <PalettePanel />

      {/* Canvas area */}
      <div className="flex-1 flex flex-col">
        {/* Canvas toolbar */}
        <div className="h-12 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {project.settings.width} x {project.settings.height}
          </span>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(zoom - 0.1)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              disabled={zoom <= 0.1}
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400 w-16 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(zoom + 0.1)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              disabled={zoom >= 10}
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1">
          <GridCanvas />
        </div>
      </div>
    </div>
  );
}

export default App;
