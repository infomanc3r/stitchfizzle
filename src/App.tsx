import { useEffect } from 'react';
import { MainLayout } from '@/components/Layout';
import { ProjectList, NewProjectDialog } from '@/components/FileManager';
import { useUIStore } from '@/stores/uiStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useProjectStore } from '@/stores/projectStore';

function App() {
  const view = useUIStore((state) => state.view);
  const activeDialog = useUIStore((state) => state.activeDialog);
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const project = useProjectStore((state) => state.project);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return (
    <MainLayout>
      {view === 'projects' && <ProjectList />}
      {view === 'editor' && project && <EditorView />}

      {/* Dialogs */}
      {activeDialog === 'newProject' && <NewProjectDialog />}
    </MainLayout>
  );
}

// Placeholder editor view - will be expanded in Phase 2
function EditorView() {
  const project = useProjectStore((state) => state.project);
  const activeColorId = useProjectStore((state) => state.activeColorId);
  const addColor = useProjectStore((state) => state.addColor);
  const setActiveColor = useProjectStore((state) => state.setActiveColor);
  const zoom = useProjectStore((state) => state.zoom);
  const setZoom = useProjectStore((state) => state.setZoom);

  if (!project) return null;

  return (
    <div className="flex h-full">
      {/* Color palette sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-800 dark:text-white">Colors</h3>
          <button
            onClick={() => addColor(`#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Add color"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-auto space-y-1">
          {project.palette.map((entry) => (
            <button
              key={entry.id}
              onClick={() => setActiveColor(entry.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeColorId === entry.id
                  ? 'bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div
                className="w-8 h-8 rounded border border-gray-200 dark:border-gray-600"
                style={{ backgroundColor: entry.color }}
              />
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-gray-800 dark:text-white truncate">
                  {entry.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {entry.color}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

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

        {/* Canvas placeholder */}
        <div className="flex-1 bg-gray-100 dark:bg-gray-900 overflow-auto flex items-center justify-center">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            <p className="text-lg font-medium mb-1">Canvas Editor</p>
            <p className="text-sm">Grid editor coming in Phase 2</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
