import { useState, useRef, useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useProjectStore } from '@/stores/projectStore';
import { importImage, type ImageImportOptions } from '@/services/importers/image';
import { v4 as uuidv4 } from 'uuid';
import { saveProject } from '@/services/db';
import type { ChartType } from '@/types';

export function ImageImportDialog() {
  const closeDialog = useUIStore((state) => state.closeDialog);
  const setView = useUIStore((state) => state.setView);
  const addToast = useUIStore((state) => state.addToast);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const [options, setOptions] = useState<ImageImportOptions>({
    targetWidth: 50,
    targetHeight: 50,
    maxColors: 10,
    rotation: 0,
  });

  const [projectName, setProjectName] = useState('Imported Chart');
  const [chartType, setChartType] = useState<ChartType>('colorwork');

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(URL.createObjectURL(selectedFile));

      // Auto-set name from filename
      const name = selectedFile.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      setProjectName(name || 'Imported Chart');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      setFile(droppedFile);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(URL.createObjectURL(droppedFile));

      const name = droppedFile.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      setProjectName(name || 'Imported Chart');
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    try {
      const result = await importImage(file, options);

      // Create new project with imported data
      const projectId = uuidv4();
      const now = new Date();

      const project = {
        id: projectId,
        name: projectName,
        chartType,
        createdAt: now,
        updatedAt: now,
        settings: {
          width: result.width,
          height: result.height,
          gaugeH: 1,
          gaugeV: 1,
          gridLines: {
            show: true,
            color: '#cccccc',
            thickness: 1,
            highlight5: true,
            highlight10: true,
            highlight5Color: '#999999',
            highlight10Color: '#666666',
          },
          showNumbers: true,
        },
        grid: { cells: result.cells },
        palette: result.palette,
      };

      await saveProject(project);

      const loaded = await useProjectStore.getState().loadProject(projectId);
      if (loaded) {
        closeDialog();
        setView('editor');
        addToast('Image imported successfully', 'success');
      }
    } catch (error) {
      console.error('Import failed:', error);
      addToast('Failed to import image', 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[600px] max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Import Image
          </h2>

          {/* File drop zone */}
          {!file && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
            >
              <div className="text-4xl mb-3">🖼️</div>
              <p className="text-gray-600 dark:text-gray-300 mb-1">
                Drag & drop an image here
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                JPG, PNG, GIF supported
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* Preview and options */}
          {file && (
            <div className="space-y-4">
              {/* Preview */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Original Image
                  </label>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-2 flex items-center justify-center h-40">
                    {previewUrl && (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-h-full max-w-full object-contain"
                        style={{ transform: `rotate(${options.rotation}deg)` }}
                      />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Output Preview
                  </label>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-2 flex items-center justify-center h-40">
                    <canvas
                      ref={previewCanvasRef}
                      className="max-h-full max-w-full"
                      style={{ imageRendering: 'pixelated' }}
                    />
                    <div className="text-sm text-gray-500">
                      {options.targetWidth} x {options.targetHeight} cells
                    </div>
                  </div>
                </div>
              </div>

              {/* Project settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Chart Type
                  </label>
                  <select
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value as ChartType)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="colorwork">Colorwork</option>
                    <option value="c2c">Corner to Corner (C2C)</option>
                    <option value="filet">Filet Crochet</option>
                    <option value="mosaic">Overlay Mosaic</option>
                    <option value="tunisian">Tunisian</option>
                  </select>
                </div>
              </div>

              {/* Size settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Width (cells)
                  </label>
                  <input
                    type="number"
                    value={options.targetWidth}
                    onChange={(e) =>
                      setOptions({ ...options, targetWidth: Math.max(1, Math.min(500, Number(e.target.value))) })
                    }
                    min={1}
                    max={500}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Height (cells)
                  </label>
                  <input
                    type="number"
                    value={options.targetHeight}
                    onChange={(e) =>
                      setOptions({ ...options, targetHeight: Math.max(1, Math.min(500, Number(e.target.value))) })
                    }
                    min={1}
                    max={500}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Color and rotation settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Colors: {options.maxColors}
                  </label>
                  <input
                    type="range"
                    value={options.maxColors}
                    onChange={(e) => setOptions({ ...options, maxColors: Number(e.target.value) })}
                    min={2}
                    max={50}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Rotation
                  </label>
                  <div className="flex gap-2">
                    {([0, 90, 180, 270] as const).map((deg) => (
                      <button
                        key={deg}
                        onClick={() => setOptions({ ...options, rotation: deg })}
                        className={`flex-1 py-2 text-sm rounded-lg transition-colors ${
                          options.rotation === deg
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {deg}°
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Change file button */}
              <button
                onClick={() => {
                  setFile(null);
                  if (previewUrl) {
                    URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(null);
                  }
                }}
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                Choose different image
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={closeDialog}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!file || importing}
              className="flex-1 px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {importing ? 'Importing...' : 'Import'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
