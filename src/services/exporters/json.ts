import type { Project } from '@/types';

export interface ExportFile {
  version: string;
  app: 'stitchfizzle';
  exportedAt: string;
  project: Project;
}

export function exportProjectToJSON(project: Project): string {
  const exportFile: ExportFile = {
    version: '1.0.0',
    app: 'stitchfizzle',
    exportedAt: new Date().toISOString(),
    project,
  };

  return JSON.stringify(exportFile, null, 2);
}

export function downloadJSON(project: Project): void {
  const json = exportProjectToJSON(project);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name.replace(/[^a-zA-Z0-9-_]/g, '_')}.stitchfizzle.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseImportedJSON(content: string): Project | null {
  try {
    const parsed = JSON.parse(content);

    // Check if it's a StitchFizzle export file
    if (parsed.app === 'stitchfizzle' && parsed.project) {
      const project = parsed.project as Project;
      // Ensure dates are Date objects
      project.createdAt = new Date(project.createdAt);
      project.updatedAt = new Date(project.updatedAt);
      return project;
    }

    // Try to parse as a raw project
    if (parsed.id && parsed.name && parsed.chartType) {
      const project = parsed as Project;
      project.createdAt = new Date(project.createdAt);
      project.updatedAt = new Date(project.updatedAt);
      return project;
    }

    return null;
  } catch {
    return null;
  }
}
