import { useState, useRef, useEffect } from 'react';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  onClose: () => void;
}

const PRESET_COLORS = [
  // Row 1 - Reds
  '#FF0000', '#FF4444', '#FF6666', '#FF8888', '#FFAAAA', '#FFCCCC',
  // Row 2 - Oranges
  '#FF6600', '#FF8833', '#FFAA66', '#FFCC99', '#FFDDBB', '#FFEEDD',
  // Row 3 - Yellows
  '#FFFF00', '#FFFF44', '#FFFF88', '#FFFFAA', '#FFFFCC', '#FFFFEE',
  // Row 4 - Greens
  '#00FF00', '#44FF44', '#66FF66', '#88FF88', '#AAFFAA', '#CCFFCC',
  // Row 5 - Cyans
  '#00FFFF', '#44FFFF', '#66FFFF', '#88FFFF', '#AAFFFF', '#CCFFFF',
  // Row 6 - Blues
  '#0000FF', '#4444FF', '#6666FF', '#8888FF', '#AAAAFF', '#CCCCFF',
  // Row 7 - Purples
  '#8800FF', '#9944FF', '#AA66FF', '#BB88FF', '#CCAAFF', '#DDCCFF',
  // Row 8 - Pinks
  '#FF00FF', '#FF44FF', '#FF66FF', '#FF88FF', '#FFAAFF', '#FFCCFF',
  // Row 9 - Browns
  '#8B4513', '#A0522D', '#CD853F', '#DEB887', '#F5DEB3', '#FAEBD7',
  // Row 10 - Grays
  '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
];

export function ColorPicker({ color, onChange, onClose }: ColorPickerProps) {
  const [currentColor, setCurrentColor] = useState(color);
  const [hexInput, setHexInput] = useState(color);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handlePresetClick = (presetColor: string) => {
    setCurrentColor(presetColor);
    setHexInput(presetColor);
    onChange(presetColor);
  };

  const handleHexChange = (value: string) => {
    setHexInput(value);
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      setCurrentColor(value);
      onChange(value);
    }
  };

  const handleNativeColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCurrentColor(value);
    setHexInput(value);
    onChange(value);
  };

  return (
    <div
      ref={containerRef}
      className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50 w-72"
    >
      {/* Current color preview */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-lg border-2 border-gray-200 dark:border-gray-600"
          style={{ backgroundColor: currentColor }}
        />
        <div className="flex-1">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            Hex Color
          </label>
          <input
            type="text"
            value={hexInput}
            onChange={(e) => handleHexChange(e.target.value.toUpperCase())}
            className="w-full px-2 py-1 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded font-mono"
            placeholder="#000000"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            Pick
          </label>
          <input
            type="color"
            value={currentColor}
            onChange={handleNativeColorChange}
            className="w-8 h-8 rounded cursor-pointer"
          />
        </div>
      </div>

      {/* Preset colors grid */}
      <div className="grid grid-cols-6 gap-1">
        {PRESET_COLORS.map((presetColor) => (
          <button
            key={presetColor}
            onClick={() => handlePresetClick(presetColor)}
            className={`w-8 h-8 rounded border-2 transition-transform hover:scale-110 ${
              currentColor.toUpperCase() === presetColor
                ? 'border-blue-500 ring-2 ring-blue-300'
                : 'border-gray-200 dark:border-gray-600'
            }`}
            style={{ backgroundColor: presetColor }}
            title={presetColor}
          />
        ))}
      </div>

      {/* Close button */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          Done
        </button>
      </div>
    </div>
  );
}
