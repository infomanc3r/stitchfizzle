import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  Project,
  ChartType,
  ChartSettings,
  Cell,
  PaletteEntry,
  EditorTool,
  Selection,
  ProgressState,
  Layer,
  PlacedSymbol,
} from '@/types';
import { createDefaultProject, DEFAULT_CHART_SETTINGS } from '@/types';
import { saveProject, getProject } from '@/services/db';

// Clipboard type for copy/paste
interface Clipboard {
  cells: Cell[][];
  width: number;
  height: number;
}

interface ProjectState {
  // Current project
  project: Project | null;
  isDirty: boolean;

  // Editor state
  activeTool: EditorTool;
  activeColorId: string | null;
  activeSymbolId: string | null;
  selectedSymbolInstanceId: string | null;
  selection: Selection | null;
  zoom: number;
  panOffset: { x: number; y: number };
  clipboard: Clipboard | null;

  // Undo/Redo
  undoStack: Project[];
  redoStack: Project[];

  // Actions
  createProject: (name: string, chartType: ChartType, settings?: ChartSettings) => Project;
  loadProject: (id: string) => Promise<boolean>;
  saveCurrentProject: () => Promise<void>;
  closeProject: () => void;

  // Grid editing
  setCell: (row: number, col: number, colorId: string | null, symbolId?: string | null) => void;
  setCells: (cells: { row: number; col: number; colorId: string | null; symbolId?: string | null }[]) => void;
  fillSelection: (colorId: string | null) => void;

  // Selection
  setSelection: (selection: Selection | null) => void;
  clearSelection: () => void;

  // Clipboard operations
  copySelection: () => void;
  pasteSelection: () => void;
  mirrorSelectionH: () => void;
  mirrorSelectionV: () => void;

  // Palette
  addColor: (color: string, name?: string) => PaletteEntry;
  updateColor: (id: string, updates: Partial<PaletteEntry>) => void;
  removeColor: (id: string) => void;
  setActiveColor: (id: string | null) => void;

  // Tools & Navigation
  setActiveTool: (tool: EditorTool) => void;
  setZoom: (zoom: number) => void;
  setPanOffset: (offset: { x: number; y: number }) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  pushUndoState: () => void;

  // Grid operations
  insertRow: (index: number) => void;
  deleteRow: (index: number) => void;
  insertColumn: (index: number) => void;
  deleteColumn: (index: number) => void;
  resizeGrid: (width: number, height: number) => void;
  toggleShowNumbers: () => void;

  // Flood fill
  floodFill: (row: number, col: number, colorId: string | null) => void;

  // Progress tracker
  initProgressTracker: () => void;
  setProgressRow: (row: number) => void;
  nextProgressRow: () => void;
  prevProgressRow: () => void;
  updateProgressSettings: (settings: Partial<ProgressState>) => void;
  clearProgressTracker: () => void;

  // Freeform mode - symbols
  setActiveSymbol: (symbolId: string | null) => void;
  setSelectedSymbolInstance: (instanceId: string | null) => void;

  // Freeform mode - layers
  addLayer: () => Layer | null;
  removeLayer: (layerId: string) => void;
  updateLayer: (layerId: string, updates: Partial<Layer>) => void;
  setActiveLayer: (layerId: string) => void;
  reorderLayers: (layerIds: string[]) => void;

  // Freeform mode - placed symbols
  addPlacedSymbol: (symbolId: string, x: number, y: number) => PlacedSymbol | null;
  removePlacedSymbol: (symbolInstanceId: string) => void;
  updatePlacedSymbol: (symbolInstanceId: string, updates: Partial<PlacedSymbol>) => void;
  movePlacedSymbol: (symbolInstanceId: string, x: number, y: number) => void;
  rotatePlacedSymbol: (symbolInstanceId: string, rotation: number) => void;
  scalePlacedSymbol: (symbolInstanceId: string, scale: number) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  project: null,
  isDirty: false,
  activeTool: 'draw',
  activeColorId: null,
  activeSymbolId: null,
  selectedSymbolInstanceId: null,
  selection: null,
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  clipboard: null,
  undoStack: [],
  redoStack: [],

  createProject: (name, chartType, settings = DEFAULT_CHART_SETTINGS) => {
    const id = uuidv4();
    const project = createDefaultProject(id, name, chartType, settings);

    // Add a default color
    const defaultColor: PaletteEntry = {
      id: uuidv4(),
      color: '#4A90D9',
      name: 'Color 1',
      abbreviation: 'C1',
    };
    project.palette = [defaultColor];

    set({
      project,
      isDirty: true,
      activeColorId: defaultColor.id,
      selection: null,
      zoom: 1,
      panOffset: { x: 0, y: 0 },
      undoStack: [],
      redoStack: [],
    });

    // Auto-save
    saveProject(project);

    return project;
  },

  loadProject: async (id) => {
    const project = await getProject(id);
    if (project) {
      // Ensure backward compatibility for showNumbers setting
      if (project.settings.showNumbers === undefined) {
        project.settings.showNumbers = true;
      }
      set({
        project,
        isDirty: false,
        activeColorId: project.palette[0]?.id || null,
        selection: null,
        zoom: 1,
        panOffset: { x: 0, y: 0 },
        undoStack: [],
        redoStack: [],
      });
      return true;
    }
    return false;
  },

  saveCurrentProject: async () => {
    const { project } = get();
    if (project) {
      await saveProject(project);
      set({ isDirty: false });
    }
  },

  closeProject: () => {
    set({
      project: null,
      isDirty: false,
      activeColorId: null,
      selection: null,
      undoStack: [],
      redoStack: [],
    });
  },

  setCell: (row, col, colorId, symbolId = null) => {
    const { project } = get();
    if (!project?.grid) return;

    get().pushUndoState();

    const newCells = project.grid.cells.map((r, ri) =>
      ri === row
        ? r.map((c, ci) => (ci === col ? { colorId, symbolId: symbolId ?? c.symbolId } : c))
        : r
    );

    set({
      project: {
        ...project,
        grid: { cells: newCells },
        updatedAt: new Date(),
      },
      isDirty: true,
    });
  },

  setCells: (cells) => {
    const { project } = get();
    if (!project?.grid) return;

    get().pushUndoState();

    const newCells = project.grid.cells.map(row => [...row]);
    for (const { row, col, colorId, symbolId } of cells) {
      if (newCells[row]?.[col]) {
        newCells[row][col] = {
          colorId,
          symbolId: symbolId ?? newCells[row][col].symbolId,
        };
      }
    }

    set({
      project: {
        ...project,
        grid: { cells: newCells },
        updatedAt: new Date(),
      },
      isDirty: true,
    });
  },

  fillSelection: (colorId) => {
    const { project, selection } = get();
    if (!project?.grid || !selection) return;

    const cells: { row: number; col: number; colorId: string | null }[] = [];
    const minRow = Math.min(selection.startRow, selection.endRow);
    const maxRow = Math.max(selection.startRow, selection.endRow);
    const minCol = Math.min(selection.startCol, selection.endCol);
    const maxCol = Math.max(selection.startCol, selection.endCol);

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        cells.push({ row, col, colorId });
      }
    }

    get().setCells(cells);
  },

  setSelection: (selection) => set({ selection }),
  clearSelection: () => set({ selection: null }),

  copySelection: () => {
    const { project, selection } = get();
    if (!project?.grid || !selection) return;

    const minRow = Math.min(selection.startRow, selection.endRow);
    const maxRow = Math.max(selection.startRow, selection.endRow);
    const minCol = Math.min(selection.startCol, selection.endCol);
    const maxCol = Math.max(selection.startCol, selection.endCol);

    const width = maxCol - minCol + 1;
    const height = maxRow - minRow + 1;
    const cells: Cell[][] = [];

    for (let row = 0; row < height; row++) {
      cells[row] = [];
      for (let col = 0; col < width; col++) {
        const sourceCell = project.grid.cells[minRow + row]?.[minCol + col];
        cells[row][col] = sourceCell ? { ...sourceCell } : { colorId: null, symbolId: null };
      }
    }

    set({ clipboard: { cells, width, height } });
  },

  pasteSelection: () => {
    const { project, selection, clipboard } = get();
    if (!project?.grid || !selection || !clipboard) return;

    get().pushUndoState();

    const minRow = Math.min(selection.startRow, selection.endRow);
    const minCol = Math.min(selection.startCol, selection.endCol);

    const newCells = project.grid.cells.map(row => row.map(cell => ({ ...cell })));

    for (let row = 0; row < clipboard.height; row++) {
      for (let col = 0; col < clipboard.width; col++) {
        const targetRow = minRow + row;
        const targetCol = minCol + col;
        if (targetRow < project.settings.height && targetCol < project.settings.width) {
          newCells[targetRow][targetCol] = { ...clipboard.cells[row][col] };
        }
      }
    }

    set({
      project: {
        ...project,
        grid: { cells: newCells },
        updatedAt: new Date(),
      },
      isDirty: true,
    });
  },

  mirrorSelectionH: () => {
    const { project, selection } = get();
    if (!project?.grid || !selection) return;

    get().pushUndoState();

    const minRow = Math.min(selection.startRow, selection.endRow);
    const maxRow = Math.max(selection.startRow, selection.endRow);
    const minCol = Math.min(selection.startCol, selection.endCol);
    const maxCol = Math.max(selection.startCol, selection.endCol);

    const newCells = project.grid.cells.map(row => row.map(cell => ({ ...cell })));

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const mirrorCol = maxCol - (col - minCol);
        newCells[row][col] = { ...project.grid.cells[row][mirrorCol] };
      }
    }

    set({
      project: {
        ...project,
        grid: { cells: newCells },
        updatedAt: new Date(),
      },
      isDirty: true,
    });
  },

  mirrorSelectionV: () => {
    const { project, selection } = get();
    if (!project?.grid || !selection) return;

    get().pushUndoState();

    const minRow = Math.min(selection.startRow, selection.endRow);
    const maxRow = Math.max(selection.startRow, selection.endRow);
    const minCol = Math.min(selection.startCol, selection.endCol);
    const maxCol = Math.max(selection.startCol, selection.endCol);

    const newCells = project.grid.cells.map(row => row.map(cell => ({ ...cell })));

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const mirrorRow = maxRow - (row - minRow);
        newCells[row][col] = { ...project.grid.cells[mirrorRow][col] };
      }
    }

    set({
      project: {
        ...project,
        grid: { cells: newCells },
        updatedAt: new Date(),
      },
      isDirty: true,
    });
  },

  addColor: (color, name) => {
    const { project } = get();
    if (!project) throw new Error('No project loaded');

    const newEntry: PaletteEntry = {
      id: uuidv4(),
      color,
      name: name || `Color ${project.palette.length + 1}`,
      abbreviation: `C${project.palette.length + 1}`,
    };

    set({
      project: {
        ...project,
        palette: [...project.palette, newEntry],
        updatedAt: new Date(),
      },
      isDirty: true,
    });

    return newEntry;
  },

  updateColor: (id, updates) => {
    const { project } = get();
    if (!project) return;

    set({
      project: {
        ...project,
        palette: project.palette.map(p => (p.id === id ? { ...p, ...updates } : p)),
        updatedAt: new Date(),
      },
      isDirty: true,
    });
  },

  removeColor: (id) => {
    const { project, activeColorId } = get();
    if (!project) return;

    // Remove color from grid cells
    let newGrid = project.grid;
    if (newGrid) {
      newGrid = {
        cells: newGrid.cells.map(row =>
          row.map(cell => (cell.colorId === id ? { ...cell, colorId: null } : cell))
        ),
      };
    }

    const newPalette = project.palette.filter(p => p.id !== id);

    set({
      project: {
        ...project,
        palette: newPalette,
        grid: newGrid,
        updatedAt: new Date(),
      },
      isDirty: true,
      activeColorId: activeColorId === id ? (newPalette[0]?.id || null) : activeColorId,
    });
  },

  setActiveColor: (id) => set({ activeColorId: id }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(10, zoom)) }),
  setPanOffset: (offset) => set({ panOffset: offset }),

  pushUndoState: () => {
    const { project, undoStack } = get();
    if (!project) return;

    // Deep clone the project
    const clone = JSON.parse(JSON.stringify(project)) as Project;
    set({
      undoStack: [...undoStack.slice(-49), clone], // Keep last 50 states
      redoStack: [],
    });
  },

  undo: () => {
    const { undoStack, project, redoStack } = get();
    if (undoStack.length === 0 || !project) return;

    const previousState = undoStack[undoStack.length - 1];
    set({
      project: previousState,
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, JSON.parse(JSON.stringify(project)) as Project],
      isDirty: true,
    });
  },

  redo: () => {
    const { redoStack, project, undoStack } = get();
    if (redoStack.length === 0 || !project) return;

    const nextState = redoStack[redoStack.length - 1];
    set({
      project: nextState,
      redoStack: redoStack.slice(0, -1),
      undoStack: [...undoStack, JSON.parse(JSON.stringify(project)) as Project],
      isDirty: true,
    });
  },

  insertRow: (index) => {
    const { project } = get();
    if (!project?.grid) return;

    get().pushUndoState();

    const newRow: Cell[] = Array(project.settings.width)
      .fill(null)
      .map(() => ({ colorId: null, symbolId: null }));

    const newCells = [...project.grid.cells];
    newCells.splice(index, 0, newRow);

    set({
      project: {
        ...project,
        settings: { ...project.settings, height: project.settings.height + 1 },
        grid: { cells: newCells },
        updatedAt: new Date(),
      },
      isDirty: true,
    });
  },

  deleteRow: (index) => {
    const { project } = get();
    if (!project?.grid || project.settings.height <= 1) return;

    get().pushUndoState();

    const newCells = project.grid.cells.filter((_, i) => i !== index);

    set({
      project: {
        ...project,
        settings: { ...project.settings, height: project.settings.height - 1 },
        grid: { cells: newCells },
        updatedAt: new Date(),
      },
      isDirty: true,
    });
  },

  insertColumn: (index) => {
    const { project } = get();
    if (!project?.grid) return;

    get().pushUndoState();

    const newCells = project.grid.cells.map(row => {
      const newRow = [...row];
      newRow.splice(index, 0, { colorId: null, symbolId: null });
      return newRow;
    });

    set({
      project: {
        ...project,
        settings: { ...project.settings, width: project.settings.width + 1 },
        grid: { cells: newCells },
        updatedAt: new Date(),
      },
      isDirty: true,
    });
  },

  deleteColumn: (index) => {
    const { project } = get();
    if (!project?.grid || project.settings.width <= 1) return;

    get().pushUndoState();

    const newCells = project.grid.cells.map(row => row.filter((_, i) => i !== index));

    set({
      project: {
        ...project,
        settings: { ...project.settings, width: project.settings.width - 1 },
        grid: { cells: newCells },
        updatedAt: new Date(),
      },
      isDirty: true,
    });
  },

  resizeGrid: (width, height) => {
    const { project } = get();
    if (!project?.grid) return;

    get().pushUndoState();

    const oldCells = project.grid.cells;
    const newCells: Cell[][] = [];

    for (let row = 0; row < height; row++) {
      newCells[row] = [];
      for (let col = 0; col < width; col++) {
        if (oldCells[row]?.[col]) {
          newCells[row][col] = oldCells[row][col];
        } else {
          newCells[row][col] = { colorId: null, symbolId: null };
        }
      }
    }

    set({
      project: {
        ...project,
        settings: { ...project.settings, width, height },
        grid: { cells: newCells },
        updatedAt: new Date(),
      },
      isDirty: true,
    });
  },

  toggleShowNumbers: () => {
    const { project } = get();
    if (!project) return;

    set({
      project: {
        ...project,
        settings: {
          ...project.settings,
          showNumbers: !project.settings.showNumbers,
        },
        updatedAt: new Date(),
      },
      isDirty: true,
    });
  },

  floodFill: (startRow, startCol, newColorId) => {
    const { project } = get();
    if (!project?.grid) return;

    const { cells } = project.grid;
    const { width, height } = project.settings;

    // Get the color we're replacing
    const targetColorId = cells[startRow]?.[startCol]?.colorId ?? null;

    // Don't fill if target is same as new color
    if (targetColorId === newColorId) return;

    get().pushUndoState();

    // BFS flood fill
    const newCells = cells.map(row => row.map(cell => ({ ...cell })));
    const visited = new Set<string>();
    const queue: [number, number][] = [[startRow, startCol]];

    while (queue.length > 0) {
      const [row, col] = queue.shift()!;
      const key = `${row},${col}`;

      if (visited.has(key)) continue;
      if (row < 0 || row >= height || col < 0 || col >= width) continue;

      const cellColorId = newCells[row][col].colorId ?? null;
      if (cellColorId !== targetColorId) continue;

      visited.add(key);
      newCells[row][col] = { ...newCells[row][col], colorId: newColorId };

      // Add neighbors
      queue.push([row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]);
    }

    set({
      project: {
        ...project,
        grid: { cells: newCells },
        updatedAt: new Date(),
      },
      isDirty: true,
    });
  },

  initProgressTracker: () => {
    const { project } = get();
    if (!project) return;

    const defaultProgress: ProgressState = {
      direction: 'horizontal',
      diagonalDirection: 'bottom-left',
      currentRow: 0,
      darkenMode: 'done',
      brightness: 50,
    };

    set({
      project: {
        ...project,
        progressTracker: defaultProgress,
        updatedAt: new Date(),
      },
      isDirty: true,
    });
  },

  setProgressRow: (row) => {
    const { project } = get();
    if (!project?.progressTracker) return;

    // Calculate max position based on direction
    const { direction } = project.progressTracker;
    const { width, height } = project.settings;
    let maxPosition: number;
    switch (direction) {
      case 'vertical':
        maxPosition = width - 1;
        break;
      case 'diagonal':
        maxPosition = height + width - 2;
        break;
      case 'horizontal':
      default:
        maxPosition = height - 1;
        break;
    }
    const clampedRow = Math.max(0, Math.min(maxPosition, row));

    set({
      project: {
        ...project,
        progressTracker: { ...project.progressTracker, currentRow: clampedRow },
        updatedAt: new Date(),
      },
      isDirty: true,
    });
  },

  nextProgressRow: () => {
    const { project, setProgressRow } = get();
    if (!project?.progressTracker) return;
    setProgressRow(project.progressTracker.currentRow + 1);
  },

  prevProgressRow: () => {
    const { project, setProgressRow } = get();
    if (!project?.progressTracker) return;
    setProgressRow(project.progressTracker.currentRow - 1);
  },

  updateProgressSettings: (settings) => {
    const { project } = get();
    if (!project?.progressTracker) return;

    set({
      project: {
        ...project,
        progressTracker: { ...project.progressTracker, ...settings },
        updatedAt: new Date(),
      },
      isDirty: true,
    });
  },

  clearProgressTracker: () => {
    const { project } = get();
    if (!project) return;

    set({
      project: {
        ...project,
        progressTracker: undefined,
        updatedAt: new Date(),
      },
      isDirty: true,
    });
  },

  // Freeform mode - symbols
  setActiveSymbol: (symbolId) => set({ activeSymbolId: symbolId }),
  setSelectedSymbolInstance: (instanceId) => set({ selectedSymbolInstanceId: instanceId }),

  // Freeform mode - layers
  addLayer: () => {
    const { project } = get();
    if (!project?.freeform) return null;

    const newLayer: Layer = {
      id: uuidv4(),
      name: `Layer ${project.freeform.layers.length + 1}`,
      visible: true,
      locked: false,
      symbols: [],
    };

    set({
      project: {
        ...project,
        freeform: {
          ...project.freeform,
          layers: [...project.freeform.layers, newLayer],
        },
        updatedAt: new Date(),
      },
      isDirty: true,
    });

    return newLayer;
  },

  removeLayer: (layerId) => {
    const { project } = get();
    if (!project?.freeform || project.freeform.layers.length <= 1) return;

    get().pushUndoState();

    const newLayers = project.freeform.layers.filter((l) => l.id !== layerId);
    const newActiveLayerId =
      project.freeform.activeLayerId === layerId
        ? newLayers[0].id
        : project.freeform.activeLayerId;

    set({
      project: {
        ...project,
        freeform: {
          ...project.freeform,
          layers: newLayers,
          activeLayerId: newActiveLayerId,
        },
        updatedAt: new Date(),
      },
      isDirty: true,
    });
  },

  updateLayer: (layerId, updates) => {
    const { project } = get();
    if (!project?.freeform) return;

    set({
      project: {
        ...project,
        freeform: {
          ...project.freeform,
          layers: project.freeform.layers.map((l) =>
            l.id === layerId ? { ...l, ...updates } : l
          ),
        },
        updatedAt: new Date(),
      },
      isDirty: true,
    });
  },

  setActiveLayer: (layerId) => {
    const { project } = get();
    if (!project?.freeform) return;

    set({
      project: {
        ...project,
        freeform: {
          ...project.freeform,
          activeLayerId: layerId,
        },
        updatedAt: new Date(),
      },
      isDirty: true,
    });
  },

  reorderLayers: (layerIds) => {
    const { project } = get();
    if (!project?.freeform) return;

    const layerMap = new Map(project.freeform.layers.map((l) => [l.id, l]));
    const newLayers = layerIds.map((id) => layerMap.get(id)!).filter(Boolean);

    set({
      project: {
        ...project,
        freeform: {
          ...project.freeform,
          layers: newLayers,
        },
        updatedAt: new Date(),
      },
      isDirty: true,
    });
  },

  // Freeform mode - placed symbols
  addPlacedSymbol: (symbolId, x, y) => {
    const { project, activeColorId } = get();
    if (!project?.freeform) return null;

    get().pushUndoState();

    const activeLayer = project.freeform.layers.find(
      (l) => l.id === project.freeform!.activeLayerId
    );
    if (!activeLayer || activeLayer.locked) return null;

    const newSymbol: PlacedSymbol = {
      id: uuidv4(),
      symbolId,
      colorId: activeColorId || project.palette[0]?.id || '',
      x,
      y,
      rotation: 0,
      scale: 1,
    };

    set({
      project: {
        ...project,
        freeform: {
          ...project.freeform,
          layers: project.freeform.layers.map((l) =>
            l.id === activeLayer.id
              ? { ...l, symbols: [...l.symbols, newSymbol] }
              : l
          ),
        },
        updatedAt: new Date(),
      },
      isDirty: true,
      selectedSymbolInstanceId: newSymbol.id,
    });

    return newSymbol;
  },

  removePlacedSymbol: (symbolInstanceId) => {
    const { project } = get();
    if (!project?.freeform) return;

    get().pushUndoState();

    set({
      project: {
        ...project,
        freeform: {
          ...project.freeform,
          layers: project.freeform.layers.map((l) => ({
            ...l,
            symbols: l.symbols.filter((s) => s.id !== symbolInstanceId),
          })),
        },
        updatedAt: new Date(),
      },
      isDirty: true,
      selectedSymbolInstanceId: null,
    });
  },

  updatePlacedSymbol: (symbolInstanceId, updates) => {
    const { project } = get();
    if (!project?.freeform) return;

    set({
      project: {
        ...project,
        freeform: {
          ...project.freeform,
          layers: project.freeform.layers.map((l) => ({
            ...l,
            symbols: l.symbols.map((s) =>
              s.id === symbolInstanceId ? { ...s, ...updates } : s
            ),
          })),
        },
        updatedAt: new Date(),
      },
      isDirty: true,
    });
  },

  movePlacedSymbol: (symbolInstanceId, x, y) => {
    get().updatePlacedSymbol(symbolInstanceId, { x, y });
  },

  rotatePlacedSymbol: (symbolInstanceId, rotation) => {
    get().updatePlacedSymbol(symbolInstanceId, { rotation });
  },

  scalePlacedSymbol: (symbolInstanceId, scale) => {
    get().updatePlacedSymbol(symbolInstanceId, { scale: Math.max(0.1, scale) });
  },
}));
