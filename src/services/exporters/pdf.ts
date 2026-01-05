import jsPDF from 'jspdf';
import type { Project } from '@/types';

export type PDFPageCount = 1 | 4 | 9 | 16;

export interface PDFExportOptions {
  pages: PDFPageCount;
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

export async function exportProjectToPDF(
  project: Project,
  options: PDFExportOptions
): Promise<jsPDF> {
  if (!project.grid) {
    throw new Error('Project has no grid data');
  }

  const { grid, palette, settings } = project;
  const { pages, includeGridLines, includeLegend, backgroundColor, selection } = options;

  // Calculate area to export
  const startRow = selection ? Math.min(selection.startRow, selection.endRow) : 0;
  const endRow = selection ? Math.max(selection.startRow, selection.endRow) : settings.height - 1;
  const startCol = selection ? Math.min(selection.startCol, selection.endCol) : 0;
  const endCol = selection ? Math.max(selection.startCol, selection.endCol) : settings.width - 1;

  const exportWidth = endCol - startCol + 1;
  const exportHeight = endRow - startRow + 1;

  // Create color lookup map
  const colorMap = new Map(palette.map((p) => [p.id, p]));

  // PDF dimensions (A4 in mm)
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10;

  // Calculate grid for multi-page
  const gridX = pages === 1 || pages === 4 ? 1 : pages === 9 ? 3 : 4;
  const gridY = pages === 1 ? 1 : pages === 4 ? 2 : pages === 9 ? 3 : 4;

  // Single-page content area
  const showNumbers = settings.showNumbers ?? false;
  const numberMargin = showNumbers ? 8 : 0;
  const contentWidth = pageWidth - 2 * margin - numberMargin * 2;
  const contentHeight = pageHeight - 2 * margin - (includeLegend ? 40 : 0) - numberMargin * 2;
  const gridOffsetX = margin + numberMargin;
  const gridOffsetY = margin + numberMargin;

  // Create PDF
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Generate pages
  for (let pageY = 0; pageY < gridY; pageY++) {
    for (let pageX = 0; pageX < gridX; pageX++) {
      if (pageX > 0 || pageY > 0) {
        pdf.addPage();
      }

      // Background
      pdf.setFillColor(backgroundColor);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');

      // Calculate which cells go on this page
      const cellsPerPageX = Math.ceil(exportWidth / gridX);
      const cellsPerPageY = Math.ceil(exportHeight / gridY);
      const pageStartCol = pageX * cellsPerPageX;
      const pageEndCol = Math.min((pageX + 1) * cellsPerPageX, exportWidth);
      const pageStartRow = pageY * cellsPerPageY;
      const pageEndRow = Math.min((pageY + 1) * cellsPerPageY, exportHeight);

      // Adjust cell size for this page
      const pageCellsX = pageEndCol - pageStartCol;
      const pageCellsY = pageEndRow - pageStartRow;
      const pageCellSizeW = contentWidth / pageCellsX;
      const pageCellSizeH = contentHeight / pageCellsY;
      const pageCellSize = Math.min(pageCellSizeW, pageCellSizeH);

      // Draw cells
      for (let row = pageStartRow; row < pageEndRow; row++) {
        for (let col = pageStartCol; col < pageEndCol; col++) {
          const cell = grid.cells[startRow + row]?.[startCol + col];
          if (cell?.colorId) {
            const paletteEntry = colorMap.get(cell.colorId);
            if (paletteEntry) {
              pdf.setFillColor(paletteEntry.color);
              pdf.rect(
                gridOffsetX + (col - pageStartCol) * pageCellSize,
                gridOffsetY + (row - pageStartRow) * pageCellSize,
                pageCellSize,
                pageCellSize,
                'F'
              );
            }
          }
        }
      }

      // Draw grid lines
      if (includeGridLines) {
        pdf.setDrawColor(settings.gridLines.color);
        pdf.setLineWidth(0.1);

        // Vertical lines
        for (let col = 0; col <= pageCellsX; col++) {
          pdf.line(
            gridOffsetX + col * pageCellSize,
            gridOffsetY,
            gridOffsetX + col * pageCellSize,
            gridOffsetY + pageCellsY * pageCellSize
          );
        }

        // Horizontal lines
        for (let row = 0; row <= pageCellsY; row++) {
          pdf.line(
            gridOffsetX,
            gridOffsetY + row * pageCellSize,
            gridOffsetX + pageCellsX * pageCellSize,
            gridOffsetY + row * pageCellSize
          );
        }
      }

      // Draw row/column numbers if enabled
      if (showNumbers) {
        const fontSize = Math.max(4, Math.min(8, pageCellSize * 0.4));
        pdf.setFontSize(fontSize);
        pdf.setTextColor(100, 100, 100);

        // Row numbers (left and right sides)
        // Crochet style: row 1 at bottom, row N at top
        for (let row = pageStartRow; row < pageEndRow; row++) {
          const displayRowNum = selection
            ? (settings.height - (startRow + row))
            : (exportHeight - row);
          const y = gridOffsetY + (row - pageStartRow) * pageCellSize + pageCellSize / 2 + fontSize / 4;

          // Left side
          pdf.text(String(displayRowNum), gridOffsetX - 2, y, { align: 'right' });

          // Right side
          pdf.text(String(displayRowNum), gridOffsetX + pageCellsX * pageCellSize + 2, y, { align: 'left' });
        }

        // Column numbers (top and bottom sides)
        // Crochet style: column 1 on right, column N on left
        for (let col = pageStartCol; col < pageEndCol; col++) {
          const displayColNum = selection
            ? (settings.width - (startCol + col))
            : (exportWidth - col);
          const x = gridOffsetX + (col - pageStartCol) * pageCellSize + pageCellSize / 2;

          // Top
          pdf.text(String(displayColNum), x, gridOffsetY - 2, { align: 'center' });

          // Bottom
          pdf.text(String(displayColNum), x, gridOffsetY + pageCellsY * pageCellSize + fontSize + 2, { align: 'center' });
        }
      }

      // Draw legend on first page only
      if (includeLegend && pageX === 0 && pageY === 0 && palette.length > 0) {
        const legendY = gridOffsetY + pageCellsY * pageCellSize + numberMargin + 5;
        const legendCellSize = 5;
        const colWidth = 50;

        pdf.setFontSize(8);
        pdf.setTextColor(0, 0, 0);

        palette.forEach((entry, index) => {
          const col = index % 4;
          const row = Math.floor(index / 4);

          const x = margin + col * colWidth;
          const y = legendY + row * 8;

          // Color swatch
          pdf.setFillColor(entry.color);
          pdf.rect(x, y, legendCellSize, legendCellSize, 'F');
          pdf.setDrawColor(0, 0, 0);
          pdf.rect(x, y, legendCellSize, legendCellSize, 'S');

          // Label
          pdf.text(entry.abbreviation || entry.name.substring(0, 8), x + legendCellSize + 2, y + 3.5);
        });
      }

      // Page number for multi-page
      if (pages > 1) {
        const pageNum = pageY * gridX + pageX + 1;
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Page ${pageNum} of ${pages}`, pageWidth - margin - 20, pageHeight - 5);
      }
    }
  }

  return pdf;
}

export async function downloadPDF(project: Project, options: PDFExportOptions): Promise<void> {
  const pdf = await exportProjectToPDF(project, options);
  pdf.save(`${project.name.replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`);
}
