import ExcelJS from 'exceljs';
import type { Project } from '@/types';

export interface XLSXExportOptions {
  includeColorLegend: boolean;
  cellSize: number; // Width in Excel units
  selection?: {
    startRow: number;
    endRow: number;
    startCol: number;
    endCol: number;
  };
}

export async function exportProjectToXLSX(
  project: Project,
  options: XLSXExportOptions
): Promise<Blob> {
  if (!project.grid) {
    throw new Error('Project has no grid data');
  }

  const { grid, palette, settings } = project;
  const { includeColorLegend, cellSize, selection } = options;

  // Calculate area to export
  const startRow = selection ? Math.min(selection.startRow, selection.endRow) : 0;
  const endRow = selection ? Math.max(selection.startRow, selection.endRow) : settings.height - 1;
  const startCol = selection ? Math.min(selection.startCol, selection.endCol) : 0;
  const endCol = selection ? Math.max(selection.startCol, selection.endCol) : settings.width - 1;

  const exportWidth = endCol - startCol + 1;
  const exportHeight = endRow - startRow + 1;

  // Create workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'StitchFizzle';
  workbook.created = new Date();

  const chartSheet = workbook.addWorksheet('Chart', {
    views: [{ showGridLines: true }],
  });

  // Create color lookup
  const colorMap = new Map(palette.map((p) => [p.id, p]));

  // Set column widths
  for (let col = 1; col <= exportWidth; col++) {
    chartSheet.getColumn(col).width = cellSize;
  }

  // Draw cells
  for (let row = 0; row < exportHeight; row++) {
    const excelRow = chartSheet.getRow(row + 1);
    excelRow.height = cellSize * 5; // Excel row height is in points

    for (let col = 0; col < exportWidth; col++) {
      const cell = grid.cells[startRow + row]?.[startCol + col];
      const excelCell = excelRow.getCell(col + 1);

      if (cell?.colorId) {
        const paletteEntry = colorMap.get(cell.colorId);
        if (paletteEntry) {
          // Set cell background color
          excelCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF' + paletteEntry.color.replace('#', '') },
          };

          // Add abbreviation as cell value
          excelCell.value = paletteEntry.abbreviation;
          excelCell.alignment = { horizontal: 'center', vertical: 'middle' };
          excelCell.font = { size: 8, color: { argb: getContrastColor(paletteEntry.color) } };
        }
      }

      // Add border
      excelCell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      };
    }
  }

  // Add color legend sheet if requested
  if (includeColorLegend && palette.length > 0) {
    const legendSheet = workbook.addWorksheet('Color Legend');

    legendSheet.getColumn(1).width = 5;
    legendSheet.getColumn(2).width = 20;
    legendSheet.getColumn(3).width = 10;

    // Header row
    const headerRow = legendSheet.getRow(1);
    headerRow.getCell(1).value = 'Color';
    headerRow.getCell(2).value = 'Name';
    headerRow.getCell(3).value = 'Abbrev';
    headerRow.font = { bold: true };

    // Color entries
    palette.forEach((entry, idx) => {
      const row = legendSheet.getRow(idx + 2);

      // Color swatch
      const colorCell = row.getCell(1);
      colorCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF' + entry.color.replace('#', '') },
      };
      colorCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };

      // Name
      row.getCell(2).value = entry.name;

      // Abbreviation
      row.getCell(3).value = entry.abbreviation;
    });
  }

  // Generate blob
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

// Get contrasting text color (black or white) based on background
function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? 'FF000000' : 'FFFFFFFF';
}

export async function downloadXLSX(
  project: Project,
  options: XLSXExportOptions
): Promise<void> {
  const blob = await exportProjectToXLSX(project, options);
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name.replace(/[^a-zA-Z0-9-_]/g, '_')}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
