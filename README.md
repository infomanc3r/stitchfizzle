# StitchFizzle

A free, open-source crochet chart creator. Design C2C, colorwork, filet, mosaic, freeform, and Tunisian crochet patterns locally with no account required.

## Features

- **6 Chart Types**: Corner-to-Corner (C2C), Colorwork, Filet, Overlay Mosaic, Freeform, and Tunisian
- **Grid Editor**: Click and drag to draw, selection tools, copy/paste, mirroring
- **Color Palette**: Add unlimited colors, create custom palettes
- **Layer System**: Organize freeform designs with layers
- **Export Options**: PNG, SVG, PDF, Excel, and JSON
- **Image Import**: Convert pictures to charts with color quantization
- **Progress Tracker**: Track your progress while crocheting
- **Written Instructions**: Auto-generate row-by-row text patterns
- **Dark Mode**: Easy on the eyes
- **100% Local**: All data stored in your browser, no account needed

## Getting Started

### Prerequisites

- Node.js 18+ (recommended: 20+)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/stitchfizzle.git
cd stitchfizzle

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Tech Stack

- **React 19** + TypeScript
- **Vite** for development and building
- **Tailwind CSS** for styling
- **Fabric.js** for canvas rendering
- **Dexie** (IndexedDB) for local storage
- **Zustand** for state management
- **Tauri** (optional) for desktop builds

## Project Structure

```
src/
├── components/       # React components
│   ├── Layout/      # Header, Sidebar, MainLayout
│   ├── Editor/      # Canvas and editing tools
│   ├── FileManager/ # Project list and dialogs
│   └── Palette/     # Color/symbol management
├── stores/          # Zustand state stores
├── services/        # Database and export services
├── types/           # TypeScript interfaces
├── hooks/           # Custom React hooks
└── utils/           # Utility functions
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this for any purpose.

## Acknowledgments

Inspired by [Stitch Fiddle](https://www.stitchfiddle.com/), a great online chart maker. StitchFizzle is an independent, open-source alternative for users who prefer local-first software.
