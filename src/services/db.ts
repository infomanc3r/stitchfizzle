import Dexie, { type EntityTable } from 'dexie';
import type { Project, Folder, AppSettings } from '@/types';

// Database schema
export class StitchFizzleDB extends Dexie {
  projects!: EntityTable<Project, 'id'>;
  folders!: EntityTable<Folder, 'id'>;
  settings!: EntityTable<AppSettings & { id: string }, 'id'>;

  constructor() {
    super('stitchfizzle');

    this.version(1).stores({
      projects: 'id, name, chartType, folderId, createdAt, updatedAt',
      folders: 'id, name, parentId, createdAt',
      settings: 'id',
    });
  }
}

export const db = new StitchFizzleDB();

// Project operations
export async function getAllProjects(): Promise<Project[]> {
  return db.projects.toArray();
}

export async function getProjectsByFolder(folderId?: string): Promise<Project[]> {
  if (folderId === undefined) {
    return db.projects.filter(p => p.folderId === undefined).toArray();
  }
  return db.projects.where('folderId').equals(folderId).toArray();
}

export async function getProject(id: string): Promise<Project | undefined> {
  return db.projects.get(id);
}

export async function saveProject(project: Project): Promise<string> {
  project.updatedAt = new Date();
  return db.projects.put(project);
}

export async function deleteProject(id: string): Promise<void> {
  return db.projects.delete(id);
}

export async function searchProjects(query: string): Promise<Project[]> {
  const lowerQuery = query.toLowerCase();
  return db.projects
    .filter(p => p.name.toLowerCase().includes(lowerQuery))
    .toArray();
}

// Folder operations
export async function getAllFolders(): Promise<Folder[]> {
  return db.folders.toArray();
}

export async function getFolder(id: string): Promise<Folder | undefined> {
  return db.folders.get(id);
}

export async function saveFolder(folder: Folder): Promise<string> {
  return db.folders.put(folder);
}

export async function deleteFolder(id: string): Promise<void> {
  // Move projects in this folder to root
  await db.projects
    .where('folderId')
    .equals(id)
    .modify({ folderId: undefined });

  // Delete child folders recursively
  const childFolders = await db.folders.where('parentId').equals(id).toArray();
  for (const child of childFolders) {
    await deleteFolder(child.id);
  }

  return db.folders.delete(id);
}

// Settings operations
const SETTINGS_ID = 'app-settings';

export async function getAppSettings(): Promise<AppSettings | undefined> {
  const settings = await db.settings.get(SETTINGS_ID);
  if (settings) {
    const { id: _id, ...rest } = settings;
    return rest as AppSettings;
  }
  return undefined;
}

export async function saveAppSettings(settings: AppSettings): Promise<void> {
  await db.settings.put({ ...settings, id: SETTINGS_ID });
}
