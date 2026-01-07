import QRCode from 'qrcode';
import type { Project } from '@/types';
import { compressProject } from './compression';
import { QR_MAX_BYTES } from './share';

export interface QRCodeResult {
  dataUrl: string | null;
  tooLarge: boolean;
  compressedSize: number;
  url: string | null;
}

export interface QRCodeOptions {
  width?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  margin?: number;
}

/**
 * Generate a QR code containing a shareable URL with compressed pattern data
 * Returns null dataUrl if the pattern is too large for QR encoding
 */
export async function generateProjectQRCode(
  project: Project,
  options: QRCodeOptions = {}
): Promise<QRCodeResult> {
  const compression = compressProject(project);
  const baseUrl = window.location.origin + window.location.pathname;
  const url = `${baseUrl}#share/${compression.compressed}`;

  // Check if data fits in QR code
  if (compression.compressedSize > QR_MAX_BYTES) {
    return {
      dataUrl: null,
      tooLarge: true,
      compressedSize: compression.compressedSize,
      url: null,
    };
  }

  try {
    const dataUrl = await QRCode.toDataURL(url, {
      width: options.width ?? 256,
      errorCorrectionLevel: options.errorCorrectionLevel ?? 'M',
      margin: options.margin ?? 2,
    });

    return {
      dataUrl,
      tooLarge: false,
      compressedSize: compression.compressedSize,
      url,
    };
  } catch {
    return {
      dataUrl: null,
      tooLarge: true,
      compressedSize: compression.compressedSize,
      url: null,
    };
  }
}

/**
 * Quick check if a project can fit in a QR code
 */
export function canGenerateQRCode(project: Project): boolean {
  const compression = compressProject(project);
  return compression.compressedSize <= QR_MAX_BYTES;
}
