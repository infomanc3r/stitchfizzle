import type { PaletteEntry, Cell } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export interface ImageImportOptions {
  targetWidth: number;
  targetHeight: number;
  maxColors: number;
  rotation: 0 | 90 | 180 | 270;
}

export interface ImageImportResult {
  cells: Cell[][];
  palette: PaletteEntry[];
  width: number;
  height: number;
}

// Color quantization using median cut algorithm
interface ColorBox {
  colors: number[][];
  rMin: number;
  rMax: number;
  gMin: number;
  gMax: number;
  bMin: number;
  bMax: number;
}

function getColorBounds(colors: number[][]): ColorBox {
  let rMin = 255, rMax = 0;
  let gMin = 255, gMax = 0;
  let bMin = 255, bMax = 0;

  for (const [r, g, b] of colors) {
    rMin = Math.min(rMin, r);
    rMax = Math.max(rMax, r);
    gMin = Math.min(gMin, g);
    gMax = Math.max(gMax, g);
    bMin = Math.min(bMin, b);
    bMax = Math.max(bMax, b);
  }

  return { colors, rMin, rMax, gMin, gMax, bMin, bMax };
}

function splitBox(box: ColorBox): [ColorBox, ColorBox] {
  const rRange = box.rMax - box.rMin;
  const gRange = box.gMax - box.gMin;
  const bRange = box.bMax - box.bMin;

  let sortIndex: number;
  if (rRange >= gRange && rRange >= bRange) {
    sortIndex = 0;
  } else if (gRange >= bRange) {
    sortIndex = 1;
  } else {
    sortIndex = 2;
  }

  box.colors.sort((a, b) => a[sortIndex] - b[sortIndex]);
  const mid = Math.floor(box.colors.length / 2);

  return [
    getColorBounds(box.colors.slice(0, mid)),
    getColorBounds(box.colors.slice(mid)),
  ];
}

function getAverageColor(box: ColorBox): [number, number, number] {
  let rSum = 0, gSum = 0, bSum = 0;
  for (const [r, g, b] of box.colors) {
    rSum += r;
    gSum += g;
    bSum += b;
  }
  const count = box.colors.length;
  return [
    Math.round(rSum / count),
    Math.round(gSum / count),
    Math.round(bSum / count),
  ];
}

function medianCut(colors: number[][], maxColors: number): [number, number, number][] {
  if (colors.length === 0) return [];
  if (colors.length <= maxColors) {
    // Deduplicate and return
    const seen = new Set<string>();
    const result: [number, number, number][] = [];
    for (const [r, g, b] of colors) {
      const key = `${r},${g},${b}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push([r, g, b]);
      }
    }
    return result;
  }

  let boxes: ColorBox[] = [getColorBounds(colors)];

  while (boxes.length < maxColors) {
    // Find box with most colors
    let maxIdx = 0;
    let maxLen = 0;
    for (let i = 0; i < boxes.length; i++) {
      if (boxes[i].colors.length > maxLen) {
        maxLen = boxes[i].colors.length;
        maxIdx = i;
      }
    }

    if (maxLen <= 1) break;

    const [box1, box2] = splitBox(boxes[maxIdx]);
    boxes.splice(maxIdx, 1, box1, box2);
  }

  return boxes.map(getAverageColor);
}

function colorDistance(c1: [number, number, number], c2: [number, number, number]): number {
  const dr = c1[0] - c2[0];
  const dg = c1[1] - c2[1];
  const db = c1[2] - c2[2];
  return dr * dr + dg * dg + db * db;
}

function findClosestColor(
  color: [number, number, number],
  palette: [number, number, number][]
): number {
  let minDist = Infinity;
  let minIdx = 0;
  for (let i = 0; i < palette.length; i++) {
    const dist = colorDistance(color, palette[i]);
    if (dist < minDist) {
      minDist = dist;
      minIdx = i;
    }
  }
  return minIdx;
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

export async function importImage(
  file: File,
  options: ImageImportOptions
): Promise<ImageImportResult> {
  const { targetWidth, targetHeight, maxColors, rotation } = options;

  // Load image
  const img = await loadImage(file);

  // Create canvas for processing
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // Handle rotation
  let drawWidth = targetWidth;
  let drawHeight = targetHeight;
  if (rotation === 90 || rotation === 270) {
    drawWidth = targetHeight;
    drawHeight = targetWidth;
  }

  canvas.width = drawWidth;
  canvas.height = drawHeight;

  // Apply rotation
  ctx.save();
  if (rotation === 90) {
    ctx.translate(drawWidth, 0);
    ctx.rotate((90 * Math.PI) / 180);
  } else if (rotation === 180) {
    ctx.translate(drawWidth, drawHeight);
    ctx.rotate((180 * Math.PI) / 180);
  } else if (rotation === 270) {
    ctx.translate(0, drawHeight);
    ctx.rotate((270 * Math.PI) / 180);
  }

  // Draw image scaled to target size
  const srcWidth = rotation === 90 || rotation === 270 ? targetHeight : targetWidth;
  const srcHeight = rotation === 90 || rotation === 270 ? targetWidth : targetHeight;
  ctx.drawImage(img, 0, 0, srcWidth, srcHeight);
  ctx.restore();

  // Get pixel data
  const imageData = ctx.getImageData(0, 0, drawWidth, drawHeight);
  const pixels = imageData.data;

  // Collect all colors
  const colors: number[][] = [];
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];
    if (a > 128) {
      colors.push([r, g, b]);
    }
  }

  // Quantize colors
  const quantizedColors = medianCut(colors, maxColors);

  // Create palette
  const palette: PaletteEntry[] = quantizedColors.map((color, idx) => ({
    id: uuidv4(),
    color: rgbToHex(color[0], color[1], color[2]),
    name: `Color ${idx + 1}`,
    abbreviation: `C${idx + 1}`,
  }));

  // Map pixels to palette colors
  const cells: Cell[][] = [];
  let pixelIdx = 0;

  for (let row = 0; row < drawHeight; row++) {
    cells[row] = [];
    for (let col = 0; col < drawWidth; col++) {
      const r = pixels[pixelIdx];
      const g = pixels[pixelIdx + 1];
      const b = pixels[pixelIdx + 2];
      const a = pixels[pixelIdx + 3];
      pixelIdx += 4;

      if (a > 128 && quantizedColors.length > 0) {
        const colorIdx = findClosestColor([r, g, b], quantizedColors);
        cells[row][col] = { colorId: palette[colorIdx].id, symbolId: null };
      } else {
        cells[row][col] = { colorId: null, symbolId: null };
      }
    }
  }

  return {
    cells,
    palette,
    width: drawWidth,
    height: drawHeight,
  };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
