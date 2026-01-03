import type { Project } from '@/types';

export type PNGSize = 'small' | 'medium' | 'large' | 'custom';

const SIZE_MAP: Record<Exclude<PNGSize, 'custom'>, number> = {
  small: 600,
  medium: 1200,
  large: 2000,
};

export interface PNGExportOptions {
  size: PNGSize;
  customWidth?: number;
  includeGridLines: boolean;
  includeLegend: boolean;
  backgroundColor: string;
  selection?: {
    startRow: number;
    endRow: number;
    startCol: number;
    endCol: number;
  };
}

export function exportProjectToPNG(
  project: Project,
  options: PNGExportOptions
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!project.grid) {
      reject(new Error('Project has no grid data'));
      return;
    }

    const { grid, palette, settings } = project;
    const { includeGridLines, includeLegend, backgroundColor, selection } = options;

    // Calculate area to export
    const startRow = selection ? Math.min(selection.startRow, selection.endRow) : 0;
    const endRow = selection ? Math.max(selection.startRow, selection.endRow) : settings.height - 1;
    const startCol = selection ? Math.min(selection.startCol, selection.endCol) : 0;
    const endCol = selection ? Math.max(selection.startCol, selection.endCol) : settings.width - 1;

    const exportWidth = endCol - startCol + 1;
    const exportHeight = endRow - startRow + 1;

    // Calculate cell size based on target width
    const targetWidth = options.size === 'custom'
      ? (options.customWidth || 1200)
      : SIZE_MAP[options.size];

    const legendWidth = includeLegend ? 150 : 0;
    const cellSize = Math.floor((targetWidth - legendWidth) / exportWidth);

    const canvasWidth = exportWidth * cellSize + legendWidth;
    const canvasHeight = exportHeight * cellSize;

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    // Background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Create color lookup map
    const colorMap = new Map(palette.map((p) => [p.id, p]));

    // Draw cells
    for (let row = 0; row < exportHeight; row++) {
      for (let col = 0; col < exportWidth; col++) {
        const cell = grid.cells[startRow + row]?.[startCol + col];
        if (cell?.colorId) {
          const paletteEntry = colorMap.get(cell.colorId);
          if (paletteEntry) {
            ctx.fillStyle = paletteEntry.color;
            ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
          }
        }
      }
    }

    // Draw grid lines
    if (includeGridLines) {
      ctx.strokeStyle = settings.gridLines.color;
      ctx.lineWidth = 1;

      // Vertical lines
      for (let col = 0; col <= exportWidth; col++) {
        ctx.beginPath();
        ctx.moveTo(col * cellSize, 0);
        ctx.lineTo(col * cellSize, exportHeight * cellSize);
        ctx.stroke();
      }

      // Horizontal lines
      for (let row = 0; row <= exportHeight; row++) {
        ctx.beginPath();
        ctx.moveTo(0, row * cellSize);
        ctx.lineTo(exportWidth * cellSize, row * cellSize);
        ctx.stroke();
      }
    }

    // Draw legend
    if (includeLegend && palette.length > 0) {
      const legendX = exportWidth * cellSize + 10;
      const legendCellSize = 20;
      const lineHeight = 24;

      ctx.font = '12px sans-serif';
      ctx.textBaseline = 'middle';

      palette.forEach((entry, index) => {
        const y = 10 + index * lineHeight;

        // Color swatch
        ctx.fillStyle = entry.color;
        ctx.fillRect(legendX, y, legendCellSize, legendCellSize);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(legendX, y, legendCellSize, legendCellSize);

        // Label
        ctx.fillStyle = '#000';
        ctx.fillText(entry.name, legendX + legendCellSize + 8, y + legendCellSize / 2);
      });
    }

    // Convert to blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create PNG blob'));
        }
      },
      'image/png',
      1.0
    );
  });
}

export async function downloadPNG(project: Project, options: PNGExportOptions): Promise<void> {
  const blob = await exportProjectToPNG(project, options);
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name.replace(/[^a-zA-Z0-9-_]/g, '_')}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
