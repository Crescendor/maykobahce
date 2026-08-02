import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  RotateCcw,
  Trash2,
  Check,
  Paintbrush,
  PaintBucket,
  PenTool,
  Highlighter,
  Eraser,
  Sparkles,
  Layers,
  Sliders
} from 'lucide-react';
import { drawSmoothStroke, drawStem } from '../utils/gardenEngine';

const COLOR_PRESETS = [
  '#FF4D6D', '#FF758F', '#FFB3C6', '#FFB703', '#FB8500',
  '#9D4EDD', '#7209B7', '#4CC9F0', '#06D6A0', '#10B981',
  '#3B82F6', '#6366F1', '#EC4899', '#8B5CF6', '#FFFFFF', '#000000'
];

export default function ProDrawPadModal({ isOpen, onClose, initialStrokes, onSaveStrokes }) {
  const canvasRef = useRef(null);
  const [strokes, setStrokes] = useState([]);
  const [currentStroke, setCurrentStroke] = useState(null);

  // Tools & Options
  const [activeTool, setActiveTool] = useState('brush'); // 'brush', 'pen', 'highlighter', 'spray', 'eraser'
  const [color, setColor] = useState('#FF4D6D');
  const [brushSize, setBrushSize] = useState(8);
  const [opacity, setOpacity] = useState(1);
  const [pressureEnabled, setPressureEnabled] = useState(true);

  // Initialize canvas and load initial strokes
  useEffect(() => {
    if (isOpen) {
      setStrokes(initialStrokes || []);
      setCurrentStroke(null);
      setTimeout(() => redrawCanvas(initialStrokes || []), 50);
    }
  }, [isOpen, initialStrokes]);

  // Redraw Canvas
  const redrawCanvas = (strokesToDraw) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Stem & Leaf Anchor starting from bottom edge (300, 600)
    ctx.save();
    ctx.translate(300, 600);
    drawStem(ctx, 'classic', '#52b788', 2);
    ctx.restore();

    // Render Strokes
    strokesToDraw.forEach((s) => {
      drawSmoothStroke(ctx, s);
    });
  };

  // Canvas Coordinate Mapping
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    
    // Read pressure if available (stylus/Apple Pencil)
    let pressure = 1;
    if (pressureEnabled && e.pressure && e.pressure > 0) {
      pressure = e.pressure;
    }
    return { x, y, pressure };
  };

  // Pointer Down (Supports Mouse, Touch, Stylus DrawPad)
  const handlePointerDown = (e) => {
    e.preventDefault();
    canvasRef.current.setPointerCapture(e.pointerId);

    const pt = getCanvasCoords(e);
    const calculatedSize = Math.max(2, Math.round(brushSize * (pt.pressure || 1)));

    let strokeColor = color;
    let strokeOpacity = opacity;
    let toolType = activeTool;

    if (activeTool === 'bucket') {
      const fillAction = { type: 'fill', x: pt.x, y: pt.y, color: color };
      const updatedStrokes = [...strokes, fillAction];
      setStrokes(updatedStrokes);
      redrawCanvas(updatedStrokes);
      return;
    }

    const newStroke = {
      tool: toolType,
      color: strokeColor,
      size: calculatedSize,
      opacity: strokeOpacity,
      points: [{ x: pt.x, y: pt.y }]
    };

    setCurrentStroke(newStroke);
    redrawCanvas([...strokes, newStroke]);
  };

  // Pointer Move
  const handlePointerMove = (e) => {
    if (!currentStroke) return;
    e.preventDefault();

    const pt = getCanvasCoords(e);

    // If Spray Tool: generate particles around point
    if (activeTool === 'spray') {
      const sprayPoints = [];
      const density = Math.round(brushSize * 2);
      for (let i = 0; i < density; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * brushSize;
        sprayPoints.push({
          x: pt.x + Math.cos(angle) * radius,
          y: pt.y + Math.sin(angle) * radius
        });
      }
      const updatedStroke = {
        ...currentStroke,
        points: [...currentStroke.points, ...sprayPoints]
      };
      setCurrentStroke(updatedStroke);
      redrawCanvas([...strokes, updatedStroke]);
      return;
    }

    const updatedStroke = {
      ...currentStroke,
      points: [...currentStroke.points, { x: pt.x, y: pt.y }]
    };
    setCurrentStroke(updatedStroke);
    redrawCanvas([...strokes, updatedStroke]);
  };

  // Pointer Up
  const handlePointerUp = (e) => {
    if (!currentStroke) return;
    try {
      canvasRef.current.releasePointerCapture(e.pointerId);
    } catch (err) {}

    const updatedStrokes = [...strokes, currentStroke];
    setStrokes(updatedStrokes);
    setCurrentStroke(null);
    redrawCanvas(updatedStrokes);
  };

  const handleUndo = () => {
    const updated = strokes.slice(0, -1);
    setStrokes(updated);
    redrawCanvas(updated);
  };

  const handleClear = () => {
    setStrokes([]);
    redrawCanvas([]);
  };

  const handleSave = () => {
    // Standardize coordinates to 300x300 scale for flower drawer rendering compatibility
    const scaledStrokes = strokes.map((s) => ({
      ...s,
      points: s.points.map((p) => ({
        x: p.x / 2,
        y: p.y / 2
      })),
      size: Math.max(2, Math.round(s.size / 2))
    }));

    onSaveStrokes(scaledStrokes);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} className="animate-fade-in">
      <div style={styles.proModalCard} className="glass-card-light animate-slide-up">
        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={24} color="#f59e0b" />
            <div>
              <h2 style={styles.title}>🎨 Pro DrawPad Çizim Stüdyosu</h2>
              <p style={styles.subtitle}>Çizim tableti, dokunmatik ve stylus kalemi destekli gelişmiş tuval</p>
            </div>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Studio Workspace */}
        <div style={styles.studioBody}>
          {/* Sidebar Tools */}
          <div style={styles.toolSidebar}>
            <p style={styles.sidebarSectionTitle}>Çizim Aracı</p>
            
            <button
              style={{ ...styles.toolBtn, ...(activeTool === 'brush' ? styles.activeToolBtn : {}) }}
              onClick={() => setActiveTool('brush')}
              title="Fırça (Standart)"
            >
              <Paintbrush size={18} /> Fırça
            </button>

            <button
              style={{ ...styles.toolBtn, ...(activeTool === 'bucket' ? styles.activeToolBtn : {}) }}
              onClick={() => setActiveTool('bucket')}
              title="Boya Kovası (Doldur)"
            >
              <PaintBucket size={18} /> Doldur (Kova)
            </button>

            <button
              style={{ ...styles.toolBtn, ...(activeTool === 'pen' ? styles.activeToolBtn : {}) }}
              onClick={() => setActiveTool('pen')}
              title="İnce Kalem"
            >
              <PenTool size={18} /> Kalem
            </button>

            <button
              style={{ ...styles.toolBtn, ...(activeTool === 'highlighter' ? styles.activeToolBtn : {}) }}
              onClick={() => setActiveTool('highlighter')}
              title="Fosforlu Kalem"
            >
              <Highlighter size={18} /> Fosforlu
            </button>

            <button
              style={{ ...styles.toolBtn, ...(activeTool === 'spray' ? styles.activeToolBtn : {}) }}
              onClick={() => setActiveTool('spray')}
              title="Sprey / Airbrush"
            >
              <Sparkles size={18} /> Sprey
            </button>

            <button
              style={{ ...styles.toolBtn, ...(activeTool === 'eraser' ? styles.activeToolBtn : {}) }}
              onClick={() => setActiveTool('eraser')}
              title="Silgi"
            >
              <Eraser size={18} /> Silgi
            </button>

            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '10px 0' }} />

            {/* Fırça Boyutu Slider */}
            <div style={styles.sliderGroup}>
              <label style={styles.sliderLabel}>Fırça Kalınlığı: <strong>{brushSize}px</strong></label>
              <input
                type="range"
                min="1"
                max="50"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#10b981' }}
              />
            </div>

            {/* Şeffaflık Slider */}
            <div style={styles.sliderGroup}>
              <label style={styles.sliderLabel}>Opaklık: <strong>{Math.round(opacity * 100)}%</strong></label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#10b981' }}
              />
            </div>

            {/* Stylus Basınç Hassasiyeti */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', cursor: 'pointer', marginTop: 6 }}>
              <input
                type="checkbox"
                checked={pressureEnabled}
                onChange={(e) => setPressureEnabled(e.target.checked)}
                style={{ accentColor: '#10b981' }}
              />
              <span>Kalem/Dokunuş Basınç Hassasiyeti</span>
            </label>
          </div>

          {/* Main High-Res Canvas Area */}
          <div style={styles.canvasCol}>
            <div style={styles.canvasFrame}>
              <canvas
                ref={canvasRef}
                width={600}
                height={600}
                style={styles.proCanvas}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              />
            </div>

            {/* Color Palette Bar */}
            <div style={styles.colorBar}>
              <div style={styles.customColorPickerWrapper}>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  style={styles.nativeColorInput}
                  title="Özel Renk Seçin"
                />
              </div>

              <div style={styles.paletteScroll}>
                {COLOR_PRESETS.map((c) => (
                  <div
                    key={c}
                    className={`color-swatch ${color === c ? 'active' : ''}`}
                    style={{ backgroundColor: c, width: 28, height: 28 }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={styles.footer}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn-secondary" onClick={handleUndo}>
              <RotateCcw size={16} /> Geri Al
            </button>
            <button type="button" className="btn-secondary" onClick={handleClear}>
              <Trash2 size={16} /> Temizle
            </button>
          </div>

          <button type="button" className="btn-primary" onClick={handleSave}>
            <Check size={18} /> Çizimi Tamamla ve Çiçeğe Aktar
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(10, 25, 15, 0.85)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1300,
    padding: 12
  },
  proModalCard: {
    width: '100%',
    maxWidth: 920,
    maxHeight: '96vh',
    borderRadius: 24,
    padding: 20,
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderBottom: '1px solid rgba(0,0,0,0.08)',
    paddingBottom: 10
  },
  title: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.35rem',
    fontWeight: 800,
    color: '#0f172a'
  },
  subtitle: {
    fontSize: '0.8rem',
    color: '#64748b'
  },
  closeBtn: {
    background: 'rgba(0,0,0,0.05)',
    border: 'none',
    width: 36,
    height: 36,
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  studioBody: {
    display: 'grid',
    gridTemplateColumns: '220px 1fr',
    gap: 16,
    alignItems: 'center',
    overflowY: 'auto'
  },
  toolSidebar: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 18,
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },
  sidebarSectionTitle: {
    fontSize: '0.78rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: '#64748b',
    letterSpacing: 0.5
  },
  toolBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 12px',
    borderRadius: 12,
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    color: '#334155',
    fontSize: '0.88rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  activeToolBtn: {
    background: '#10b981',
    color: '#ffffff',
    borderColor: '#059669',
    boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)'
  },
  sliderGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4
  },
  sliderLabel: {
    fontSize: '0.8rem',
    color: '#334155'
  },
  canvasCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12
  },
  canvasFrame: {
    width: '100%',
    maxWidth: 480,
    aspectRatio: '1 / 1',
    borderRadius: 20,
    overflow: 'hidden',
    background: 'linear-gradient(180deg, #d8f3dc 0%, #b7e4c7 100%)',
    border: '2px dashed #52b788',
    touchAction: 'none'
  },
  proCanvas: {
    width: '100%',
    height: '100%',
    touchAction: 'none',
    cursor: 'crosshair'
  },
  colorBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    maxWidth: 480
  },
  customColorPickerWrapper: {
    position: 'relative',
    width: 36,
    height: 36,
    borderRadius: '50%',
    overflow: 'hidden',
    border: '2px solid #ffffff',
    boxShadow: 'var(--shadow-sm)',
    flexShrink: 0
  },
  nativeColorInput: {
    position: 'absolute',
    top: -10,
    left: -10,
    width: 60,
    height: 60,
    border: 'none',
    cursor: 'pointer'
  },
  paletteScroll: {
    display: 'flex',
    gap: 6,
    overflowX: 'auto',
    padding: '4px 0'
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTop: '1px solid rgba(0,0,0,0.08)'
  }
};
