import type { SymbolDefinition } from '@/types';

// Standard crochet symbol definitions
// SVG paths are designed for a 24x24 viewBox

export const CROCHET_SYMBOLS: SymbolDefinition[] = [
  // Basic stitches
  {
    id: 'chain',
    name: 'Chain',
    abbreviation: 'ch',
    category: 'basic',
    svgPath: 'M12 6 C8 6 6 9 6 12 C6 15 8 18 12 18 C16 18 18 15 18 12 C18 9 16 6 12 6 Z',
  },
  {
    id: 'slip-stitch',
    name: 'Slip Stitch',
    abbreviation: 'sl st',
    category: 'basic',
    svgPath: 'M12 8 L12 16 M8 12 L16 12',
  },
  {
    id: 'single-crochet',
    name: 'Single Crochet',
    abbreviation: 'sc',
    category: 'basic',
    svgPath: 'M12 4 L12 20 M8 8 L16 8',
  },
  {
    id: 'half-double',
    name: 'Half Double Crochet',
    abbreviation: 'hdc',
    category: 'basic',
    svgPath: 'M12 4 L12 20 M8 6 L16 6 M10 10 L14 10',
  },
  {
    id: 'double-crochet',
    name: 'Double Crochet',
    abbreviation: 'dc',
    category: 'basic',
    svgPath: 'M12 4 L12 20 M8 5 L16 5 M8 9 L16 9',
  },
  {
    id: 'treble-crochet',
    name: 'Treble Crochet',
    abbreviation: 'tr',
    category: 'basic',
    svgPath: 'M12 4 L12 20 M8 5 L16 5 M8 8 L16 8 M8 11 L16 11',
  },
  {
    id: 'double-treble',
    name: 'Double Treble',
    abbreviation: 'dtr',
    category: 'basic',
    svgPath: 'M12 4 L12 20 M8 5 L16 5 M8 7 L16 7 M8 9 L16 9 M8 11 L16 11',
  },

  // Special stitches
  {
    id: 'bobble',
    name: 'Bobble',
    abbreviation: 'bob',
    category: 'textured',
    svgPath: 'M12 6 C6 6 6 18 12 18 C18 18 18 6 12 6 Z M12 4 L12 6 M12 18 L12 20',
  },
  {
    id: 'popcorn',
    name: 'Popcorn',
    abbreviation: 'pc',
    category: 'textured',
    svgPath: 'M12 6 C6 6 6 18 12 18 C18 18 18 6 12 6 Z M12 4 L12 20',
  },
  {
    id: 'puff',
    name: 'Puff Stitch',
    abbreviation: 'puff',
    category: 'textured',
    svgPath: 'M8 8 Q12 4 16 8 Q20 12 16 16 Q12 20 8 16 Q4 12 8 8 Z',
  },
  {
    id: 'cluster',
    name: 'Cluster',
    abbreviation: 'cl',
    category: 'textured',
    svgPath: 'M8 20 L12 4 L16 20 M6 16 L18 16',
  },

  // Decreases
  {
    id: 'sc2tog',
    name: 'SC 2 Together',
    abbreviation: 'sc2tog',
    category: 'decrease',
    svgPath: 'M8 20 L12 4 L16 20 M6 8 L18 8',
  },
  {
    id: 'dc2tog',
    name: 'DC 2 Together',
    abbreviation: 'dc2tog',
    category: 'decrease',
    svgPath: 'M8 20 L12 4 L16 20 M6 6 L18 6 M6 10 L18 10',
  },

  // Increases
  {
    id: 'inc',
    name: 'Increase',
    abbreviation: 'inc',
    category: 'increase',
    svgPath: 'M12 4 L12 20 M6 12 L18 12 M6 8 L18 8',
  },

  // Filet-specific
  {
    id: 'filet-open',
    name: 'Open Square (Filet)',
    abbreviation: 'o',
    category: 'filet',
    svgPath: 'M4 4 L20 4 L20 20 L4 20 Z',
  },
  {
    id: 'filet-filled',
    name: 'Filled Square (Filet)',
    abbreviation: 'x',
    category: 'filet',
    svgPath: 'M4 4 L20 4 L20 20 L4 20 Z M4 4 L20 20 M20 4 L4 20',
  },

  // Mosaic-specific
  {
    id: 'mosaic-x',
    name: 'Overlay Stitch (Mosaic)',
    abbreviation: 'X',
    category: 'mosaic',
    svgPath: 'M6 6 L18 18 M18 6 L6 18',
  },
  {
    id: 'mosaic-dc',
    name: 'DC Overlay (Mosaic)',
    abbreviation: 'DC',
    category: 'mosaic',
    svgPath: 'M12 4 L12 20 M6 6 L18 18 M18 6 L6 18',
  },

  // Tunisian-specific
  {
    id: 'tss',
    name: 'Tunisian Simple Stitch',
    abbreviation: 'Tss',
    category: 'tunisian',
    svgPath: 'M12 4 L12 20',
  },
  {
    id: 'tks',
    name: 'Tunisian Knit Stitch',
    abbreviation: 'Tks',
    category: 'tunisian',
    svgPath: 'M8 4 L8 20 M16 4 L16 20 M8 12 L16 12',
  },
  {
    id: 'tps',
    name: 'Tunisian Purl Stitch',
    abbreviation: 'Tps',
    category: 'tunisian',
    svgPath: 'M12 4 L12 20 M8 10 C8 14 16 14 16 10',
  },
];

// Get symbol by ID
export function getSymbol(id: string): SymbolDefinition | undefined {
  return CROCHET_SYMBOLS.find((s) => s.id === id);
}

// Get symbols by category
export function getSymbolsByCategory(category: string): SymbolDefinition[] {
  return CROCHET_SYMBOLS.filter((s) => s.category === category);
}

// Get all categories
export function getCategories(): string[] {
  return [...new Set(CROCHET_SYMBOLS.map((s) => s.category))];
}

// Category labels
export const CATEGORY_LABELS: Record<string, string> = {
  basic: 'Basic Stitches',
  textured: 'Textured Stitches',
  decrease: 'Decreases',
  increase: 'Increases',
  filet: 'Filet Crochet',
  mosaic: 'Mosaic Crochet',
  tunisian: 'Tunisian Crochet',
};
