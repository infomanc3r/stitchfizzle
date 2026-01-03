import { useState } from 'react';
import { CROCHET_SYMBOLS, getCategories, CATEGORY_LABELS } from '@/symbols/crochet';
import type { SymbolDefinition } from '@/types';

interface SymbolPickerProps {
  selectedSymbolId: string | null;
  onSelect: (symbol: SymbolDefinition) => void;
}

export function SymbolPicker({ selectedSymbolId, onSelect }: SymbolPickerProps) {
  const [activeCategory, setActiveCategory] = useState<string>('basic');
  const categories = getCategories();

  const filteredSymbols = CROCHET_SYMBOLS.filter(
    (s) => s.category === activeCategory
  );

  return (
    <div className="flex flex-col h-full">
      {/* Category tabs */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 dark:border-gray-700">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              activeCategory === category
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {CATEGORY_LABELS[category] || category}
          </button>
        ))}
      </div>

      {/* Symbol grid */}
      <div className="flex-1 overflow-auto p-2">
        <div className="grid grid-cols-4 gap-2">
          {filteredSymbols.map((symbol) => (
            <button
              key={symbol.id}
              onClick={() => onSelect(symbol)}
              title={`${symbol.name} (${symbol.abbreviation})`}
              className={`aspect-square p-2 rounded-lg border-2 transition-colors ${
                selectedSymbolId === symbol.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className="w-full h-full text-gray-800 dark:text-gray-200"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={symbol.svgPath} />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* Selected symbol info */}
      {selectedSymbolId && (
        <div className="p-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Selected:{' '}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {CROCHET_SYMBOLS.find((s) => s.id === selectedSymbolId)?.name}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
