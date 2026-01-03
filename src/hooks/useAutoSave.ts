import { useEffect, useRef } from 'react';
import { useProjectStore } from '@/stores/projectStore';

const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

export function useAutoSave() {
  const project = useProjectStore((state) => state.project);
  const isDirty = useProjectStore((state) => state.isDirty);
  const saveCurrentProject = useProjectStore((state) => state.saveCurrentProject);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only auto-save if there's a project and it's dirty
    if (!project || !isDirty) {
      return;
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set a new timeout
    timeoutRef.current = setTimeout(() => {
      saveCurrentProject();
      console.log('Auto-saved project:', project.name);
    }, AUTO_SAVE_INTERVAL);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [project, isDirty, saveCurrentProject]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (project && isDirty) {
        saveCurrentProject();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [project, isDirty, saveCurrentProject]);
}
