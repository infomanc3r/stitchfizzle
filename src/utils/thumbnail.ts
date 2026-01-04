import type { Project } from '@/types';
import { getSymbol } from '@/symbols/crochet';

const THUMBNAIL_SIZE = 150;
const GRID_CELL_SIZE = 50; // Must match FreeformCanvas

export function generateThumbnail(project: Project): string | null {
  // Handle freeform projects
  if (project.chartType === 'freeform') {
    return generateFreeformThumbnail(project);
  }

  // Handle grid-based projects
  if (!project.grid || !project.palette.length) {
    return null;
  }

  const { cells } = project.grid;
  const { width, height } = project.settings;

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = THUMBNAIL_SIZE;
  canvas.height = THUMBNAIL_SIZE;
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  // Background
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);

  // Calculate cell size to fit in thumbnail
  const cellSize = Math.max(1, Math.min(
    Math.floor(THUMBNAIL_SIZE / width),
    Math.floor(THUMBNAIL_SIZE / height)
  ));

  // Center the grid
  const gridWidth = cellSize * width;
  const gridHeight = cellSize * height;
  const offsetX = Math.floor((THUMBNAIL_SIZE - gridWidth) / 2);
  const offsetY = Math.floor((THUMBNAIL_SIZE - gridHeight) / 2);

  // Create color lookup
  const colorMap = new Map(project.palette.map((p) => [p.id, p.color]));

  // Draw cells
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const cell = cells[row]?.[col];
      if (cell?.colorId) {
        const color = colorMap.get(cell.colorId);
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(
            offsetX + col * cellSize,
            offsetY + row * cellSize,
            cellSize,
            cellSize
          );
        }
      }
    }
  }

  // Draw subtle grid lines for small grids
  if (cellSize >= 3) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 0.5;

    // Vertical lines
    for (let col = 0; col <= width; col++) {
      ctx.beginPath();
      ctx.moveTo(offsetX + col * cellSize, offsetY);
      ctx.lineTo(offsetX + col * cellSize, offsetY + gridHeight);
      ctx.stroke();
    }

    // Horizontal lines
    for (let row = 0; row <= height; row++) {
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY + row * cellSize);
      ctx.lineTo(offsetX + gridWidth, offsetY + row * cellSize);
      ctx.stroke();
    }
  }

  return canvas.toDataURL('image/png');
}

function generateFreeformThumbnail(project: Project): string | null {
  if (!project.freeform) {
    return null;
  }

  const { layers } = project.freeform;
  const { width, height } = project.settings;

  // Collect all symbols from visible layers
  const allSymbols = layers
    .filter((layer) => layer.visible)
    .flatMap((layer) => layer.symbols);

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = THUMBNAIL_SIZE;
  canvas.height = THUMBNAIL_SIZE;
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  // Background
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);

  // Calculate the grid area in world coordinates
  const gridWidth = width * GRID_CELL_SIZE;
  const gridHeight = height * GRID_CELL_SIZE;

  // Calculate scale to fit in thumbnail with padding
  const padding = 10;
  const availableSize = THUMBNAIL_SIZE - padding * 2;
  const scale = Math.min(availableSize / gridWidth, availableSize / gridHeight);

  // Center the content
  const scaledWidth = gridWidth * scale;
  const scaledHeight = gridHeight * scale;
  const offsetX = (THUMBNAIL_SIZE - scaledWidth) / 2;
  const offsetY = (THUMBNAIL_SIZE - scaledHeight) / 2;

  // Draw grid background (white rectangle)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(offsetX, offsetY, scaledWidth, scaledHeight);

  // Draw grid border
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.strokeRect(offsetX, offsetY, scaledWidth, scaledHeight);

  // Create color lookup
  const colorMap = new Map(project.palette.map((p) => [p.id, p.color]));

  // Draw symbols
  allSymbols.forEach((placedSymbol) => {
    const symbolDef = getSymbol(placedSymbol.symbolId);
    if (!symbolDef) return;

    const color = colorMap.get(placedSymbol.colorId) || '#333333';

    // Transform symbol position to thumbnail coordinates
    const x = offsetX + placedSymbol.x * scale;
    const y = offsetY + placedSymbol.y * scale;
    const symbolScale = scale * placedSymbol.scale * 1.5; // 1.5 to make symbols more visible

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((placedSymbol.rotation * Math.PI) / 180);
    ctx.scale(symbolScale, symbolScale);

    // Draw the SVG path
    const path = new Path2D(symbolDef.svgPath);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2 / symbolScale; // Keep consistent line width
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Center the path (SVG paths are designed for 24x24 viewBox)
    ctx.translate(-12, -12);
    ctx.stroke(path);

    ctx.restore();
  });

  return canvas.toDataURL('image/png');
}

// Cache for thumbnails
const thumbnailCache = new Map<string, string>();

export function getCachedThumbnail(project: Project): string | null {
  const cacheKey = `${project.id}-${project.updatedAt.getTime()}`;

  if (thumbnailCache.has(cacheKey)) {
    return thumbnailCache.get(cacheKey)!;
  }

  const thumbnail = generateThumbnail(project);
  if (thumbnail) {
    thumbnailCache.set(cacheKey, thumbnail);

    // Limit cache size
    if (thumbnailCache.size > 50) {
      const firstKey = thumbnailCache.keys().next().value;
      if (firstKey) thumbnailCache.delete(firstKey);
    }
  }

  return thumbnail;
}
