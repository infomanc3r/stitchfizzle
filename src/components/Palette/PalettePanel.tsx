import { useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { ColorPicker } from './ColorPicker';
import type { PaletteEntry } from '@/types';

export function PalettePanel() {
  const project = useProjectStore((state) => state.project);
  const activeColorId = useProjectStore((state) => state.activeColorId);
  const addColor = useProjectStore((state) => state.addColor);
  const updateColor = useProjectStore((state) => state.updateColor);
  const removeColor = useProjectStore((state) => state.removeColor);
  const setActiveColor = useProjectStore((state) => state.setActiveColor);

  const [editingColorId, setEditingColorId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string | null>(null);

  if (!project) return null;

  const handleAddColor = () => {
    // Generate a random color
    const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
    const newEntry = addColor(randomColor);
    setActiveColor(newEntry.id);
    setEditingColorId(newEntry.id);
  };

  const handleColorChange = (id: string, color: string) => {
    updateColor(id, { color });
  };

  const handleNameChange = (id: string, name: string) => {
    updateColor(id, { name });
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (project.palette.length <= 1) {
      return; // Don't delete the last color
    }
    removeColor(id);
  };

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-800 dark:text-white">Colors</h3>
        <button
          onClick={handleAddColor}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Add color"
        >
          <svg
            className="w-5 h-5 text-gray-600 dark:text-gray-400"
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
        </button>
      </div>

      {/* Color list */}
      <div className="flex-1 overflow-auto space-y-1">
        {project.palette.map((entry) => (
          <PaletteEntryItem
            key={entry.id}
            entry={entry}
            isActive={activeColorId === entry.id}
            isEditing={editingColorId === entry.id}
            isEditingName={editingName === entry.id}
            canDelete={project.palette.length > 1}
            onClick={() => setActiveColor(entry.id)}
            onDoubleClick={() => setEditingColorId(entry.id)}
            onNameDoubleClick={() => setEditingName(entry.id)}
            onColorChange={(color) => handleColorChange(entry.id, color)}
            onNameChange={(name) => handleNameChange(entry.id, name)}
            onNameBlur={() => setEditingName(null)}
            onColorPickerClose={() => setEditingColorId(null)}
            onDelete={(e) => handleDelete(entry.id, e)}
          />
        ))}
      </div>

      {/* Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {project.palette.length} color{project.palette.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}

interface PaletteEntryItemProps {
  entry: PaletteEntry;
  isActive: boolean;
  isEditing: boolean;
  isEditingName: boolean;
  canDelete: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
  onNameDoubleClick: () => void;
  onColorChange: (color: string) => void;
  onNameChange: (name: string) => void;
  onNameBlur: () => void;
  onColorPickerClose: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

function PaletteEntryItem({
  entry,
  isActive,
  isEditing,
  isEditingName,
  canDelete,
  onClick,
  onDoubleClick,
  onNameDoubleClick,
  onColorChange,
  onNameChange,
  onNameBlur,
  onColorPickerClose,
  onDelete,
}: PaletteEntryItemProps) {
  return (
    <div className="relative">
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group ${
          isActive
            ? 'bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500'
            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
      >
        {/* Color swatch */}
        <div
          className="w-8 h-8 rounded border border-gray-200 dark:border-gray-600 shrink-0 cursor-pointer"
          style={{ backgroundColor: entry.color }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            onDoubleClick();
          }}
          title="Double-click to edit color"
        />

        {/* Name and color code */}
        <div className="flex-1 text-left min-w-0">
          {isEditingName ? (
            <input
              type="text"
              value={entry.name}
              onChange={(e) => onNameChange(e.target.value)}
              onBlur={onNameBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onNameBlur();
              }}
              className="w-full px-1 py-0.5 text-sm font-medium bg-white dark:bg-gray-700 border border-blue-500 rounded focus:outline-none"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div
              className="text-sm font-medium text-gray-800 dark:text-white truncate cursor-text"
              onDoubleClick={(e) => {
                e.stopPropagation();
                onNameDoubleClick();
              }}
              title="Double-click to edit name"
            >
              {entry.name}
            </div>
          )}
          <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
            {entry.color.toUpperCase()}
          </div>
        </div>

        {/* Delete button */}
        {canDelete && (
          <button
            onClick={onDelete}
            className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Delete color"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </button>

      {/* Color picker popup */}
      {isEditing && (
        <ColorPicker
          color={entry.color}
          onChange={onColorChange}
          onClose={onColorPickerClose}
        />
      )}
    </div>
  );
}
