import LZString from 'lz-string';
import type { Project, ChartType, Cell, PaletteEntry } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export interface CompressionResult {
  compressed: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

// Version 1: Full project (legacy, larger)
export interface ShareableDataV1 {
  v: string;  // "1.0.0"
  p: Project;
}

// Version 2: Compact format (much smaller)
export interface CompactShareableData {
  v: 2;                           // version identifier
  n: string;                      // name
  t: ChartType;                   // chartType
  w: number;                      // width
  h: number;                      // height
  p: [string, string, string][];  // palette: [color, name, abbreviation][]
  g: (number | null)[];           // grid: flattened array of palette indices (null = empty)
  s?: Record<number, number>;     // symbolIds: cell index -> palette index (sparse, only if symbols used)
}

/**
 * Compress a project using compact format for URL/QR sharing
 * Uses numeric indices instead of UUIDs for dramatic size reduction
 */
export function compressProject(project: Project): CompressionResult {
  const compact = projectToCompact(project);
  const json = JSON.stringify(compact);
  const compressed = LZString.compressToEncodedURIComponent(json);

  return {
    compressed,
    originalSize: json.length,
    compressedSize: compressed.length,
    compressionRatio: compressed.length / json.length,
  };
}

/**
 * Convert Project to compact format
 */
function projectToCompact(project: Project): CompactShareableData {
  // Create palette index map: UUID -> index
  const paletteIndexMap = new Map<string, number>();
  const compactPalette: [string, string, string][] = [];

  project.palette.forEach((entry, index) => {
    paletteIndexMap.set(entry.id, index);
    compactPalette.push([entry.color, entry.name, entry.abbreviation]);
  });

  // Convert grid to flat array of indices
  const compactGrid: (number | null)[] = [];
  const symbolMap: Record<number, number> = {};

  if (project.grid?.cells) {
    let cellIndex = 0;
    for (const row of project.grid.cells) {
      for (const cell of row) {
        const colorIndex = cell.colorId ? paletteIndexMap.get(cell.colorId) ?? null : null;
        compactGrid.push(colorIndex);

        // Track symbol assignments (sparse)
        if (cell.symbolId) {
          const symbolPaletteIndex = paletteIndexMap.get(cell.symbolId);
          if (symbolPaletteIndex !== undefined) {
            symbolMap[cellIndex] = symbolPaletteIndex;
          }
        }
        cellIndex++;
      }
    }
  }

  const compact: CompactShareableData = {
    v: 2,
    n: project.name,
    t: project.chartType,
    w: project.settings.width,
    h: project.settings.height,
    p: compactPalette,
    g: compactGrid,
  };

  // Only include symbol map if there are symbols
  if (Object.keys(symbolMap).length > 0) {
    compact.s = symbolMap;
  }

  return compact;
}

/**
 * Convert compact format back to Project
 */
function compactToProject(compact: CompactShareableData): Project {
  // Rebuild palette with new UUIDs
  const palette: PaletteEntry[] = compact.p.map(([color, name, abbreviation]) => ({
    id: uuidv4(),
    color,
    name,
    abbreviation,
  }));

  // Rebuild grid
  const cells: Cell[][] = [];
  let gridIndex = 0;

  for (let row = 0; row < compact.h; row++) {
    const rowCells: Cell[] = [];
    for (let col = 0; col < compact.w; col++) {
      const colorIndex = compact.g[gridIndex];
      const symbolIndex = compact.s?.[gridIndex];

      rowCells.push({
        colorId: colorIndex !== null && colorIndex !== undefined ? palette[colorIndex]?.id ?? null : null,
        symbolId: symbolIndex !== undefined ? palette[symbolIndex]?.id ?? null : null,
      });
      gridIndex++;
    }
    cells.push(rowCells);
  }

  const now = new Date();

  return {
    id: uuidv4(),
    name: compact.n,
    chartType: compact.t,
    createdAt: now,
    updatedAt: now,
    settings: {
      width: compact.w,
      height: compact.h,
      gaugeH: 1,
      gaugeV: 1,
      gridLines: {
        show: true,
        color: '#cccccc',
        thickness: 1,
        highlight5: true,
        highlight10: true,
        highlight5Color: '#999999',
        highlight10Color: '#666666',
      },
      showNumbers: true,
    },
    grid: { cells },
    palette,
  };
}

/**
 * Decompress a shared project from URL/QR data
 * Supports both v1 (full project) and v2 (compact) formats
 */
export function decompressProject(compressed: string): Project | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(compressed);
    if (!json) return null;

    const data = JSON.parse(json);

    // Check version
    if (data.v === 2) {
      // Compact format
      return compactToProject(data as CompactShareableData);
    } else if (data.v && data.p) {
      // Legacy v1 format
      const v1Data = data as ShareableDataV1;
      if (!v1Data.p.id || !v1Data.p.chartType) return null;

      const project = v1Data.p;
      project.createdAt = new Date(project.createdAt);
      project.updatedAt = new Date(project.updatedAt);
      return project;
    }

    return null;
  } catch (err) {
    console.error('Decompression failed:', err);
    return null;
  }
}

/**
 * Estimate the JSON size of a project in bytes
 */
export function estimateProjectSize(project: Project): number {
  return JSON.stringify(project).length;
}
