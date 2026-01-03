import type { Project, ChartType } from '@/types';

export interface InstructionOptions {
  direction: 'bottom-to-top' | 'top-to-bottom';
  includeRowNumbers: boolean;
  includeStitchCounts: boolean;
  format: 'plain' | 'markdown';
  c2cNotation: boolean; // For C2C: use increase/decrease notation
}

export interface GeneratedInstructions {
  text: string;
  rowCount: number;
  totalStitches: number;
  colorsUsed: string[];
}

export function generateWrittenInstructions(
  project: Project,
  options: InstructionOptions
): GeneratedInstructions {
  if (!project.grid) {
    throw new Error('Project has no grid data');
  }

  const { grid, palette, settings, chartType } = project;
  const { direction, includeRowNumbers, includeStitchCounts, format, c2cNotation } = options;

  // Create abbreviation map
  const colorAbbr = new Map(
    palette.map((p) => [p.id, p.abbreviation || p.name.substring(0, 3)])
  );
  const colorNames = new Map(palette.map((p) => [p.id, p.name]));

  // Get rows in correct order
  const rows = [...grid.cells];
  if (direction === 'bottom-to-top') {
    rows.reverse();
  }

  const lines: string[] = [];
  let totalStitches = 0;
  const colorsUsedSet = new Set<string>();

  // Header
  if (format === 'markdown') {
    lines.push(`# ${project.name}`);
    lines.push('');
    lines.push(`Chart type: ${getChartTypeLabel(chartType)}`);
    lines.push(`Size: ${settings.width} x ${settings.height}`);
    lines.push('');
    lines.push('## Color Legend');
    lines.push('');
    for (const p of palette) {
      lines.push(`- **${p.abbreviation || p.name.substring(0, 3)}**: ${p.name}`);
    }
    lines.push('');
    lines.push('## Instructions');
    lines.push('');
  } else {
    lines.push(project.name);
    lines.push('-'.repeat(project.name.length));
    lines.push('');
    lines.push(`Chart type: ${getChartTypeLabel(chartType)}`);
    lines.push(`Size: ${settings.width} x ${settings.height}`);
    lines.push('');
    lines.push('Color Legend:');
    for (const p of palette) {
      lines.push(`  ${p.abbreviation || p.name.substring(0, 3)} = ${p.name}`);
    }
    lines.push('');
    lines.push('Instructions:');
    lines.push('');
  }

  // C2C special handling
  if (chartType === 'c2c' && c2cNotation) {
    lines.push(...generateC2CInstructions(rows, colorAbbr, colorNames, colorsUsedSet, includeRowNumbers, format));
    totalStitches = rows.reduce((sum, row) => sum + row.filter((c) => c.colorId).length, 0);
  } else {
    // Standard row-by-row instructions
    rows.forEach((row, rowIndex) => {
      const actualRowNum = direction === 'bottom-to-top' ? settings.height - rowIndex : rowIndex + 1;
      const rowInstructions = generateRowInstructions(row, colorAbbr, colorsUsedSet);
      const stitchCount = row.filter((c) => c.colorId).length;
      totalStitches += stitchCount;

      let line = '';
      if (includeRowNumbers) {
        line += format === 'markdown' ? `**Row ${actualRowNum}:** ` : `Row ${actualRowNum}: `;
      }
      line += rowInstructions;
      if (includeStitchCounts && stitchCount > 0) {
        line += ` (${stitchCount} stitches)`;
      }

      lines.push(line);
    });
  }

  // Summary
  lines.push('');
  if (format === 'markdown') {
    lines.push('## Summary');
    lines.push('');
    lines.push(`- Total rows: ${settings.height}`);
    lines.push(`- Total stitches: ${totalStitches}`);
    lines.push(`- Colors used: ${colorsUsedSet.size}`);
  } else {
    lines.push('Summary:');
    lines.push(`  Total rows: ${settings.height}`);
    lines.push(`  Total stitches: ${totalStitches}`);
    lines.push(`  Colors used: ${colorsUsedSet.size}`);
  }

  return {
    text: lines.join('\n'),
    rowCount: settings.height,
    totalStitches,
    colorsUsed: Array.from(colorsUsedSet),
  };
}

function generateRowInstructions(
  row: { colorId: string | null; symbolId: string | null }[],
  colorAbbr: Map<string, string>,
  colorsUsedSet: Set<string>
): string {
  const segments: { color: string | null; count: number }[] = [];

  for (const cell of row) {
    const lastSegment = segments[segments.length - 1];
    if (lastSegment && lastSegment.color === cell.colorId) {
      lastSegment.count++;
    } else {
      segments.push({ color: cell.colorId, count: 1 });
    }
    if (cell.colorId) {
      colorsUsedSet.add(cell.colorId);
    }
  }

  return segments
    .filter((s) => s.color !== null)
    .map((s) => {
      const abbr = colorAbbr.get(s.color!) || '?';
      return s.count > 1 ? `${s.count}${abbr}` : abbr;
    })
    .join(', ');
}

function generateC2CInstructions(
  rows: { colorId: string | null; symbolId: string | null }[][],
  colorAbbr: Map<string, string>,
  _colorNames: Map<string, string>,
  colorsUsedSet: Set<string>,
  includeRowNumbers: boolean,
  format: 'plain' | 'markdown'
): string[] {
  const lines: string[] = [];
  const height = rows.length;
  const width = rows[0]?.length || 0;

  // C2C is worked diagonally
  // Increase phase: rows 1 to min(height, width)
  // Decrease phase: remaining rows

  let diagonalNum = 1;

  for (let startRow = height - 1; startRow >= 0; startRow--) {
    const diagonal: { color: string | null }[] = [];
    let r = startRow;
    let c = 0;

    while (r < height && c < width) {
      diagonal.push({ color: rows[r][c].colorId });
      const colorId = rows[r][c].colorId;
      if (colorId) {
        colorsUsedSet.add(colorId);
      }
      r++;
      c++;
    }

    const segments = compressDiagonal(diagonal, colorAbbr);
    const phase = diagonalNum <= Math.min(height, width) ? 'Inc' : 'Dec';

    let line = '';
    if (includeRowNumbers) {
      line += format === 'markdown' ? `**Row ${diagonalNum} (${phase}):** ` : `Row ${diagonalNum} (${phase}): `;
    }
    line += segments;
    lines.push(line);

    diagonalNum++;
  }

  for (let startCol = 1; startCol < width; startCol++) {
    const diagonal: { color: string | null }[] = [];
    let r = 0;
    let c = startCol;

    while (r < height && c < width) {
      diagonal.push({ color: rows[r][c].colorId });
      const colorId = rows[r][c].colorId;
      if (colorId) {
        colorsUsedSet.add(colorId);
      }
      r++;
      c++;
    }

    const segments = compressDiagonal(diagonal, colorAbbr);

    let line = '';
    if (includeRowNumbers) {
      line += format === 'markdown' ? `**Row ${diagonalNum} (Dec):** ` : `Row ${diagonalNum} (Dec): `;
    }
    line += segments;
    lines.push(line);

    diagonalNum++;
  }

  return lines;
}

function compressDiagonal(
  diagonal: { color: string | null }[],
  colorAbbr: Map<string, string>
): string {
  const segments: { color: string | null; count: number }[] = [];

  for (const cell of diagonal) {
    const lastSegment = segments[segments.length - 1];
    if (lastSegment && lastSegment.color === cell.color) {
      lastSegment.count++;
    } else {
      segments.push({ color: cell.color, count: 1 });
    }
  }

  return segments
    .filter((s) => s.color !== null)
    .map((s) => {
      const abbr = colorAbbr.get(s.color!) || '?';
      return s.count > 1 ? `${s.count}${abbr}` : abbr;
    })
    .join(', ');
}

function getChartTypeLabel(chartType: ChartType): string {
  const labels: Record<ChartType, string> = {
    c2c: 'Corner to Corner (C2C)',
    colorwork: 'Colorwork',
    filet: 'Filet Crochet',
    mosaic: 'Overlay Mosaic',
    freeform: 'Freeform',
    tunisian: 'Tunisian',
  };
  return labels[chartType];
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function downloadAsText(text: string, filename: string): void {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
