import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/Layout';
import { ProjectList, NewProjectDialog } from '@/components/FileManager';
import { GridCanvas, FreeformCanvas, Toolbar } from '@/components/Editor';
import { PalettePanel, SymbolPicker } from '@/components/Palette';
import { LayerPanel } from '@/components/Layers';
import { ExportDialog, ImportDialog, WrittenInstructionsDialog, ShareDialog, URLImportDialog } from '@/components/Export';
import { ImageImportDialog } from '@/components/Import';
import { ProgressPanel } from '@/components/Progress';
import { SettingsDialog } from '@/components/Settings';
import { useUIStore } from '@/stores/uiStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useProjectStore } from '@/stores/projectStore';
import { useKeyboardShortcuts, useAutoSave, useURLImport } from '@/hooks';
import type { SymbolDefinition } from '@/types';

function App() {
  const view = useUIStore((state) => state.view);
  const activeDialog = useUIStore((state) => state.activeDialog);
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const project = useProjectStore((state) => state.project);

  // URL import handling (for shared pattern links)
  const { pendingProject, clearPending } = useURLImport();
  const [showURLImport, setShowURLImport] = useState(false);

  // Show URL import dialog when there's a pending project
  useEffect(() => {
    if (pendingProject) {
      setShowURLImport(true);
    }
  }, [pendingProject]);

  const handleURLImportClose = () => {
    setShowURLImport(false);
    clearPending();
  };

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
      {activeDialog === 'share' && <ShareDialog />}

      {/* URL Import dialog (shown when opening a shared link) */}
      {showURLImport && pendingProject && (
        <URLImportDialog project={pendingProject} onClose={handleURLImportClose} />
      )}
    </MainLayout>
  );
}

// Editor view with grid canvas and palette
function EditorView() {
  const project = useProjectStore((state) => state.project);
  const activeSymbolId = useProjectStore((state) => state.activeSymbolId);
  const setActiveSymbol = useProjectStore((state) => state.setActiveSymbol);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!project) return null;

  const isFreeform = project.chartType === 'freeform';

  const handleSymbolSelect = (symbol: SymbolDefinition) => {
    setActiveSymbol(symbol.id);
  };

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

      {/* Sidebar */}
      <div
        className={`flex flex-col w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 absolute md:relative h-full z-40`}
      >
        {isFreeform ? (
          <>
            {/* Freeform mode: Symbol picker + Colors + Layers */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="h-48 border-b border-gray-200 dark:border-gray-700">
                <SymbolPicker
                  selectedSymbolId={activeSymbolId}
                  onSelect={handleSymbolSelect}
                />
              </div>
              <div className="flex-1 overflow-hidden">
                <PalettePanel />
              </div>
            </div>
            <div className="h-48 border-t border-gray-200 dark:border-gray-700">
              <LayerPanel />
            </div>
          </>
        ) : (
          <>
            {/* Grid mode: Colors + Progress */}
            <div className="flex-1 overflow-hidden">
              <PalettePanel />
            </div>
            <ProgressPanel />
          </>
        )}
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
          {isFreeform ? <FreeformCanvas /> : <GridCanvas />}
        </div>
      </div>
    </div>
  );
}

export default App;
