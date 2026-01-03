import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/Layout';
import { ProjectList, NewProjectDialog } from '@/components/FileManager';
import { GridCanvas, Toolbar } from '@/components/Editor';
import { PalettePanel } from '@/components/Palette';
import { ExportDialog, ImportDialog, WrittenInstructionsDialog } from '@/components/Export';
import { ImageImportDialog } from '@/components/Import';
import { ProgressPanel } from '@/components/Progress';
import { SettingsDialog } from '@/components/Settings';
import { useUIStore } from '@/stores/uiStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useProjectStore } from '@/stores/projectStore';
import { useKeyboardShortcuts, useAutoSave } from '@/hooks';

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

  // Enable auto-save
  useAutoSave();

  return (
    <MainLayout>
      {view === 'projects' && <ProjectList />}
      {view === 'editor' && project && <EditorView />}

      {/* Dialogs */}
      {activeDialog === 'newProject' && <NewProjectDialog />}
      {activeDialog === 'export' && <ExportDialog />}
      {activeDialog === 'import' && <ImportDialog />}
      {activeDialog === 'imageImport' && <ImageImportDialog />}
      {activeDialog === 'writtenInstructions' && <WrittenInstructionsDialog />}
      {activeDialog === 'settings' && <SettingsDialog />}
    </MainLayout>
  );
}

// Editor view with grid canvas and palette
function EditorView() {
  const project = useProjectStore((state) => state.project);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!project) return null;

  return (
    <div className="flex h-full relative">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden absolute top-2 left-2 z-50 w-10 h-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg flex items-center justify-center border border-gray-200 dark:border-gray-700"
        title={sidebarOpen ? 'Hide palette' : 'Show palette'}
      >
        <span className="text-lg">{sidebarOpen ? '◀' : '▶'}</span>
      </button>

      {/* Color palette sidebar */}
      <div
        className={`flex flex-col w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 absolute md:relative h-full z-40`}
      >
        <div className="flex-1 overflow-hidden">
          <PalettePanel />
        </div>
        <ProgressPanel />
      </div>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Canvas area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <Toolbar />

        {/* Canvas */}
        <div className="flex-1">
          <GridCanvas />
        </div>
      </div>
    </div>
  );
}

export default App;
