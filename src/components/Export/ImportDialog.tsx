import { useState, useRef } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useProjectStore } from '@/stores/projectStore';
import { parseImportedJSON } from '@/services/exporters';
import { saveProject } from '@/services/db';
import { v4 as uuidv4 } from 'uuid';

export function ImportDialog() {
  const closeDialog = useUIStore((state) => state.closeDialog);
  const setView = useUIStore((state) => state.setView);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleFile = async (file: File) => {
    setError(null);
    setImporting(true);

    try {
      const content = await file.text();
      const project = parseImportedJSON(content);

      if (!project) {
        setError('Invalid file format. Please select a valid StitchFizzle JSON file.');
        setImporting(false);
        return;
      }

      // Generate new ID to avoid conflicts
      project.id = uuidv4();
      project.name = `${project.name} (imported)`;
      project.updatedAt = new Date();

      // Save to database
      await saveProject(project);

      // Load the imported project
      const loaded = await useProjectStore.getState().loadProject(project.id);

      if (loaded) {
        closeDialog();
        setView('editor');
      } else {
        setError('Failed to load the imported project.');
      }
    } catch (err) {
      console.error('Import failed:', err);
      setError('Failed to import file. Please check the file format.');
    } finally {
      setImporting(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.json')) {
      handleFile(file);
    } else {
      setError('Please drop a JSON file.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-[420px]">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Import Project
        </h2>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
          }`}
        >
          <div className="text-4xl mb-3">📁</div>
          <p className="text-gray-600 dark:text-gray-300 mb-1">
            Drag & drop a JSON file here
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            or click to browse
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Importing indicator */}
        {importing && (
          <div className="mt-4 text-center text-gray-600 dark:text-gray-300">
            Importing...
          </div>
        )}

        {/* Info */}
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Supported formats: StitchFizzle JSON (.json)
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={closeDialog}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
