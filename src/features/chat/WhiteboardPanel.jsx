import { useEffect, useRef, useState, useCallback } from "react";
import {
  X, PenTool, Eraser, RotateCcw, Trash2, Download, StickyNote,
  Highlighter, Check, LayoutTemplate, Shapes, ChevronDown
} from "lucide-react";

const COLORS = [
  { name: "Teal", hex: "#00877f" },
  { name: "Orange", hex: "#ef510f" },
  { name: "Dark Ink", hex: "#1f2937" },
  { name: "Blue", hex: "#2563eb" },
  { name: "Purple", hex: "#7c3aed" },
  { name: "Green", hex: "#10b981" },
];

// Horizontal line stroke thicknesses (visual previews replace "Thin", "Medium", "Thick")
const STROKE_WIDTHS = [2, 5, 9];

// Eraser thickness options
const ERASER_SIZES = [20, 36, 56];

// Shapes available for drawing
const SHAPES = [
  {
    id: "rectangle",
    name: "Rectangle",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="6" width="18" height="12" rx="2" />
      </svg>
    ),
  },
  {
    id: "square",
    name: "Square",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" />
      </svg>
    ),
  },
  {
    id: "circle",
    name: "Circle",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
  },
  {
    id: "triangle",
    name: "Triangle",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 3 22 21 2 21" />
      </svg>
    ),
  },
  {
    id: "line",
    name: "Line",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="20" x2="20" y2="4" />
      </svg>
    ),
  },
  {
    id: "arrow",
    name: "Arrow",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="12" x2="20" y2="12" />
        <polyline points="14 6 20 12 14 18" />
      </svg>
    ),
  },
];

export default function WhiteboardPanel({ isOpen, onClose, onNotify }) {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const startCoord = useRef({ x: 0, y: 0 });
  const offscreenCanvasRef = useRef(null);

  const [tool, setTool] = useState("pen"); // "pen" | "highlighter" | "eraser" | "shape"
  const [shapeType, setShapeType] = useState("rectangle");
  const [shapeDropdownOpen, setShapeDropdownOpen] = useState(false);
  const [color, setColor] = useState("#00877f");
  const [strokeWidth, setStrokeWidth] = useState(2); // default thin (2px)
  const [eraserSize, setEraserSize] = useState(36); // default medium eraser (36px)
  const [eraserCursor, setEraserCursor] = useState({ visible: false, x: 0, y: 0 });
  const [history, setHistory] = useState([]);
  const [stickyNotes, setStickyNotes] = useState([
    { id: 1, text: "Design review\nOwner: Dawan", color: "#fef08a", x: 60, y: 80, width: 150 },
    { id: 2, text: "Beta release\n15 Nov", color: "#fbcfe8", x: 260, y: 80, width: 140 },
    { id: 3, text: "QA sign-off\nOwner: Jhanavi", color: "#a7f3d0", x: 450, y: 80, width: 150 },
    { id: 4, text: "Go live\n30 Nov", color: "#fed7aa", x: 650, y: 80, width: 140 },
  ]);
  const [boardTitle, setBoardTitle] = useState("Q4 Launch Plan");

  // Save canvas state to undo stack
  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    setHistory((prev) => [...prev.slice(-20), dataUrl]);
  }, []);

  function drawQ4Template(ctx, w, h) {
    if (!ctx) return;
    ctx.save();
    // Title
    ctx.font = "bold 22px Inter, sans-serif";
    ctx.fillStyle = "#00877f";
    ctx.fillText("Q4 Launch Plan", 50, 48);

    // Title underline
    ctx.beginPath();
    ctx.strokeStyle = "#ef510f";
    ctx.lineWidth = 3;
    ctx.moveTo(50, 56);
    ctx.lineTo(210, 56);
    ctx.stroke();

    // Arrows between cards
    const arrows = [
      { from: 215, to: 255, y: 120 },
      { from: 405, to: 445, y: 120 },
      { from: 605, to: 645, y: 120 },
    ];
    arrows.forEach(({ from, to, y }) => {
      ctx.beginPath();
      ctx.strokeStyle = "#00877f";
      ctx.lineWidth = 2.5;
      ctx.moveTo(from, y);
      ctx.lineTo(to, y);
      ctx.lineTo(to - 7, y - 6);
      ctx.moveTo(to, y);
      ctx.lineTo(to - 7, y + 6);
      ctx.stroke();
    });

    // Risks box (bottom left)
    const rx = 50, ry = 230, rw = 240, rh = 130;
    ctx.strokeStyle = "#ef510f";
    ctx.lineWidth = 2;
    ctx.strokeRect(rx, ry, rw, rh);
    ctx.font = "bold 15px Inter, sans-serif";
    ctx.fillStyle = "#ef510f";
    ctx.fillText("Risks", rx + 14, ry + 26);
    ctx.font = "13px Inter, sans-serif";
    ctx.fillStyle = "#334155";
    ctx.fillText("• Vendor delay", rx + 14, ry + 54);
    ctx.fillText("• Load testing on mobile", rx + 14, ry + 78);
    ctx.fillText("• Caption accuracy", rx + 14, ry + 102);

    // Goal oval (bottom center)
    const gx = 460, gy = 295, grx = 95, gry = 48;
    ctx.beginPath();
    ctx.strokeStyle = "#00877f";
    ctx.lineWidth = 2.5;
    ctx.ellipse(gx, gy, grx, gry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = "bold 15px Inter, sans-serif";
    ctx.fillStyle = "#006a64";
    ctx.textAlign = "center";
    ctx.fillText("Goal: 10k", gx, gy - 4);
    ctx.font = "13px Inter, sans-serif";
    ctx.fillStyle = "#00877f";
    ctx.fillText("beta users", gx, gy + 16);
    ctx.textAlign = "start";

    ctx.restore();
  }

  // Initialize and resize canvas
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.floor(rect.width * dpr) || canvas.height !== Math.floor(rect.height * dpr)) {
      const prevData = canvas.toDataURL();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      const ctx = canvas.getContext("2d");
      ctx.scale(dpr, dpr);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      if (prevData && prevData.length > 100) {
        img.src = prevData;
      } else {
        drawQ4Template(ctx, rect.width, rect.height);
      }
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(initCanvas, 50);
    window.addEventListener("resize", initCanvas);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", initCanvas);
    };
  }, [isOpen, initCanvas]);

  // Coordinate helper
  function getCoordinates(event) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }

  function startDrawing(e) {
    if (e.button && e.button !== 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    saveState();
    isDrawing.current = true;
    const { x, y } = getCoordinates(e);
    startCoord.current = { x, y };

    const ctx = canvas.getContext("2d");

    if (tool === "shape") {
      // Snapshot current canvas state to offscreen buffer for smooth live preview
      if (!offscreenCanvasRef.current) {
        offscreenCanvasRef.current = document.createElement("canvas");
      }
      const off = offscreenCanvasRef.current;
      off.width = canvas.width;
      off.height = canvas.height;
      const offCtx = off.getContext("2d");
      offCtx.clearRect(0, 0, off.width, off.height);
      offCtx.drawImage(canvas, 0, 0);
      return;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);

    if (tool === "eraser") {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = eraserSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalAlpha = 1;
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (tool === "highlighter") {
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth * 4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalAlpha = 0.35;
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalAlpha = 1;
    }
  }

  function draw(e) {
    const { x, y } = getCoordinates(e);

    if (tool === "eraser") {
      setEraserCursor({ visible: true, x, y });
    } else if (eraserCursor.visible) {
      setEraserCursor((prev) => ({ ...prev, visible: false }));
    }

    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    if (tool === "shape") {
      if (!offscreenCanvasRef.current) return;
      // Restore previous state from offscreen
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(offscreenCanvasRef.current, 0, 0);
      ctx.restore();

      // Render shape preview with selected thickness and color
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.fillStyle = "transparent";

      const sx = startCoord.current.x;
      const sy = startCoord.current.y;
      const w = x - sx;
      const h = y - sy;

      if (shapeType === "rectangle") {
        ctx.beginPath();
        ctx.strokeRect(sx, sy, w, h);
      } else if (shapeType === "square") {
        const side = Math.max(Math.abs(w), Math.abs(h));
        const sw = w >= 0 ? side : -side;
        const sh = h >= 0 ? side : -side;
        ctx.beginPath();
        ctx.strokeRect(sx, sy, sw, sh);
      } else if (shapeType === "circle") {
        const rx = Math.abs(w) / 2;
        const ry = Math.abs(h) / 2;
        const cx = sx + w / 2;
        const cy = sy + h / 2;
        const r = Math.max(rx, ry);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      } else if (shapeType === "triangle") {
        ctx.beginPath();
        ctx.moveTo(sx + w / 2, sy);
        ctx.lineTo(sx + w, sy + h);
        ctx.lineTo(sx, sy + h);
        ctx.closePath();
        ctx.stroke();
      } else if (shapeType === "line") {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else if (shapeType === "arrow") {
        const angle = Math.atan2(h, w);
        const headLen = Math.max(14, strokeWidth * 2.5);
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(x, y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(
          x - headLen * Math.cos(angle - Math.PI / 6),
          y - headLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(x, y);
        ctx.lineTo(
          x - headLen * Math.cos(angle + Math.PI / 6),
          y - headLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    if (tool === "eraser") {
      ctx.save();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = eraserSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.restore();
      return;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function stopDrawing() {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.closePath();
    ctx.globalAlpha = 1;
  }

  function handleUndo() {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    const rect = canvas.getBoundingClientRect();
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.drawImage(img, 0, 0, rect.width, rect.height);
    };
    img.src = last;
    if (onNotify) onNotify("Undo action", 660);
  }

  function handleClear() {
    saveState();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    if (onNotify) onNotify("Whiteboard canvas cleared", 520);
  }

  function handleLoadTemplate() {
    saveState();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    drawQ4Template(ctx, rect.width, rect.height);
    setStickyNotes([
      { id: 1, text: "Design review\nOwner: Dawan", color: "#fef08a", x: 60, y: 80, width: 150 },
      { id: 2, text: "Beta release\n15 Nov", color: "#fbcfe8", x: 260, y: 80, width: 140 },
      { id: 3, text: "QA sign-off\nOwner: Jhanavi", color: "#a7f3d0", x: 450, y: 80, width: 150 },
      { id: 4, text: "Go live\n30 Nov", color: "#fed7aa", x: 650, y: 80, width: 140 },
    ]);
    if (onNotify) onNotify("Q4 Launch Plan template loaded", 740);
  }

  function handleExport() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${boardTitle.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    if (onNotify) onNotify("Whiteboard image exported", 740);
  }

  function addStickyNote() {
    const id = Date.now();
    const colors = ["#fef08a", "#fbcfe8", "#a7f3d0", "#fed7aa", "#bae6fd"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    setStickyNotes((prev) => [
      ...prev,
      {
        id,
        text: "New note",
        color: randomColor,
        x: 100 + (prev.length * 20) % 300,
        y: 120 + (prev.length * 20) % 200,
        width: 140,
      },
    ]);
    if (onNotify) onNotify("Sticky note added", 740);
  }

  function updateStickyText(id, text) {
    setStickyNotes((prev) => prev.map((n) => (n.id === id ? { ...n, text } : n)));
  }

  function deleteSticky(id) {
    setStickyNotes((prev) => prev.filter((n) => n.id !== id));
  }

  const activeShapeObj = SHAPES.find((s) => s.id === shapeType) || SHAPES[0];

  if (!isOpen) return null;

  return (
    <div
      className="mr-whiteboard-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Interactive Meeting Whiteboard"
    >
      <div className="mr-whiteboard-card">
        {/* Header */}
        <header className="mr-whiteboard-header">
          <div className="mr-whiteboard-title-group">
            <span className="mr-whiteboard-icon-badge">
              <PenTool size={18} />
            </span>
            <div>
              <div className="mr-whiteboard-heading-row">
                <input
                  className="mr-whiteboard-title-input"
                  value={boardTitle}
                  onChange={(e) => setBoardTitle(e.target.value)}
                  placeholder="Whiteboard title"
                />
                <span className="mr-whiteboard-live-pill">
                  <i className="mr-live-dot" /> Collaborative
                </span>
              </div>
              <small className="mr-whiteboard-sub">
                Draw, collaborate, and brainstorm with participants in real time.
              </small>
            </div>
          </div>

          <div className="mr-whiteboard-header-actions">
            <button
              type="button"
              className="mr-wb-btn"
              onClick={handleLoadTemplate}
              title="Reset to Q4 Launch Plan diagram"
            >
              <LayoutTemplate size={14} /> Template
            </button>
            <button
              type="button"
              className="mr-wb-btn"
              onClick={handleExport}
              title="Export as PNG image"
            >
              <Download size={14} /> Export
            </button>
            <button
              type="button"
              className="mr-wb-btn danger"
              onClick={handleClear}
              title="Clear all drawings"
            >
              <Trash2 size={14} /> Clear
            </button>
            <button
              type="button"
              className="mr-wb-close-btn"
              onClick={onClose}
              aria-label="Close whiteboard"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* Toolbar Bar */}
        <div className="mr-whiteboard-toolbar">
          {/* Main Drawing Tools */}
          <div className="mr-wb-tool-group">
            <button
              type="button"
              className={`mr-wb-tool ${tool === "pen" ? "active" : ""}`}
              onClick={() => {
                setTool("pen");
                setShapeDropdownOpen(false);
              }}
              title="Pen tool"
            >
              <PenTool size={16} /> Pen
            </button>
            <button
              type="button"
              className={`mr-wb-tool ${tool === "highlighter" ? "active" : ""}`}
              onClick={() => {
                setTool("highlighter");
                setShapeDropdownOpen(false);
              }}
              title="Highlighter"
            >
              <Highlighter size={16} /> Highlight
            </button>
            <button
              type="button"
              className={`mr-wb-tool ${tool === "eraser" ? "active" : ""}`}
              onClick={() => {
                setTool("eraser");
                setShapeDropdownOpen(false);
              }}
              title="Eraser"
            >
              <Eraser size={16} /> Eraser
            </button>

            {/* Shapes Tool Dropdown */}
            <div className="mr-wb-dropdown-wrap">
              <button
                type="button"
                className={`mr-wb-tool mr-wb-shapes-btn ${tool === "shape" ? "active" : ""}`}
                onClick={() => {
                  setTool("shape");
                  setShapeDropdownOpen((v) => !v);
                }}
                title="Shapes (Rectangle, Square, Circle, Triangle, Line, Arrow)"
                aria-haspopup="true"
                aria-expanded={shapeDropdownOpen}
              >
                <Shapes size={16} />
                <span>Shapes</span>
                <ChevronDown size={12} className={`mr-wb-chevron ${shapeDropdownOpen ? "open" : ""}`} />
              </button>

              {shapeDropdownOpen && (
                <div className="mr-wb-shapes-menu" role="menu">
                  <div className="mr-wb-shapes-menu-title">Select Shape</div>
                  <div className="mr-wb-shapes-grid">
                    {SHAPES.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        role="menuitem"
                        className={`mr-wb-shape-item ${shapeType === s.id && tool === "shape" ? "selected" : ""}`}
                        onClick={() => {
                          setShapeType(s.id);
                          setTool("shape");
                          setShapeDropdownOpen(false);
                          if (onNotify) onNotify(`Selected shape: ${s.name}`, 660);
                        }}
                        title={s.name}
                      >
                        <span className="mr-wb-shape-icon">{s.icon}</span>
                        <span className="mr-wb-shape-name">{s.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* If shape tool is active, show the active shape indicator */}
            {tool === "shape" && (
              <span className="mr-wb-active-shape-pill" title={`Active shape: ${activeShapeObj.name}`}>
                {activeShapeObj.icon}
                <small>{activeShapeObj.name}</small>
              </span>
            )}

            <button
              type="button"
              className="mr-wb-tool"
              onClick={addStickyNote}
              title="Add Sticky Note"
            >
              <StickyNote size={16} /> + Note
            </button>
          </div>

          <div className="mr-wb-divider" />

          {/* Eraser Thickness Options (visible when eraser is active) */}
          {tool === "eraser" && (
            <>
              <div className="mr-wb-eraser-sizes" title="Adjust eraser thickness">
                <span className="mr-wb-size-label">Eraser size:</span>
                {ERASER_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={`mr-wb-eraser-size-btn ${eraserSize === size ? "active" : ""}`}
                    onClick={() => setEraserSize(size)}
                    title={`Eraser size: ${size}px`}
                    aria-label={`Eraser size: ${size}px`}
                  >
                    <span
                      className="mr-wb-eraser-dot"
                      style={{
                        width: `${Math.round(size / 2.4)}px`,
                        height: `${Math.round(size / 2.4)}px`,
                      }}
                    />
                  </button>
                ))}
              </div>
              <div className="mr-wb-divider" />
            </>
          )}

          {/* Color Palette (hidden when eraser is active) */}
          {tool !== "eraser" && (
            <>
              <div className="mr-wb-color-group" title="Stroke color">
                {COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    className={`mr-wb-color-dot ${color === c.hex ? "selected" : ""}`}
                    style={{ backgroundColor: c.hex }}
                    onClick={() => setColor(c.hex)}
                    aria-label={c.name}
                  >
                    {color === c.hex && <Check size={11} color="#fff" />}
                  </button>
                ))}
              </div>
              <div className="mr-wb-divider" />
            </>
          )}

          {/* Horizontal Line Previews for Stroke Thickness (replaces "Thin", "Medium", "Thick") */}
          <div className="mr-wb-line-group" role="radiogroup" aria-label="Stroke thickness">
            {STROKE_WIDTHS.map((width) => (
              <button
                key={width}
                type="button"
                className={`mr-wb-line-btn ${strokeWidth === width ? "active" : ""}`}
                onClick={() => setStrokeWidth(width)}
                aria-label={`Stroke thickness ${width}px`}
                title={`Stroke thickness: ${width}px`}
              >
                <span
                  className="mr-wb-line-preview"
                  style={{
                    height: `${width}px`,
                    backgroundColor: tool === "eraser" ? "#475569" : color,
                  }}
                />
              </button>
            ))}
          </div>

          <div className="mr-wb-divider" />

          {/* Undo */}
          <button
            type="button"
            className="mr-wb-tool"
            onClick={handleUndo}
            disabled={history.length === 0}
            title="Undo"
          >
            <RotateCcw size={15} /> Undo
          </button>
        </div>

        {/* Canvas Workspace */}
        <div className="mr-whiteboard-stage">
          <canvas
            ref={canvasRef}
            className={`mr-whiteboard-canvas ${tool === "eraser" ? "is-eraser-mode" : ""}`}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={(e) => {
              setEraserCursor((prev) => ({ ...prev, visible: false }));
              stopDrawing();
            }}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />

          {/* Floating visual eraser cursor showing actual eraser diameter */}
          {tool === "eraser" && eraserCursor.visible && (
            <div
              className="mr-wb-eraser-cursor-ring"
              style={{
                left: `${eraserCursor.x}px`,
                top: `${eraserCursor.y}px`,
                width: `${eraserSize}px`,
                height: `${eraserSize}px`,
              }}
            />
          )}

          {/* Draggable/Editable Sticky Notes */}
          {stickyNotes.map((note) => (
            <div
              key={note.id}
              className="mr-sticky-note"
              style={{
                left: `${note.x}px`,
                top: `${note.y}px`,
                backgroundColor: note.color,
                width: `${note.width}px`,
              }}
            >
              <div className="mr-sticky-header">
                <span className="mr-sticky-pin" />
                <button
                  type="button"
                  className="mr-sticky-delete"
                  onClick={() => deleteSticky(note.id)}
                  title="Delete note"
                >
                  <X size={12} />
                </button>
              </div>
              <textarea
                className="mr-sticky-textarea"
                value={note.text}
                onChange={(e) => updateStickyText(note.id, e.target.value)}
                placeholder="Type note..."
                rows={3}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
