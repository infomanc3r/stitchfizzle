import { useEffect } from 'react';
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

  if (!project) return null;

  return (
    <div className="flex h-full">
      {/* Color palette sidebar */}
      <div className="flex flex-col w-64 border-r border-gray-200 dark:border-gray-700">
        <div className="flex-1 overflow-hidden">
          <PalettePanel />
        </div>
        <ProgressPanel />
      </div>

      {/* Canvas area */}
      <div className="flex-1 flex flex-col">
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
