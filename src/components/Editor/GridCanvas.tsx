import { useEffect, useRef, useCallback, useState } from 'react';
import { Canvas, Rect, Line, Path, FabricText, type FabricObject } from 'fabric';
import { useProjectStore } from '@/stores/projectStore';
import type { ChartType } from '@/types';

const CELL_SIZE = 20; // Base cell size in pixels

// Create chart-type-specific cell visual
function createCellVisual(
  chartType: ChartType,
  x: number,
  y: number,
  size: number,
  color: string,
  hasSymbol: boolean
): FabricObject[] {
  const objects: FabricObject[] = [];

  switch (chartType) {
    case 'filet': {
      // Filet crochet: filled cells have X pattern, empty cells are just outlined
      objects.push(
        new Rect({
          left: x,
          top: y,
          width: size,
          height: size,
          fill: color,
          selectable: false,
          evented: false,
        })
      );
      // Add X pattern for filled cells
      if (color !== 'transparent') {
        const padding = size * 0.15;
        objects.push(
          new Line([x + padding, y + padding, x + size - padding, y + size - padding], {
            stroke: '#333',
            strokeWidth: Math.max(1, size * 0.08),
            selectable: false,
            evented: false,
          })
        );
        objects.push(
          new Line([x + size - padding, y + padding, x + padding, y + size - padding], {
            stroke: '#333',
            strokeWidth: Math.max(1, size * 0.08),
            selectable: false,
            evented: false,
          })
        );
      }
      break;
    }

    case 'mosaic': {
      // Mosaic crochet: base color with optional overlay X
      objects.push(
        new Rect({
          left: x,
          top: y,
          width: size,
          height: size,
          fill: color,
          selectable: false,
          evented: false,
        })
      );
      // Add overlay X symbol if cell has a symbol assigned
      if (hasSymbol) {
        const padding = size * 0.2;
        objects.push(
          new Line([x + padding, y + padding, x + size - padding, y + size - padding], {
            stroke: '#000',
            strokeWidth: Math.max(2, size * 0.1),
            selectable: false,
            evented: false,
          })
        );
        objects.push(
          new Line([x + size - padding, y + padding, x + padding, y + size - padding], {
            stroke: '#000',
            strokeWidth: Math.max(2, size * 0.1),
            selectable: false,
            evented: false,
          })
        );
      }
      break;
    }

    case 'c2c': {
      // Corner-to-corner: rotated diamond/square blocks
      const centerX = x + size / 2;
      const centerY = y + size / 2;

      // Create diamond shape (rotated square)
      const pathStr = `M ${centerX} ${y + size * 0.05} L ${x + size * 0.95} ${centerY} L ${centerX} ${y + size * 0.95} L ${x + size * 0.05} ${centerY} Z`;
      objects.push(
        new Path(pathStr, {
          fill: color,
          stroke: '#666',
          strokeWidth: 1,
          selectable: false,
          evented: false,
        })
      );
      break;
    }

    case 'tunisian': {
      // Tunisian: standard cells with vertical stitch lines
      objects.push(
        new Rect({
          left: x,
          top: y,
          width: size,
          height: size,
          fill: color,
          selectable: false,
          evented: false,
        })
      );
      // Add vertical stitch line for visual
      if (color !== 'transparent') {
        objects.push(
          new Line([x + size / 2, y + size * 0.1, x + size / 2, y + size * 0.9], {
            stroke: 'rgba(0,0,0,0.3)',
            strokeWidth: Math.max(1, size * 0.05),
            selectable: false,
            evented: false,
          })
        );
      }
      break;
    }

    default: {
      // colorwork and freeform: simple filled rectangle
      objects.push(
        new Rect({
          left: x,
          top: y,
          width: size,
          height: size,
          fill: color,
          selectable: false,
          evented: false,
        })
      );
    }
  }

  return objects;
}

export function GridCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const project = useProjectStore((state) => state.project);
  const zoom = useProjectStore((state) => state.zoom);
  const panOffset = useProjectStore((state) => state.panOffset);
  const setPanOffset = useProjectStore((state) => state.setPanOffset);
  const activeTool = useProjectStore((state) => state.activeTool);
  const activeColorId = useProjectStore((state) => state.activeColorId);
  const setCell = useProjectStore((state) => state.setCell);
  const selection = useProjectStore((state) => state.selection);
  const setSelection = useProjectStore((state) => state.setSelection);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const isDrawingRef = useRef(false);
  const lastCellRef = useRef<{ row: number; col: number } | null>(null);
  const drawnCellsRef = useRef<Set<string>>(new Set());
  const selectionStartRef = useRef<{ row: number; col: number } | null>(null);
  const lastTouchDistRef = useRef<number | null>(null);
  const lastTouchCenterRef = useRef<{ x: number; y: number } | null>(null);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      selection: false,
      renderOnAddRemove: false,
      skipOffscreen: true,
    });

    fabricRef.current = canvas;

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current && fabricRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        fabricRef.current.setDimensions({ width, height });
        renderGrid();
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      canvas.dispose();
      fabricRef.current = null;
    };
  }, []);

  // Render grid when project/zoom/pan/selection changes
  const renderGrid = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas || !project?.grid || !project.settings) return;

    const { width, height } = project.settings;
    const { cells } = project.grid;
    const gridLines = project.settings.gridLines;

    // Clear canvas
    canvas.clear();

    const scaledCellSize = CELL_SIZE * zoom;
    const offsetX = panOffset.x;
    const offsetY = panOffset.y;

    // Calculate visible area
    const canvasWidth = canvas.width || 800;
    const canvasHeight = canvas.height || 600;

    const startCol = Math.max(0, Math.floor(-offsetX / scaledCellSize));
    const endCol = Math.min(width, Math.ceil((canvasWidth - offsetX) / scaledCellSize));
    const startRow = Math.max(0, Math.floor(-offsetY / scaledCellSize));
    const endRow = Math.min(height, Math.ceil((canvasHeight - offsetY) / scaledCellSize));

    // Draw cells with chart-type-specific visuals
    const chartType = project.chartType;
    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const cell = cells[row]?.[col];
        if (cell?.colorId) {
          const color = project.palette.find((p) => p.id === cell.colorId)?.color;
          if (color) {
            const cellX = offsetX + col * scaledCellSize;
            const cellY = offsetY + row * scaledCellSize;
            const hasSymbol = !!cell.symbolId;
            const cellVisuals = createCellVisual(chartType, cellX, cellY, scaledCellSize, color, hasSymbol);
            cellVisuals.forEach((obj) => canvas.add(obj));
          }
        }
      }
    }

    // Draw grid lines
    if (gridLines.show) {
      // Vertical lines
      for (let col = startCol; col <= endCol; col++) {
        const x = offsetX + col * scaledCellSize;
        const isHighlight10 = gridLines.highlight10 && col % 10 === 0;
        const isHighlight5 = gridLines.highlight5 && col % 5 === 0 && !isHighlight10;

        const line = new Line([x, offsetY + startRow * scaledCellSize, x, offsetY + endRow * scaledCellSize], {
          stroke: isHighlight10
            ? gridLines.highlight10Color
            : isHighlight5
            ? gridLines.highlight5Color
            : gridLines.color,
          strokeWidth: isHighlight10 ? 2 : isHighlight5 ? 1.5 : gridLines.thickness,
          selectable: false,
          evented: false,
        });
        canvas.add(line);
      }

      // Horizontal lines
      for (let row = startRow; row <= endRow; row++) {
        const y = offsetY + row * scaledCellSize;
        const isHighlight10 = gridLines.highlight10 && row % 10 === 0;
        const isHighlight5 = gridLines.highlight5 && row % 5 === 0 && !isHighlight10;

        const line = new Line([offsetX + startCol * scaledCellSize, y, offsetX + endCol * scaledCellSize, y], {
          stroke: isHighlight10
            ? gridLines.highlight10Color
            : isHighlight5
            ? gridLines.highlight5Color
            : gridLines.color,
          strokeWidth: isHighlight10 ? 2 : isHighlight5 ? 1.5 : gridLines.thickness,
          selectable: false,
          evented: false,
        });
        canvas.add(line);
      }
    }

    // Draw row/column numbers if enabled
    if (project.settings.showNumbers) {
      const fontSize = Math.max(8, Math.min(14, scaledCellSize * 0.5));
      const numberPadding = 4;
      const textColor = '#666666';

      // Row numbers (on left and right sides)
      // Crochet style: row 1 is at the bottom, row N is at the top
      for (let row = startRow; row < endRow; row++) {
        const displayRowNum = height - row; // Convert to crochet numbering
        const y = offsetY + row * scaledCellSize + scaledCellSize / 2;

        // Left side number
        const leftText = new FabricText(String(displayRowNum), {
          left: offsetX - numberPadding,
          top: y,
          fontSize,
          fill: textColor,
          fontFamily: 'monospace',
          originX: 'right',
          originY: 'center',
          selectable: false,
          evented: false,
        });
        canvas.add(leftText);

        // Right side number
        const rightText = new FabricText(String(displayRowNum), {
          left: offsetX + width * scaledCellSize + numberPadding,
          top: y,
          fontSize,
          fill: textColor,
          fontFamily: 'monospace',
          originX: 'left',
          originY: 'center',
          selectable: false,
          evented: false,
        });
        canvas.add(rightText);
      }

      // Column numbers (on top and bottom sides)
      // Crochet style: column 1 is on the right, column N is on the left
      for (let col = startCol; col < endCol; col++) {
        const displayColNum = width - col; // Reversed: 1 on right, N on left
        const x = offsetX + col * scaledCellSize + scaledCellSize / 2;

        // Top number
        const topText = new FabricText(String(displayColNum), {
          left: x,
          top: offsetY - numberPadding,
          fontSize,
          fill: textColor,
          fontFamily: 'monospace',
          originX: 'center',
          originY: 'bottom',
          selectable: false,
          evented: false,
        });
        canvas.add(topText);

        // Bottom number
        const bottomText = new FabricText(String(displayColNum), {
          left: x,
          top: offsetY + height * scaledCellSize + numberPadding,
          fontSize,
          fill: textColor,
          fontFamily: 'monospace',
          originX: 'center',
          originY: 'top',
          selectable: false,
          evented: false,
        });
        canvas.add(bottomText);
      }
    }

    // Draw Tunisian forward/return pass markers
    if (chartType === 'tunisian') {
      for (let row = startRow; row < endRow; row++) {
        const isReturnPass = row % 2 === 1;
        const markerX = offsetX - 25;
        const markerY = offsetY + row * scaledCellSize + scaledCellSize / 2;

        // Draw arrow indicator
        if (markerX > -30) {
          const arrowPath = isReturnPass
            ? `M ${markerX + 20} ${markerY} L ${markerX + 5} ${markerY} L ${markerX + 10} ${markerY - 4} M ${markerX + 5} ${markerY} L ${markerX + 10} ${markerY + 4}`
            : `M ${markerX + 5} ${markerY} L ${markerX + 20} ${markerY} L ${markerX + 15} ${markerY - 4} M ${markerX + 20} ${markerY} L ${markerX + 15} ${markerY + 4}`;

          const arrow = new Path(arrowPath, {
            stroke: isReturnPass ? '#E11D48' : '#2563EB',
            strokeWidth: 2,
            fill: 'transparent',
            selectable: false,
            evented: false,
          });
          canvas.add(arrow);
        }
      }
    }

    // Draw progress overlay
    const progressTracker = project.progressTracker;
    if (progressTracker && progressTracker.darkenMode !== 'none') {
      const { currentRow, darkenMode, brightness } = progressTracker;
      const opacity = (100 - brightness) / 100;

      for (let row = startRow; row < endRow; row++) {
        let shouldDarken = false;

        switch (darkenMode) {
          case 'done':
            shouldDarken = row < currentRow;
            break;
          case 'todo':
            shouldDarken = row > currentRow;
            break;
          case 'except-current':
            shouldDarken = row !== currentRow;
            break;
        }

        if (shouldDarken) {
          const overlay = new Rect({
            left: offsetX + startCol * scaledCellSize,
            top: offsetY + row * scaledCellSize,
            width: (endCol - startCol) * scaledCellSize,
            height: scaledCellSize,
            fill: `rgba(0, 0, 0, ${opacity})`,
            selectable: false,
            evented: false,
          });
          canvas.add(overlay);
        }
      }

      // Highlight current row
      const currentRowRect = new Rect({
        left: offsetX,
        top: offsetY + currentRow * scaledCellSize,
        width: width * scaledCellSize,
        height: scaledCellSize,
        fill: 'transparent',
        stroke: '#22C55E',
        strokeWidth: 3,
        selectable: false,
        evented: false,
      });
      canvas.add(currentRowRect);
    }

    // Draw selection overlay
    if (selection) {
      const minRow = Math.min(selection.startRow, selection.endRow);
      const maxRow = Math.max(selection.startRow, selection.endRow);
      const minCol = Math.min(selection.startCol, selection.endCol);
      const maxCol = Math.max(selection.startCol, selection.endCol);

      const selectionRect = new Rect({
        left: offsetX + minCol * scaledCellSize,
        top: offsetY + minRow * scaledCellSize,
        width: (maxCol - minCol + 1) * scaledCellSize,
        height: (maxRow - minRow + 1) * scaledCellSize,
        fill: 'rgba(59, 130, 246, 0.2)',
        stroke: '#3B82F6',
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
      });
      canvas.add(selectionRect);
    }

    canvas.renderAll();
  }, [project, zoom, panOffset, selection]);

  // Re-render when dependencies change
  useEffect(() => {
    renderGrid();
  }, [renderGrid]);

  // Get cell from mouse position
  const getCellFromEvent = useCallback(
    (e: React.MouseEvent): { row: number; col: number } | null => {
      if (!containerRef.current || !project?.settings) return null;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - panOffset.x;
      const y = e.clientY - rect.top - panOffset.y;

      const scaledCellSize = CELL_SIZE * zoom;
      const col = Math.floor(x / scaledCellSize);
      const row = Math.floor(y / scaledCellSize);

      if (col >= 0 && col < project.settings.width && row >= 0 && row < project.settings.height) {
        return { row, col };
      }
      return null;
    },
    [zoom, panOffset, project?.settings]
  );

  // Mouse handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Close context menu on any click
      setContextMenu(null);

      if (activeTool === 'pan') {
        isDrawingRef.current = true;
        lastCellRef.current = { row: e.clientY, col: e.clientX };
        return;
      }

      if (activeTool === 'select') {
        const cell = getCellFromEvent(e);
        if (!cell) return;
        isDrawingRef.current = true;
        selectionStartRef.current = cell;
        setSelection({ startRow: cell.row, startCol: cell.col, endRow: cell.row, endCol: cell.col });
        return;
      }

      if (activeTool !== 'draw' && activeTool !== 'erase') return;

      const cell = getCellFromEvent(e);
      if (!cell) return;

      isDrawingRef.current = true;
      drawnCellsRef.current.clear();
      lastCellRef.current = cell;

      const colorToSet = activeTool === 'draw' ? activeColorId : null;
      setCell(cell.row, cell.col, colorToSet);
      drawnCellsRef.current.add(`${cell.row},${cell.col}`);
    },
    [activeTool, activeColorId, getCellFromEvent, setCell, setSelection]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawingRef.current) return;

      if (activeTool === 'pan' && lastCellRef.current) {
        const dx = e.clientX - lastCellRef.current.col;
        const dy = e.clientY - lastCellRef.current.row;
        setPanOffset({ x: panOffset.x + dx, y: panOffset.y + dy });
        lastCellRef.current = { row: e.clientY, col: e.clientX };
        return;
      }

      if (activeTool === 'select' && selectionStartRef.current) {
        const cell = getCellFromEvent(e);
        if (!cell) return;
        setSelection({
          startRow: selectionStartRef.current.row,
          startCol: selectionStartRef.current.col,
          endRow: cell.row,
          endCol: cell.col,
        });
        return;
      }

      if (activeTool !== 'draw' && activeTool !== 'erase') return;

      const cell = getCellFromEvent(e);
      if (!cell) return;

      const cellKey = `${cell.row},${cell.col}`;
      if (drawnCellsRef.current.has(cellKey)) return;

      const colorToSet = activeTool === 'draw' ? activeColorId : null;
      setCell(cell.row, cell.col, colorToSet);
      drawnCellsRef.current.add(cellKey);
      lastCellRef.current = cell;
    },
    [activeTool, activeColorId, getCellFromEvent, setCell, panOffset, setPanOffset, setSelection]
  );

  const handleMouseUp = useCallback(() => {
    isDrawingRef.current = false;
    lastCellRef.current = null;
    drawnCellsRef.current.clear();
    selectionStartRef.current = null;
  }, []);

  // Context menu handler
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (selection) {
        setContextMenu({ x: e.clientX, y: e.clientY });
      }
    },
    [selection]
  );

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

  // Eyedropper and Fill tool
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const cell = getCellFromEvent(e);
      if (!cell || !project?.grid) return;

      if (activeTool === 'eyedropper') {
        const cellData = project.grid.cells[cell.row]?.[cell.col];
        if (cellData?.colorId) {
          useProjectStore.getState().setActiveColor(cellData.colorId);
          useProjectStore.getState().setActiveTool('draw');
        }
      } else if (activeTool === 'fill') {
        useProjectStore.getState().floodFill(cell.row, cell.col, activeColorId);
      }
    },
    [activeTool, activeColorId, getCellFromEvent, project?.grid]
  );

  // Get cell from touch position
  const getCellFromTouch = useCallback(
    (touch: React.Touch): { row: number; col: number } | null => {
      if (!containerRef.current || !project?.settings) return null;

      const rect = containerRef.current.getBoundingClientRect();
      const x = touch.clientX - rect.left - panOffset.x;
      const y = touch.clientY - rect.top - panOffset.y;

      const scaledCellSize = CELL_SIZE * zoom;
      const col = Math.floor(x / scaledCellSize);
      const row = Math.floor(y / scaledCellSize);

      if (col >= 0 && col < project.settings.width && row >= 0 && row < project.settings.height) {
        return { row, col };
      }
      return null;
    },
    [zoom, panOffset, project?.settings]
  );

  // Touch handlers for mobile support
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      setContextMenu(null);

      if (e.touches.length === 2) {
        // Two-finger touch: prepare for pinch-to-zoom
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
        lastTouchDistRef.current = dist;
        lastTouchCenterRef.current = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2,
        };
        return;
      }

      if (e.touches.length !== 1) return;

      const touch = e.touches[0];

      if (activeTool === 'pan') {
        isDrawingRef.current = true;
        lastTouchCenterRef.current = { x: touch.clientX, y: touch.clientY };
        return;
      }

      if (activeTool === 'select') {
        const cell = getCellFromTouch(touch);
        if (!cell) return;
        isDrawingRef.current = true;
        selectionStartRef.current = cell;
        setSelection({ startRow: cell.row, startCol: cell.col, endRow: cell.row, endCol: cell.col });
        return;
      }

      if (activeTool === 'eyedropper' || activeTool === 'fill') {
        const cell = getCellFromTouch(touch);
        if (!cell || !project?.grid) return;

        if (activeTool === 'eyedropper') {
          const cellData = project.grid.cells[cell.row]?.[cell.col];
          if (cellData?.colorId) {
            useProjectStore.getState().setActiveColor(cellData.colorId);
            useProjectStore.getState().setActiveTool('draw');
          }
        } else {
          useProjectStore.getState().floodFill(cell.row, cell.col, activeColorId);
        }
        return;
      }

      if (activeTool !== 'draw' && activeTool !== 'erase') return;

      const cell = getCellFromTouch(touch);
      if (!cell) return;

      isDrawingRef.current = true;
      drawnCellsRef.current.clear();
      lastCellRef.current = cell;

      const colorToSet = activeTool === 'draw' ? activeColorId : null;
      setCell(cell.row, cell.col, colorToSet);
      drawnCellsRef.current.add(`${cell.row},${cell.col}`);
    },
    [activeTool, activeColorId, getCellFromTouch, setCell, setSelection, project?.grid]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        // Pinch-to-zoom
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);

        if (lastTouchDistRef.current !== null) {
          const scale = dist / lastTouchDistRef.current;
          const newZoom = Math.max(0.1, Math.min(10, zoom * scale));
          useProjectStore.getState().setZoom(newZoom);
        }

        lastTouchDistRef.current = dist;
        return;
      }

      if (!isDrawingRef.current || e.touches.length !== 1) return;

      const touch = e.touches[0];

      if (activeTool === 'pan' && lastTouchCenterRef.current) {
        const dx = touch.clientX - lastTouchCenterRef.current.x;
        const dy = touch.clientY - lastTouchCenterRef.current.y;
        setPanOffset({ x: panOffset.x + dx, y: panOffset.y + dy });
        lastTouchCenterRef.current = { x: touch.clientX, y: touch.clientY };
        return;
      }

      if (activeTool === 'select' && selectionStartRef.current) {
        const cell = getCellFromTouch(touch);
        if (!cell) return;
        setSelection({
          startRow: selectionStartRef.current.row,
          startCol: selectionStartRef.current.col,
          endRow: cell.row,
          endCol: cell.col,
        });
        return;
      }

      if (activeTool !== 'draw' && activeTool !== 'erase') return;

      const cell = getCellFromTouch(touch);
      if (!cell) return;

      const cellKey = `${cell.row},${cell.col}`;
      if (drawnCellsRef.current.has(cellKey)) return;

      const colorToSet = activeTool === 'draw' ? activeColorId : null;
      setCell(cell.row, cell.col, colorToSet);
      drawnCellsRef.current.add(cellKey);
      lastCellRef.current = cell;
    },
    [activeTool, activeColorId, getCellFromTouch, setCell, panOffset, setPanOffset, setSelection, zoom]
  );

  const handleTouchEnd = useCallback(() => {
    isDrawingRef.current = false;
    lastCellRef.current = null;
    drawnCellsRef.current.clear();
    selectionStartRef.current = null;
    lastTouchDistRef.current = null;
    lastTouchCenterRef.current = null;
  }, []);

  const getCursor = () => {
    switch (activeTool) {
      case 'draw':
        return 'crosshair';
      case 'erase':
        return 'crosshair';
      case 'fill':
        return 'crosshair';
      case 'select':
        return 'crosshair';
      case 'pan':
        return 'grab';
      case 'eyedropper':
        return 'crosshair';
      default:
        return 'default';
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden bg-gray-100 dark:bg-gray-900 relative touch-none"
      style={{ cursor: getCursor() }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <canvas ref={canvasRef} />

      {/* Context Menu */}
      {contextMenu && selection && (
        <SelectionContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}

interface SelectionContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
}

function SelectionContextMenu({ x, y, onClose }: SelectionContextMenuProps) {
  const copySelection = useProjectStore((state) => state.copySelection);
  const pasteSelection = useProjectStore((state) => state.pasteSelection);
  const fillSelection = useProjectStore((state) => state.fillSelection);
  const mirrorSelectionH = useProjectStore((state) => state.mirrorSelectionH);
  const mirrorSelectionV = useProjectStore((state) => state.mirrorSelectionV);
  const clearSelection = useProjectStore((state) => state.clearSelection);
  const activeColorId = useProjectStore((state) => state.activeColorId);
  const clipboard = useProjectStore((state) => state.clipboard);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleCopy = () => {
    copySelection();
    onClose();
  };

  const handlePaste = () => {
    pasteSelection();
    onClose();
  };

  const handleFill = () => {
    fillSelection(activeColorId);
    onClose();
  };

  const handleClear = () => {
    fillSelection(null);
    onClose();
  };

  const handleMirrorH = () => {
    mirrorSelectionH();
    onClose();
  };

  const handleMirrorV = () => {
    mirrorSelectionV();
    onClose();
  };

  const handleDeselect = () => {
    clearSelection();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 min-w-40"
      style={{ left: x, top: y }}
    >
      <button
        onClick={handleCopy}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
      >
        <span className="w-4">📋</span> Copy
        <span className="ml-auto text-xs text-gray-400">Ctrl+C</span>
      </button>
      <button
        onClick={handlePaste}
        disabled={!clipboard}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="w-4">📄</span> Paste
        <span className="ml-auto text-xs text-gray-400">Ctrl+V</span>
      </button>
      <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
      <button
        onClick={handleFill}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
      >
        <span className="w-4">🎨</span> Fill with Color
      </button>
      <button
        onClick={handleClear}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
      >
        <span className="w-4">🗑️</span> Clear
        <span className="ml-auto text-xs text-gray-400">Del</span>
      </button>
      <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
      <button
        onClick={handleMirrorH}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
      >
        <span className="w-4">↔️</span> Mirror Horizontal
      </button>
      <button
        onClick={handleMirrorV}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
      >
        <span className="w-4">↕️</span> Mirror Vertical
      </button>
      <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
      <button
        onClick={handleDeselect}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
      >
        <span className="w-4">✖️</span> Deselect
        <span className="ml-auto text-xs text-gray-400">Esc</span>
      </button>
    </div>
  );
}
