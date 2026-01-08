import QRCode from 'qrcode';
import type { Project } from '@/types';
import { compressProject } from './compression';

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

// QR code max characters for alphanumeric with error correction L is ~4296
// But URLs use mixed case so it's treated as binary, max ~2953 bytes
const QR_MAX_URL_LENGTH = 2500;

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

  // Check if full URL fits in QR code (not just compressed data)
  if (url.length > QR_MAX_URL_LENGTH) {
    return {
      dataUrl: null,
      tooLarge: true,
      compressedSize: compression.compressedSize,
      url: null,
    };
  }

  try {
    const dataUrl = await QRCode.toDataURL(url, {
      width: options.width ?? 300,
      errorCorrectionLevel: options.errorCorrectionLevel ?? 'L', // L for max capacity
      margin: options.margin ?? 2,
    });

    return {
      dataUrl,
      tooLarge: false,
      compressedSize: compression.compressedSize,
      url,
    };
  } catch (err) {
    console.error('QR code generation failed:', err);
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
  const baseUrl = window.location.origin + window.location.pathname;
  const url = `${baseUrl}#share/${compression.compressed}`;
  return url.length <= QR_MAX_URL_LENGTH;
}
