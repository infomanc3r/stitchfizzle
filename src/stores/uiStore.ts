import { create } from 'zustand';

type DialogType = 'newProject' | 'settings' | 'export' | 'import' | 'chartSettings' | 'writtenInstructions' | 'imageImport' | null;
type PanelType = 'palette' | 'layers' | 'progress';

interface UIState {
  // Dialogs
  activeDialog: DialogType;
  openDialog: (dialog: DialogType) => void;
  closeDialog: () => void;

  // Panels
  visiblePanels: Set<PanelType>;
  togglePanel: (panel: PanelType) => void;
  showPanel: (panel: PanelType) => void;
  hidePanel: (panel: PanelType) => void;

  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // View mode
  view: 'projects' | 'editor';
  setView: (view: 'projects' | 'editor') => void;

  // Toast notifications
  toasts: { id: string; message: string; type: 'success' | 'error' | 'info' }[];
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  activeDialog: null,
  visiblePanels: new Set(['palette']),
  sidebarOpen: true,
  view: 'projects',
  toasts: [],

  openDialog: (dialog) => set({ activeDialog: dialog }),
  closeDialog: () => set({ activeDialog: null }),

  togglePanel: (panel) => {
    const { visiblePanels } = get();
    const newPanels = new Set(visiblePanels);
    if (newPanels.has(panel)) {
      newPanels.delete(panel);
    } else {
      newPanels.add(panel);
    }
    set({ visiblePanels: newPanels });
  },

  showPanel: (panel) => {
    const { visiblePanels } = get();
    const newPanels = new Set(visiblePanels);
    newPanels.add(panel);
    set({ visiblePanels: newPanels });
  },

  hidePanel: (panel) => {
    const { visiblePanels } = get();
    const newPanels = new Set(visiblePanels);
    newPanels.delete(panel);
    set({ visiblePanels: newPanels });
  },

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  setView: (view) => set({ view }),

  addToast: (message, type = 'info') => {
    const id = Date.now().toString();
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));

    // Auto-remove after 5 seconds
    setTimeout(() => {
      get().removeToast(id);
    }, 5000);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));
