import type { Project } from '@/types';
import { exportProjectToJSON } from '@/services/exporters/json';
import { compressProject } from './compression';

// Size thresholds
export const URL_MAX_LENGTH = 2000; // Safe for all browsers
export const QR_MAX_BYTES = 2500; // QR practical limit with error correction

export interface ShareCapabilities {
  webShare: boolean;
  webShareFiles: boolean;
  clipboard: boolean;
}

/**
 * Detect what sharing capabilities are available in this browser
 */
export function getShareCapabilities(): ShareCapabilities {
  return {
    webShare: 'share' in navigator,
    webShareFiles: 'share' in navigator && 'canShare' in navigator,
    clipboard: 'clipboard' in navigator,
  };
}

export interface ShareResult {
  success: boolean;
  method: 'webshare' | 'clipboard' | 'download';
  error?: string;
}

/**
 * Share project via Web Share API (native share sheet)
 * Works on iOS Safari, Android Chrome, some desktop browsers
 */
export async function shareViaWebShare(project: Project): Promise<ShareResult> {
  const json = exportProjectToJSON(project);
  const blob = new Blob([json], { type: 'application/json' });
  const file = new File(
    [blob],
    `${project.name.replace(/[^a-zA-Z0-9-_]/g, '_')}.stitchfizzle.json`,
    { type: 'application/json' }
  );

  const shareData: ShareData = {
    title: `${project.name} - StitchFizzle Pattern`,
    text: `Check out my crochet pattern "${project.name}" created with StitchFizzle!`,
    files: [file],
  };

  try {
    // Try sharing with file first
    if (navigator.canShare?.(shareData)) {
      await navigator.share(shareData);
      return { success: true, method: 'webshare' };
    }

    // Fallback: share URL only (without file)
    const urlResult = generateShareURL(project);
    if (urlResult.url) {
      await navigator.share({
        title: shareData.title,
        text: shareData.text,
        url: urlResult.url,
      });
      return { success: true, method: 'webshare' };
    }

    return { success: false, method: 'webshare', error: 'Sharing not supported' };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { success: false, method: 'webshare', error: 'Share cancelled' };
    }
    return { success: false, method: 'webshare', error: String(err) };
  }
}

export interface URLShareResult {
  url: string | null;
  tooLarge: boolean;
  compressedSize: number;
}

/**
 * Generate a shareable URL with pattern data encoded in the fragment
 * The data never touches a server - it's all in the URL hash
 */
export function generateShareURL(project: Project): URLShareResult {
  const compression = compressProject(project);
  const baseUrl = window.location.origin + window.location.pathname;
  const url = `${baseUrl}#share/${compression.compressed}`;

  if (url.length > URL_MAX_LENGTH) {
    return {
      url: null,
      tooLarge: true,
      compressedSize: compression.compressedSize,
    };
  }

  return {
    url,
    tooLarge: false,
    compressedSize: compression.compressedSize,
  };
}

/**
 * Copy shareable URL to clipboard
 */
export async function copyURLToClipboard(project: Project): Promise<ShareResult> {
  const urlResult = generateShareURL(project);

  if (urlResult.tooLarge) {
    return {
      success: false,
      method: 'clipboard',
      error: 'Pattern too large for URL sharing',
    };
  }

  try {
    await navigator.clipboard.writeText(urlResult.url!);
    return { success: true, method: 'clipboard' };
  } catch {
    return { success: false, method: 'clipboard', error: 'Clipboard access denied' };
  }
}
