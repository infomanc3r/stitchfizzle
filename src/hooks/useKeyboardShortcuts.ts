import { useEffect } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';

export function useKeyboardShortcuts() {
  const project = useProjectStore((state) => state.project);
  const setActiveTool = useProjectStore((state) => state.setActiveTool);
  const undo = useProjectStore((state) => state.undo);
  const redo = useProjectStore((state) => state.redo);
  const saveCurrentProject = useProjectStore((state) => state.saveCurrentProject);
  const setZoom = useProjectStore((state) => state.setZoom);
  const zoom = useProjectStore((state) => state.zoom);
  const clearSelection = useProjectStore((state) => state.clearSelection);
  const copySelection = useProjectStore((state) => state.copySelection);
  const pasteSelection = useProjectStore((state) => state.pasteSelection);
  const fillSelection = useProjectStore((state) => state.fillSelection);
  const selection = useProjectStore((state) => state.selection);
  const nextProgressRow = useProjectStore((state) => state.nextProgressRow);
  const prevProgressRow = useProjectStore((state) => state.prevProgressRow);
  const progressTracker = project?.progressTracker;
  const view = useUIStore((state) => state.view);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when in editor view with a project
      if (view !== 'editor' || !project) return;

      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const ctrl = e.ctrlKey || e.metaKey;

      // Tool shortcuts (single keys)
      if (!ctrl && !e.altKey && !e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'd':
            e.preventDefault();
            setActiveTool('draw');
            break;
          case 'e':
            e.preventDefault();
            setActiveTool('erase');
            break;
          case 's':
            e.preventDefault();
            setActiveTool('select');
            break;
          case 'i':
            e.preventDefault();
            setActiveTool('eyedropper');
            break;
          case ' ':
            e.preventDefault();
            setActiveTool('pan');
            break;
          case 'escape':
            e.preventDefault();
            clearSelection();
            break;
          case 'delete':
          case 'backspace':
            if (selection) {
              e.preventDefault();
              fillSelection(null);
            }
            break;
          case 'arrowdown':
            if (progressTracker) {
              e.preventDefault();
              nextProgressRow();
            }
            break;
          case 'arrowup':
            if (progressTracker) {
              e.preventDefault();
              prevProgressRow();
            }
            break;
        }
      }

      // Ctrl/Cmd shortcuts
      if (ctrl) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 's':
            e.preventDefault();
            saveCurrentProject();
            break;
          case '=':
          case '+':
            e.preventDefault();
            setZoom(zoom + 0.1);
            break;
          case '-':
            e.preventDefault();
            setZoom(zoom - 0.1);
            break;
          case '0':
            e.preventDefault();
            setZoom(1);
            break;
          case 'c':
            if (selection) {
              e.preventDefault();
              copySelection();
            }
            break;
          case 'v':
            if (selection) {
              e.preventDefault();
              pasteSelection();
            }
            break;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Return to draw tool when space is released (was in pan mode)
      if (e.key === ' ') {
        const currentTool = useProjectStore.getState().activeTool;
        if (currentTool === 'pan') {
          setActiveTool('draw');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    project,
    view,
    setActiveTool,
    undo,
    redo,
    saveCurrentProject,
    setZoom,
    zoom,
    clearSelection,
    copySelection,
    pasteSelection,
    fillSelection,
    selection,
    nextProgressRow,
    prevProgressRow,
    progressTracker,
  ]);
}
