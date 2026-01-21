# StitchFizzle

A free, open-source crochet chart creator. Design C2C, colorwork, filet, mosaic, freeform, and Tunisian crochet patterns locally with no account required.

> **Note:** [www.stitchfizzle.com](https://www.stitchfizzle.com) is for **demo and testing purposes only**. It's hosted on GitHub Pages and not intended to handle regular traffic. Please download and use the app locally to avoid unnecessary bandwidth usage. Thank you for understanding!

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
- **100% Local**: All data stored locally, no account needed

## Getting Started

### Download (Recommended)

The easiest way to use StitchFizzle is to download the pre-built desktop app for your platform:

**[Download Latest Release](https://github.com/infomanc3r/stitchfizzle/releases/latest)**

| Platform | Download |
|----------|----------|
| Windows  | `.exe` or `.msi` installer |
| macOS    | `.dmg` installer |
| Linux    | `.deb`, `.rpm`, or `.AppImage` |

### Build Desktop App (Tauri)

If you prefer to build from source, StitchFizzle runs as a native desktop application using Tauri.

#### Prerequisites

- Node.js 18+ (recommended: 20+)
- npm or yarn
- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- Platform-specific dependencies:
  - **Windows**: Microsoft Visual Studio C++ Build Tools
  - **macOS**: Xcode Command Line Tools
  - **Linux**: `sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev`

#### Development

```bash
# Clone the repository
git clone https://github.com/infomanc3r/stitchfizzle.git
cd stitchfizzle

# Install dependencies
npm install

# Launch desktop app with hot-reload
npm run tauri dev
```

#### Building Installers

```bash
npm run tauri build
```

This creates platform-specific installers in `src-tauri/target/release/bundle/`:

| Platform | Output |
|----------|--------|
| Windows  | `.exe` (standalone), `.msi` installer, NSIS installer |
| macOS    | `.app` bundle, `.dmg` installer |
| Linux    | `.deb`, `.rpm`, `.AppImage` |

### Web Development (Contributors)

For contributors who want to work on the web version:

```bash
# Clone the repository
git clone https://github.com/infomanc3r/stitchfizzle.git
cd stitchfizzle

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

#### Build for Production

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
- **Tauri** for desktop builds

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

## License

MIT License - feel free to use this for any purpose.

## Acknowledgments

Inspired by [Stitch Fiddle](https://www.stitchfiddle.com/), a great online chart maker. StitchFizzle is an independent, open-source alternative for users who prefer local-first software.
