import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, saveFolder, deleteFolder } from '@/services/db';
import type { Folder } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface FolderTreeProps {
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
}

export function FolderTree({ selectedFolderId, onSelectFolder }: FolderTreeProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const folders = useLiveQuery(() => db.folders.toArray(), []);

  // Get root-level folders
  const rootFolders = folders?.filter((f) => !f.parentId) || [];

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    const folder: Folder = {
      id: uuidv4(),
      name: newFolderName.trim(),
      parentId: selectedFolderId || undefined,
      createdAt: new Date(),
    };

    await saveFolder(folder);
    setNewFolderName('');
    setIsCreating(false);
  };

  const handleRenameFolder = async (folderId: string) => {
    if (!editingName.trim()) {
      setEditingFolderId(null);
      return;
    }

    const folder = folders?.find((f) => f.id === folderId);
    if (folder) {
      await saveFolder({ ...folder, name: editingName.trim() });
    }
    setEditingFolderId(null);
  };

  const handleDeleteFolder = async (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this folder? Projects will be moved to root.')) {
      await deleteFolder(folderId);
      if (selectedFolderId === folderId) {
        onSelectFolder(null);
      }
    }
  };

  const getChildFolders = (parentId: string): Folder[] => {
    return folders?.filter((f) => f.parentId === parentId) || [];
  };

  const renderFolder = (folder: Folder, depth: number = 0): React.ReactNode => {
    const isSelected = selectedFolderId === folder.id;
    const isEditing = editingFolderId === folder.id;
    const children = getChildFolders(folder.id);

    return (
      <div key={folder.id}>
        <div
          onClick={() => onSelectFolder(folder.id)}
          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer group ${
            isSelected
              ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
        >
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>

          {isEditing ? (
            <input
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={() => handleRenameFolder(folder.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameFolder(folder.id);
                if (e.key === 'Escape') setEditingFolderId(null);
              }}
              className="flex-1 px-1 py-0.5 text-sm bg-white dark:bg-gray-700 border border-blue-500 rounded focus:outline-none"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className="flex-1 text-sm truncate"
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditingFolderId(folder.id);
                setEditingName(folder.name);
              }}
            >
              {folder.name}
            </span>
          )}

          <button
            onClick={(e) => handleDeleteFolder(folder.id, e)}
            className="p-0.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Delete folder"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Child folders */}
        {children.map((child) => renderFolder(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="py-2">
      {/* All Charts (root) */}
      <div
        onClick={() => onSelectFolder(null)}
        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer ${
          selectedFolderId === null
            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
        <span className="text-sm font-medium">All Charts</span>
      </div>

      {/* Folder list */}
      <div className="mt-1">
        {rootFolders.map((folder) => renderFolder(folder))}
      </div>

      {/* Create folder */}
      {isCreating ? (
        <div className="flex items-center gap-2 px-2 py-1.5 mt-1">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onBlur={() => {
              if (newFolderName.trim()) handleCreateFolder();
              else setIsCreating(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFolder();
              if (e.key === 'Escape') setIsCreating(false);
            }}
            placeholder="Folder name"
            className="flex-1 px-1 py-0.5 text-sm bg-white dark:bg-gray-700 border border-blue-500 rounded focus:outline-none"
            autoFocus
          />
        </div>
      ) : (
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-2 py-1.5 mt-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors w-full"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm">New Folder</span>
        </button>
      )}
    </div>
  );
}
