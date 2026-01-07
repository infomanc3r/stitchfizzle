import { useEffect, useState } from 'react';
import { decompressProject } from '@/services/sharing/compression';
import type { Project } from '@/types';

export interface URLImportState {
  pendingProject: Project | null;
  error: string | null;
  clearPending: () => void;
}

/**
 * Hook to detect and handle shared patterns in the URL hash
 * Watches for URLs like: https://example.com/#share/COMPRESSED_DATA
 */
export function useURLImport(): URLImportState {
  const [pendingProject, setPendingProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;

      if (hash.startsWith('#share/')) {
        const compressed = hash.slice(7); // Remove '#share/'

        try {
          const project = decompressProject(compressed);

          if (project) {
            setPendingProject(project);
            setError(null);
            // Clear hash to prevent re-import on refresh
            history.replaceState(null, '', window.location.pathname);
          } else {
            setError('Invalid or corrupted share link');
          }
        } catch {
          setError('Failed to decode share link');
        }
      }
    };

    // Check on mount
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const clearPending = () => {
    setPendingProject(null);
    setError(null);
  };

  return { pendingProject, error, clearPending };
}
