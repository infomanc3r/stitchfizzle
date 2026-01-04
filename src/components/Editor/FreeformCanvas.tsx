import { useEffect, useRef, useCallback, useState } from 'react';
import { Canvas, Path, Rect, Circle } from 'fabric';
import { useProjectStore } from '@/stores/projectStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { getSymbol } from '@/symbols/crochet';

const SYMBOL_SIZE = 40; // Base symbol size in pixels
const GRID_CELL_SIZE = 50; // Size of each grid cell in pixels

export function FreeformCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const project = useProjectStore((state) => state.project);
  const zoom = useProjectStore((state) => state.zoom);
  const panOffset = useProjectStore((state) => state.panOffset);
  const setPanOffset = useProjectStore((state) => state.setPanOffset);
  const activeTool = useProjectStore((state) => state.activeTool);
  const activeSymbolId = useProjectStore((state) => state.activeSymbolId);
  const selectedSymbolInstanceId = useProjectStore((state) => state.selectedSymbolInstanceId);
  const setSelectedSymbolInstance = useProjectStore((state) => state.setSelectedSymbolInstance);
  const addPlacedSymbol = useProjectStore((state) => state.addPlacedSymbol);
  const movePlacedSymbol = useProjectStore((state) => state.movePlacedSymbol);
  const removePlacedSymbol = useProjectStore((state) => state.removePlacedSymbol);
  const rotatePlacedSymbol = useProjectStore((state) => state.rotatePlacedSymbol);
  const scalePlacedSymbol = useProjectStore((state) => state.scalePlacedSymbol);

  const isDarkMode = useSettingsStore((state) => state.isDarkMode);

  const [isPanning, setIsPanning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      selection: false,
      renderOnAddRemove: false,
    });

    fabricRef.current = canvas;

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current && fabricRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        fabricRef.current.setDimensions({ width, height });
        renderSymbols();
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      canvas.dispose();
      fabricRef.current = null;
    };
  }, []);

  // Render all symbols
  const renderSymbols = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas || !project?.freeform) return;

    canvas.clear();

    const { layers } = project.freeform;
    const scaledSize = SYMBOL_SIZE * zoom;

    // Calculate grid boundaries based on project settings
    const gridWidth = project.settings.width * GRID_CELL_SIZE;
    const gridHeight = project.settings.height * GRID_CELL_SIZE;
    const gridSize = GRID_CELL_SIZE * zoom;

    // Grid origin in canvas coordinates
    const gridOriginX = panOffset.x;
    const gridOriginY = panOffset.y;
    const gridEndX = gridOriginX + gridWidth * zoom;
    const gridEndY = gridOriginY + gridHeight * zoom;

    // Draw boundary rectangle (the working area)
    const dark = isDarkMode();
    const boundaryRect = new Rect({
      left: gridOriginX,
      top: gridOriginY,
      width: gridWidth * zoom,
      height: gridHeight * zoom,
      fill: dark ? '#1f2937' : '#ffffff',
      stroke: '#3B82F6',
      strokeWidth: 2,
      selectable: false,
      evented: false,
    });
    canvas.add(boundaryRect);

    // Draw grid lines only within the boundary
    const gridLineColor = dark ? '#374151' : '#e5e7eb';
    for (let i = 1; i < project.settings.width; i++) {
      const x = gridOriginX + i * gridSize;
      const line = new Path(`M ${x} ${gridOriginY} L ${x} ${gridEndY}`, {
        stroke: gridLineColor,
        strokeWidth: 1,
        selectable: false,
        evented: false,
      });
      canvas.add(line);
    }

    for (let i = 1; i < project.settings.height; i++) {
      const y = gridOriginY + i * gridSize;
      const line = new Path(`M ${gridOriginX} ${y} L ${gridEndX} ${y}`, {
        stroke: gridLineColor,
        strokeWidth: 1,
        selectable: false,
        evented: false,
      });
      canvas.add(line);
    }

    // Draw symbols from each visible layer (bottom to top)
    layers.forEach((layer) => {
      if (!layer.visible) return;

      layer.symbols.forEach((placedSymbol) => {
        const symbolDef = getSymbol(placedSymbol.symbolId);
        if (!symbolDef) return;

        const color = project.palette.find((p) => p.id === placedSymbol.colorId)?.color || '#333';
        const x = panOffset.x + placedSymbol.x * zoom;
        const y = panOffset.y + placedSymbol.y * zoom;
        const size = scaledSize * placedSymbol.scale;
        const isSelected = placedSymbol.id === selectedSymbolInstanceId;

        // Create symbol path
        const symbolPath = new Path(symbolDef.svgPath, {
          left: x,
          top: y,
          scaleX: (size / 24),
          scaleY: (size / 24),
          fill: 'transparent',
          stroke: color,
          strokeWidth: 2,
          angle: placedSymbol.rotation,
          originX: 'center',
          originY: 'center',
          selectable: false,
          evented: false,
        });

        canvas.add(symbolPath);

        // Draw selection indicator
        if (isSelected) {
          const selectionRect = new Rect({
            left: x - size / 2 - 4,
            top: y - size / 2 - 4,
            width: size + 8,
            height: size + 8,
            fill: 'transparent',
            stroke: '#3B82F6',
            strokeWidth: 2,
            strokeDashArray: [4, 4],
            selectable: false,
            evented: false,
          });
          canvas.add(selectionRect);

          // Rotation handle
          const rotateHandle = new Circle({
            left: x,
            top: y - size / 2 - 20,
            radius: 6,
            fill: '#3B82F6',
            stroke: '#fff',
            strokeWidth: 2,
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false,
          });
          canvas.add(rotateHandle);

          // Scale handle (bottom-right)
          const scaleHandle = new Rect({
            left: x + size / 2 + 4 - 5,
            top: y + size / 2 + 4 - 5,
            width: 10,
            height: 10,
            fill: '#3B82F6',
            stroke: '#fff',
            strokeWidth: 2,
            selectable: false,
            evented: false,
          });
          canvas.add(scaleHandle);
        }
      });
    });

    canvas.renderAll();
  }, [project, zoom, panOffset, selectedSymbolInstanceId, isDarkMode]);

  // Re-render when dependencies change
  useEffect(() => {
    renderSymbols();
  }, [renderSymbols]);

  // Get position from mouse event
  const getPositionFromEvent = useCallback(
    (e: React.MouseEvent): { x: number; y: number } => {
      if (!containerRef.current) return { x: 0, y: 0 };

      const rect = containerRef.current.getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;

      // Convert to world coordinates
      const worldX = (canvasX - panOffset.x) / zoom;
      const worldY = (canvasY - panOffset.y) / zoom;

      return { x: worldX, y: worldY };
    },
    [zoom, panOffset]
  );

  // Clamp position to grid boundaries
  const clampToGrid = useCallback(
    (pos: { x: number; y: number }): { x: number; y: number } => {
      if (!project) return pos;
      const maxX = project.settings.width * GRID_CELL_SIZE;
      const maxY = project.settings.height * GRID_CELL_SIZE;
      return {
        x: Math.max(0, Math.min(maxX, pos.x)),
        y: Math.max(0, Math.min(maxY, pos.y)),
      };
    },
    [project]
  );

  // Find symbol at position
  const findSymbolAtPosition = useCallback(
    (x: number, y: number): string | null => {
      if (!project?.freeform) return null;

      const { layers } = project.freeform;
      const hitRadius = (SYMBOL_SIZE / 2) * 1.2; // Slightly larger hit area

      // Check layers in reverse order (top to bottom)
      for (let i = layers.length - 1; i >= 0; i--) {
        const layer = layers[i];
        if (!layer.visible || layer.locked) continue;

        // Check symbols in reverse order (top to bottom within layer)
        for (let j = layer.symbols.length - 1; j >= 0; j--) {
          const symbol = layer.symbols[j];
          const dx = x - symbol.x;
          const dy = y - symbol.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance <= hitRadius * symbol.scale) {
            return symbol.id;
          }
        }
      }

      return null;
    },
    [project?.freeform]
  );

  // Mouse handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const pos = getPositionFromEvent(e);

      if (activeTool === 'pan') {
        setIsPanning(true);
        lastPosRef.current = { x: e.clientX, y: e.clientY };
        return;
      }

      if (activeTool === 'select') {
        const symbolId = findSymbolAtPosition(pos.x, pos.y);
        if (symbolId) {
          setSelectedSymbolInstance(symbolId);
          setIsDragging(true);
          lastPosRef.current = pos;
        } else {
          setSelectedSymbolInstance(null);
        }
        return;
      }

      if (activeTool === 'draw' && activeSymbolId) {
        const clampedPos = clampToGrid(pos);
        // Only place if within grid bounds
        if (pos.x >= 0 && pos.y >= 0 && project &&
            pos.x <= project.settings.width * GRID_CELL_SIZE &&
            pos.y <= project.settings.height * GRID_CELL_SIZE) {
          addPlacedSymbol(activeSymbolId, clampedPos.x, clampedPos.y);
        }
        return;
      }

      if (activeTool === 'erase') {
        const symbolId = findSymbolAtPosition(pos.x, pos.y);
        if (symbolId) {
          removePlacedSymbol(symbolId);
        }
        return;
      }
    },
    [
      activeTool,
      activeSymbolId,
      project,
      getPositionFromEvent,
      findSymbolAtPosition,
      setSelectedSymbolInstance,
      addPlacedSymbol,
      removePlacedSymbol,
      clampToGrid,
    ]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning && lastPosRef.current) {
        const dx = e.clientX - lastPosRef.current.x;
        const dy = e.clientY - lastPosRef.current.y;
        setPanOffset({ x: panOffset.x + dx, y: panOffset.y + dy });
        lastPosRef.current = { x: e.clientX, y: e.clientY };
        return;
      }

      if (isDragging && selectedSymbolInstanceId && lastPosRef.current) {
        const pos = getPositionFromEvent(e);
        const clampedPos = clampToGrid(pos);
        movePlacedSymbol(selectedSymbolInstanceId, clampedPos.x, clampedPos.y);
        lastPosRef.current = clampedPos;
        return;
      }
    },
    [
      isPanning,
      isDragging,
      selectedSymbolInstanceId,
      panOffset,
      setPanOffset,
      getPositionFromEvent,
      movePlacedSymbol,
      clampToGrid,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setIsDragging(false);
    lastPosRef.current = null;
  }, []);

  // Wheel handler for zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.altKey || e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.max(0.1, Math.min(10, zoom + delta));
        useProjectStore.getState().setZoom(newZoom);
      }
    },
    [zoom]
  );

  // Keyboard handler for selected symbol
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedSymbolInstanceId) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        removePlacedSymbol(selectedSymbolInstanceId);
        return;
      }

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        // Find current rotation
        const symbol = project?.freeform?.layers
          .flatMap((l) => l.symbols)
          .find((s) => s.id === selectedSymbolInstanceId);
        if (symbol) {
          const newRotation = (symbol.rotation + (e.shiftKey ? -15 : 15)) % 360;
          rotatePlacedSymbol(selectedSymbolInstanceId, newRotation);
        }
        return;
      }

      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        const symbol = project?.freeform?.layers
          .flatMap((l) => l.symbols)
          .find((s) => s.id === selectedSymbolInstanceId);
        if (symbol) {
          scalePlacedSymbol(selectedSymbolInstanceId, symbol.scale + 0.1);
        }
        return;
      }

      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        const symbol = project?.freeform?.layers
          .flatMap((l) => l.symbols)
          .find((s) => s.id === selectedSymbolInstanceId);
        if (symbol) {
          scalePlacedSymbol(selectedSymbolInstanceId, symbol.scale - 0.1);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSymbolInstanceId, project?.freeform, removePlacedSymbol, rotatePlacedSymbol, scalePlacedSymbol]);

  const getCursor = () => {
    switch (activeTool) {
      case 'draw':
        return activeSymbolId ? 'crosshair' : 'default';
      case 'erase':
        return 'crosshair';
      case 'select':
        return isDragging ? 'grabbing' : 'pointer';
      case 'pan':
        return isPanning ? 'grabbing' : 'grab';
      default:
        return 'default';
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden bg-white dark:bg-gray-900 relative"
      style={{ cursor: getCursor() }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <canvas ref={canvasRef} />

      {/* Help text */}
      {!activeSymbolId && activeTool === 'draw' && (
        <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg text-sm text-gray-600 dark:text-gray-300">
          Select a symbol from the palette to place it on the canvas
        </div>
      )}

      {/* Selected symbol info */}
      {selectedSymbolInstanceId && (
        <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg text-sm text-gray-600 dark:text-gray-300">
          <p>R: Rotate | +/-: Scale | Del: Delete</p>
        </div>
      )}
    </div>
  );
}
