import type { Project } from '@/types';

export interface SVGExportOptions {
  cellSize: number;
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

export function exportProjectToSVG(project: Project, options: SVGExportOptions): string {
  if (!project.grid) {
    throw new Error('Project has no grid data');
  }

  const { grid, palette, settings } = project;
  const { cellSize, includeGridLines, includeLegend, backgroundColor, selection } = options;

  // Calculate area to export
  const startRow = selection ? Math.min(selection.startRow, selection.endRow) : 0;
  const endRow = selection ? Math.max(selection.startRow, selection.endRow) : settings.height - 1;
  const startCol = selection ? Math.min(selection.startCol, selection.endCol) : 0;
  const endCol = selection ? Math.max(selection.startCol, selection.endCol) : settings.width - 1;

  const exportWidth = endCol - startCol + 1;
  const exportHeight = endRow - startRow + 1;

  const legendWidth = includeLegend ? 150 : 0;
  const svgWidth = exportWidth * cellSize + legendWidth;
  const svgHeight = exportHeight * cellSize;

  // Create color lookup map
  const colorMap = new Map(palette.map((p) => [p.id, p]));

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
  <defs>
    <style>
      .cell { stroke: none; }
      .grid-line { stroke: ${settings.gridLines.color}; stroke-width: 1; fill: none; }
      .legend-text { font-family: sans-serif; font-size: 12px; }
    </style>
  </defs>

  <!-- Background -->
  <rect width="${svgWidth}" height="${svgHeight}" fill="${backgroundColor}" />

  <!-- Cells -->
  <g id="cells">
`;

  // Draw cells
  for (let row = 0; row < exportHeight; row++) {
    for (let col = 0; col < exportWidth; col++) {
      const cell = grid.cells[startRow + row]?.[startCol + col];
      if (cell?.colorId) {
        const paletteEntry = colorMap.get(cell.colorId);
        if (paletteEntry) {
          svg += `    <rect class="cell" x="${col * cellSize}" y="${row * cellSize}" width="${cellSize}" height="${cellSize}" fill="${paletteEntry.color}" />\n`;
        }
      }
    }
  }

  svg += `  </g>\n`;

  // Draw grid lines
  if (includeGridLines) {
    svg += `
  <!-- Grid Lines -->
  <g id="grid-lines">
`;

    // Vertical lines
    for (let col = 0; col <= exportWidth; col++) {
      svg += `    <line class="grid-line" x1="${col * cellSize}" y1="0" x2="${col * cellSize}" y2="${exportHeight * cellSize}" />\n`;
    }

    // Horizontal lines
    for (let row = 0; row <= exportHeight; row++) {
      svg += `    <line class="grid-line" x1="0" y1="${row * cellSize}" x2="${exportWidth * cellSize}" y2="${row * cellSize}" />\n`;
    }

    svg += `  </g>\n`;
  }

  // Draw legend
  if (includeLegend && palette.length > 0) {
    const legendX = exportWidth * cellSize + 10;
    const legendCellSize = 20;
    const lineHeight = 24;

    svg += `
  <!-- Legend -->
  <g id="legend">
`;

    palette.forEach((entry, index) => {
      const y = 10 + index * lineHeight;

      svg += `    <rect x="${legendX}" y="${y}" width="${legendCellSize}" height="${legendCellSize}" fill="${entry.color}" stroke="#000" stroke-width="1" />\n`;
      svg += `    <text class="legend-text" x="${legendX + legendCellSize + 8}" y="${y + legendCellSize / 2}" dominant-baseline="middle">${escapeXml(entry.name)}</text>\n`;
    });

    svg += `  </g>\n`;
  }

  svg += `</svg>`;

  return svg;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function downloadSVG(project: Project, options: SVGExportOptions): void {
  const svg = exportProjectToSVG(project, options);
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name.replace(/[^a-zA-Z0-9-_]/g, '_')}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
