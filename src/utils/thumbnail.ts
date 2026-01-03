import type { Project } from '@/types';

const THUMBNAIL_SIZE = 150;

export function generateThumbnail(project: Project): string | null {
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
