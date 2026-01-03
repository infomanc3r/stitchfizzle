import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, saveProject } from '@/services/db';
import type { Project, ChartType } from '@/types';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { deleteProject } from '@/services/db';
import { getCachedThumbnail } from '@/utils/thumbnail';
import { FolderTree } from './FolderTree';

const CHART_TYPE_LABELS: Record<ChartType, string> = {
  c2c: 'Corner to Corner (C2C)',
  colorwork: 'Colorwork',
  filet: 'Filet Crochet',
  mosaic: 'Overlay Mosaic',
  freeform: 'Freeform',
  tunisian: 'Tunisian',
};

const CHART_TYPE_COLORS: Record<ChartType, string> = {
  c2c: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  colorwork: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  filet: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  mosaic: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  freeform: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
  tunisian: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
};

export function ProjectList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [movingProjectId, setMovingProjectId] = useState<string | null>(null);
  const loadProject = useProjectStore((state) => state.loadProject);
  const setView = useUIStore((state) => state.setView);
  const openDialog = useUIStore((state) => state.openDialog);
  const addToast = useUIStore((state) => state.addToast);

  // Live query for folders
  const folders = useLiveQuery(() => db.folders.toArray(), []);

  // Live query for projects - filtered by search and folder
  const projects = useLiveQuery(async () => {
    let query = db.projects;

    // Get all projects first
    let results = await query.toArray();

    // Filter by folder (unless searching)
    if (!searchQuery && selectedFolderId !== null) {
      results = results.filter((p) => p.folderId === selectedFolderId);
    } else if (!searchQuery) {
      // Show root level projects (no folder) when "All Charts" is selected
      // Actually show all projects when "All Charts" is selected
    }

    // Filter by search
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      results = results.filter((p) => p.name.toLowerCase().includes(lowerQuery));
    }

    // Sort by updated date
    results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return results;
  }, [searchQuery, selectedFolderId]);

  const handleOpenProject = async (project: Project) => {
    const success = await loadProject(project.id);
    if (success) {
      setView('editor');
    } else {
      addToast('Failed to open project', 'error');
    }
  };

  const handleDeleteProject = async (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${project.name}"?`)) {
      await deleteProject(project.id);
      addToast('Project deleted', 'success');
    }
  };

  const handleMoveProject = async (project: Project, folderId: string | undefined) => {
    await saveProject({ ...project, folderId });
    setMovingProjectId(null);
    addToast(`Moved to ${folderId ? 'folder' : 'All Charts'}`, 'success');
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const currentFolder = folders?.find((f) => f.id === selectedFolderId);

  return (
    <div className="flex h-full">
      {/* Folder Sidebar */}
      <div className="w-56 bg-gray-50 dark:bg-gray-850 border-r border-gray-200 dark:border-gray-700 p-3 flex-shrink-0 overflow-auto">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-2">
          Folders
        </h3>
        <FolderTree
          selectedFolderId={selectedFolderId}
          onSelectFolder={setSelectedFolderId}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            {currentFolder ? currentFolder.name : 'All Charts'}
          </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openDialog('imageImport')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Import from image"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Image
          </button>
          <button
            onClick={() => openDialog('import')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Import JSON project"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Import
          </button>
          <button
            onClick={() => openDialog('newProject')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Chart
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search charts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Project grid */}
      {projects === undefined ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            No charts yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Create your first crochet chart to get started
          </p>
          <button
            onClick={() => openDialog('newProject')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Chart
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => handleOpenProject(project)}
              className="group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all"
            >
              {/* Preview area */}
              <ProjectThumbnail project={project} />

              {/* Info */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-800 dark:text-white truncate">
                    {project.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {project.settings.width} x {project.settings.height}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Move button */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMovingProjectId(movingProjectId === project.id ? null : project.id);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-500"
                      title="Move to folder"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </button>
                    {/* Move dropdown */}
                    {movingProjectId === project.id && (
                      <div
                        className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 min-w-40 z-50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleMoveProject(project, undefined)}
                          className={`w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                            !project.folderId ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-200'
                          }`}
                        >
                          All Charts (Root)
                        </button>
                        {folders?.map((folder) => (
                          <button
                            key={folder.id}
                            onClick={() => handleMoveProject(project, folder.id)}
                            className={`w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                              project.folderId === folder.id ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-200'
                            }`}
                          >
                            {folder.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleDeleteProject(project, e)}
                    className="p-1 text-gray-400 hover:text-red-500"
                    title="Delete"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Type badge and date */}
              <div className="flex items-center justify-between mt-3">
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    CHART_TYPE_COLORS[project.chartType]
                  }`}
                >
                  {CHART_TYPE_LABELS[project.chartType]}
                </span>
                <span className="text-xs text-gray-400">
                  {formatDate(project.updatedAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

// Thumbnail component for project cards
function ProjectThumbnail({ project }: { project: Project }) {
  const thumbnail = useMemo(() => getCachedThumbnail(project), [project]);

  return (
    <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
      {thumbnail ? (
        <img
          src={thumbnail}
          alt={project.name}
          className="w-full h-full object-contain"
          style={{ imageRendering: 'pixelated' }}
        />
      ) : (
        <svg
          className="w-12 h-12 text-gray-300 dark:text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
          />
        </svg>
      )}
    </div>
  );
}
