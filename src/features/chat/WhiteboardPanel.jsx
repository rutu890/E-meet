import { useEffect, useRef, useState, useCallback } from "react";
import {
  X, PenTool, Eraser, RotateCcw, Trash2, Download, StickyNote,
  Highlighter, Check, Sparkles, LayoutTemplate
} from "lucide-react";

const COLORS = [
  { name: "Teal", hex: "#00877f" },
  { name: "Orange", hex: "#ef510f" },
  { name: "Dark Ink", hex: "#1f2937" },
  { name: "Blue", hex: "#2563eb" },
  { name: "Purple", hex: "#7c3aed" },
  { name: "Green", hex: "#10b981" },
];

const STROKE_SIZES = [
  { label: "Thin", size: 2 },
  { label: "Medium", size: 4 },
  { label: "Thick", size: 8 },
];

export default function WhiteboardPanel({ isOpen, onClose, onNotify }) {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const [tool, setTool] = useState("pen"); // "pen" | "highlighter" | "eraser"
  const [color, setColor] = useState("#00877f");
  const [strokeWidth, setStrokeWidth] = useState(3);
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
    setHistory((prev) => [...prev.slice(-15), dataUrl]);
  }, []);

  // Initialize and resize canvas
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    // Keep canvas drawing buffer sized to DOM dimensions * DPR
    if (canvas.width !== Math.floor(rect.width * dpr) || canvas.height !== Math.floor(rect.height * dpr)) {
      // Save current content before resize
      const prevData = canvas.toDataURL();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      const ctx = canvas.getContext("2d");
      ctx.scale(dpr, dpr);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Restore previous or draw template
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
    saveState();
    isDrawing.current = true;
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);

    if (tool === "eraser") {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = strokeWidth * 6;
      ctx.globalAlpha = 1;
    } else if (tool === "highlighter") {
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth * 4;
      ctx.globalAlpha = 0.35;
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.globalAlpha = 1;
    }
  }

  function draw(e) {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { x, y } = getCoordinates(e);
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
          <div className="mr-wb-tool-group">
            <button
              type="button"
              className={`mr-wb-tool ${tool === "pen" ? "active" : ""}`}
              onClick={() => setTool("pen")}
              title="Pen tool"
            >
              <PenTool size={16} /> Pen
            </button>
            <button
              type="button"
              className={`mr-wb-tool ${tool === "highlighter" ? "active" : ""}`}
              onClick={() => setTool("highlighter")}
              title="Highlighter"
            >
              <Highlighter size={16} /> Highlight
            </button>
            <button
              type="button"
              className={`mr-wb-tool ${tool === "eraser" ? "active" : ""}`}
              onClick={() => setTool("eraser")}
              title="Eraser"
            >
              <Eraser size={16} /> Eraser
            </button>
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

          {/* Color Palette */}
          <div className="mr-wb-color-group" title="Stroke color">
            {COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                className={`mr-wb-color-dot ${color === c.hex && tool !== "eraser" ? "selected" : ""}`}
                style={{ backgroundColor: c.hex }}
                onClick={() => {
                  setColor(c.hex);
                  if (tool === "eraser") setTool("pen");
                }}
                aria-label={c.name}
              >
                {color === c.hex && tool !== "eraser" && <Check size={11} color="#fff" />}
              </button>
            ))}
          </div>

          <div className="mr-wb-divider" />

          {/* Line widths */}
          <div className="mr-wb-size-group">
            {STROKE_SIZES.map((s) => (
              <button
                key={s.size}
                type="button"
                className={`mr-wb-size-btn ${strokeWidth === s.size ? "active" : ""}`}
                onClick={() => setStrokeWidth(s.size)}
              >
                <span
                  style={{
                    width: `${s.size * 2}px`,
                    height: `${s.size * 2}px`,
                    borderRadius: "50%",
                    background: color,
                  }}
                />
                <small>{s.label}</small>
              </button>
            ))}
          </div>

          <div className="mr-wb-divider" />

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
            className="mr-whiteboard-canvas"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />

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
