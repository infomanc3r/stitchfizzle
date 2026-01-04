// Chart Types
export type ChartType = 'c2c' | 'colorwork' | 'filet' | 'mosaic' | 'freeform' | 'tunisian';

// Grid Line Settings
export interface GridLineSettings {
  show: boolean;
  color: string;
  thickness: number;
  highlight5: boolean;
  highlight10: boolean;
  highlight5Color: string;
  highlight10Color: string;
}

// Chart Settings
export interface ChartSettings {
  width: number;
  height: number;
  gaugeH: number;
  gaugeV: number;
  gridLines: GridLineSettings;
}

// Cell in grid-based charts
export interface Cell {
  colorId: string | null;
  symbolId: string | null;
}

// Grid data for grid-based charts
export interface GridData {
  cells: Cell[][];
}

// Placed symbol in freeform charts
export interface PlacedSymbol {
  id: string;
  symbolId: string;
  colorId: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

// Layer in freeform charts
export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  symbols: PlacedSymbol[];
}

// Freeform data
export interface FreeformData {
  layers: Layer[];
  activeLayerId: string;
}

// Palette entry (color + optional symbol)
export interface PaletteEntry {
  id: string;
  color: string;
  symbolId?: string;
  name: string;
  abbreviation: string;
}

// Progress tracker state
export interface ProgressState {
  direction: 'horizontal' | 'vertical' | 'diagonal';
  currentRow: number;
  darkenMode: 'todo' | 'done' | 'except-current' | 'none';
  brightness: number;
}

// Folder for organizing projects
export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: Date;
}

// Main Project interface
export interface Project {
  id: string;
  name: string;
  chartType: ChartType;
  createdAt: Date;
  updatedAt: Date;
  folderId?: string;
  settings: ChartSettings;
  grid?: GridData;
  freeform?: FreeformData;
  palette: PaletteEntry[];
  progressTracker?: ProgressState;
}

// Export file format
export interface ExportFile {
  version: string;
  app: 'stitchfizzle';
  exportedAt: string;
  project: Project;
}

// App settings (stored separately from projects)
export interface AppSettings {
  darkMode: boolean;
  units: 'imperial' | 'metric';
  handedness: 'left' | 'right';
  defaultGridWidth: number;
  defaultGridHeight: number;
  defaultGaugeH: number;
  defaultGaugeV: number;
}

// Tool types for the editor
export type EditorTool = 'draw' | 'erase' | 'select' | 'pan' | 'eyedropper' | 'fill';

// Selection state
export interface Selection {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

// Symbol definition (for the built-in symbol library)
export interface SymbolDefinition {
  id: string;
  name: string;
  abbreviation: string;
  category: string;
  svgPath: string;
  defaultColor?: string;
}

// Default values
export const DEFAULT_GRID_LINE_SETTINGS: GridLineSettings = {
  show: true,
  color: '#cccccc',
  thickness: 1,
  highlight5: true,
  highlight10: true,
  highlight5Color: '#999999',
  highlight10Color: '#666666',
};

export const DEFAULT_CHART_SETTINGS: ChartSettings = {
  width: 50,
  height: 50,
  gaugeH: 1,
  gaugeV: 1,
  gridLines: DEFAULT_GRID_LINE_SETTINGS,
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  darkMode: true,
  units: 'metric',
  handedness: 'right',
  defaultGridWidth: 50,
  defaultGridHeight: 50,
  defaultGaugeH: 1,
  defaultGaugeV: 1,
};

// Helper to create empty grid
export function createEmptyGrid(width: number, height: number): GridData {
  const cells: Cell[][] = [];
  for (let row = 0; row < height; row++) {
    cells[row] = [];
    for (let col = 0; col < width; col++) {
      cells[row][col] = { colorId: null, symbolId: null };
    }
  }
  return { cells };
}

// Helper to create default project
export function createDefaultProject(
  id: string,
  name: string,
  chartType: ChartType,
  settings: ChartSettings = DEFAULT_CHART_SETTINGS
): Project {
  const now = new Date();
  const project: Project = {
    id,
    name,
    chartType,
    createdAt: now,
    updatedAt: now,
    settings,
    palette: [],
  };

  if (chartType === 'freeform') {
    project.freeform = {
      layers: [{ id: 'layer-1', name: 'Layer 1', visible: true, locked: false, symbols: [] }],
      activeLayerId: 'layer-1',
    };
  } else {
    project.grid = createEmptyGrid(settings.width, settings.height);
  }

  return project;
}
