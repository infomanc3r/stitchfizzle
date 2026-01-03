import { useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import type { Layer } from '@/types';

export function LayerPanel() {
  const project = useProjectStore((state) => state.project);
  const addLayer = useProjectStore((state) => state.addLayer);
  const removeLayer = useProjectStore((state) => state.removeLayer);
  const updateLayer = useProjectStore((state) => state.updateLayer);
  const setActiveLayer = useProjectStore((state) => state.setActiveLayer);
  const reorderLayers = useProjectStore((state) => state.reorderLayers);

  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);

  if (!project?.freeform) return null;

  const { layers, activeLayerId } = project.freeform;

  const handleAddLayer = () => {
    const newLayer = addLayer();
    if (newLayer) {
      setActiveLayer(newLayer.id);
    }
  };

  const handleToggleVisibility = (layerId: string, visible: boolean) => {
    updateLayer(layerId, { visible: !visible });
  };

  const handleToggleLock = (layerId: string, locked: boolean) => {
    updateLayer(layerId, { locked: !locked });
  };

  const handleRename = (layerId: string, name: string) => {
    updateLayer(layerId, { name });
    setEditingLayerId(null);
  };

  const handleMoveLayer = (layerId: string, direction: 'up' | 'down') => {
    const currentIndex = layers.findIndex((l) => l.id === layerId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= layers.length) return;

    const newOrder = [...layers];
    [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];
    reorderLayers(newOrder.map((l) => l.id));
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-medium text-gray-800 dark:text-white text-sm">Layers</h3>
        <button
          onClick={handleAddLayer}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Add layer"
        >
          <svg
            className="w-4 h-4 text-gray-600 dark:text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Layer list */}
      <div className="flex-1 overflow-auto">
        {layers.map((layer, index) => (
          <LayerItem
            key={layer.id}
            layer={layer}
            isActive={layer.id === activeLayerId}
            isEditing={editingLayerId === layer.id}
            canDelete={layers.length > 1}
            canMoveUp={index > 0}
            canMoveDown={index < layers.length - 1}
            onClick={() => setActiveLayer(layer.id)}
            onDoubleClick={() => setEditingLayerId(layer.id)}
            onRename={(name) => handleRename(layer.id, name)}
            onToggleVisibility={() => handleToggleVisibility(layer.id, layer.visible)}
            onToggleLock={() => handleToggleLock(layer.id, layer.locked)}
            onMoveUp={() => handleMoveLayer(layer.id, 'up')}
            onMoveDown={() => handleMoveLayer(layer.id, 'down')}
            onDelete={() => removeLayer(layer.id)}
          />
        ))}
      </div>

      {/* Stats */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {layers.length} layer{layers.length !== 1 ? 's' : ''} |{' '}
          {layers.reduce((acc, l) => acc + l.symbols.length, 0)} symbols
        </p>
      </div>
    </div>
  );
}

interface LayerItemProps {
  layer: Layer;
  isActive: boolean;
  isEditing: boolean;
  canDelete: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
  onRename: (name: string) => void;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}

function LayerItem({
  layer,
  isActive,
  isEditing,
  canDelete,
  canMoveUp,
  canMoveDown,
  onClick,
  onDoubleClick,
  onRename,
  onToggleVisibility,
  onToggleLock,
  onMoveUp,
  onMoveDown,
  onDelete,
}: LayerItemProps) {
  const [editName, setEditName] = useState(layer.name);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onRename(editName);
    } else if (e.key === 'Escape') {
      setEditName(layer.name);
      onRename(layer.name);
    }
  };

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors group ${
        isActive
          ? 'bg-blue-50 dark:bg-blue-900/30'
          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
      }`}
    >
      {/* Visibility toggle */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleVisibility();
        }}
        className={`p-1 rounded transition-colors ${
          layer.visible
            ? 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            : 'text-gray-300 dark:text-gray-600'
        }`}
        title={layer.visible ? 'Hide layer' : 'Show layer'}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {layer.visible ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
            />
          )}
        </svg>
      </button>

      {/* Lock toggle */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleLock();
        }}
        className={`p-1 rounded transition-colors ${
          layer.locked
            ? 'text-yellow-500 dark:text-yellow-400'
            : 'text-gray-300 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400'
        }`}
        title={layer.locked ? 'Unlock layer' : 'Lock layer'}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {layer.locked ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
            />
          )}
        </svg>
      </button>

      {/* Layer name */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={() => onRename(editName)}
            onKeyDown={handleKeyDown}
            className="w-full px-1 py-0.5 text-sm bg-white dark:bg-gray-700 border border-blue-500 rounded focus:outline-none"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            onDoubleClick={(e) => {
              e.stopPropagation();
              onDoubleClick();
            }}
            className={`text-sm truncate block ${
              isActive
                ? 'text-blue-700 dark:text-blue-300 font-medium'
                : 'text-gray-700 dark:text-gray-300'
            } ${!layer.visible ? 'opacity-50' : ''}`}
          >
            {layer.name}
          </span>
        )}
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {layer.symbols.length} symbol{layer.symbols.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMoveUp();
          }}
          disabled={!canMoveUp}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
          title="Move up"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMoveDown();
          }}
          disabled={!canMoveDown}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
          title="Move down"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {canDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 text-gray-400 hover:text-red-500"
            title="Delete layer"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
