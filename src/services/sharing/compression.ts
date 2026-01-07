import LZString from 'lz-string';
import type { Project } from '@/types';

export interface CompressionResult {
  compressed: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

export interface ShareableData {
  v: string;  // version (shortened key to save space)
  p: Project; // project
}

/**
 * Compress a project for URL/QR sharing
 * Uses lz-string for efficient compression with URL-safe output
 */
export function compressProject(project: Project): CompressionResult {
  const data: ShareableData = {
    v: '1.0.0',
    p: project,
  };

  const json = JSON.stringify(data);
  const compressed = LZString.compressToEncodedURIComponent(json);

  return {
    compressed,
    originalSize: json.length,
    compressedSize: compressed.length,
    compressionRatio: compressed.length / json.length,
  };
}

/**
 * Decompress a shared project from URL/QR data
 * Returns null if data is invalid or corrupted
 */
export function decompressProject(compressed: string): Project | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(compressed);
    if (!json) return null;

    const data = JSON.parse(json) as ShareableData;

    // Validate structure
    if (!data.p || !data.p.id || !data.p.chartType) return null;

    // Restore Date objects (JSON serializes them as strings)
    const project = data.p;
    project.createdAt = new Date(project.createdAt);
    project.updatedAt = new Date(project.updatedAt);

    return project;
  } catch {
    return null;
  }
}

/**
 * Estimate the JSON size of a project in bytes
 */
export function estimateProjectSize(project: Project): number {
  return JSON.stringify(project).length;
}
