import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  RotateCcw,
  Trash2,
  Check,
  Copy,
  Lock,
  Sparkles,
  User,
  MessageSquare,
  Paintbrush,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Minus,
  Circle,
  Square,
  Palette
} from 'lucide-react';
import InstagramIcon from './InstagramIcon';
import SpecialGuestModal, { isSpecialGuest } from './SpecialGuestModal';
import confetti from 'canvas-confetti';
import {
  generate6CharPassword,
  generate8CharDeleteCode,
  formatInstagramHandle,
  drawSmoothStroke,
  performFloodFill,
  STEM_TYPES,
  STEM_COLORS,
  drawStem
} from '../utils/gardenEngine';

const FLORAL_COLORS = [
  '#FF4D6D', '#FF758F', '#FFB3C6', '#FFB703', '#FB8500',
  '#9D4EDD', '#7209B7', '#4CC9F0', '#06D6A0', '#FFFFFF', '#000000'
];

export const AI_FLOWER_SPECIES = [
  { key: 'random', label: '🎲 Tüm Türlerden Rastgele (Sürpriz)', icon: '✨' },
  { key: 'white_lily', label: '🌺 Barış Zambağı / Calla Lily', icon: '🌺' },
  { key: 'flower_cluster', label: '💐 Rengarenk Çiçek Buketi', icon: '💐' },
  { key: 'royal_orchid', label: '💜 Kraliyet Orkidesi', icon: '💜' },
  { key: 'cosmic_spiral', label: '🌌 Kozmik Galaksi Spirali', icon: '🌌' },
  { key: 'rose_cabbage', label: '🌹 Katmerli Gotik Gül', icon: '🌹' },
  { key: 'sakura_blossom', label: '🌸 Pembe Sakura Çiçeği', icon: '🌸' },
  { key: 'sunflower_giant', label: '🌻 Güneş Ayçiçeği / Papatya', icon: '🌻' },
  { key: 'water_lotus', label: '🪷 Kutsal Nilüfer / Lotus', icon: '🪷' },
  { key: 'hibiscus_tropical', label: '🌺 Tropikal Hibiskus', icon: '🌺' }
];

function generateAiFlowerStrokes(targetSpecies = 'random') {
  const cx = 150;
  const cy = 140;
  const strokes = [];

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const rand = (min, max) => min + Math.random() * (max - min);

  let chosenType = targetSpecies;
  if (chosenType === 'random') {
    const list = [
      'white_lily', 'flower_cluster', 'royal_orchid', 'cosmic_spiral',
      'rose_cabbage', 'sakura_blossom', 'sunflower_giant', 'water_lotus', 'hibiscus_tropical'
    ];
    chosenType = pick(list);
  }

  if (chosenType === 'white_lily') {
    // 🌺 Barış Zambağı / Calla Lily (White curved spathe, pink inner throat, twin golden stamen spikes & pollen)
    const spathePoints = [];
    for (let a = -1.2; a <= 1.2; a += 0.08) {
      const r = 85 * Math.cos(a * 0.7);
      const px = cx + Math.sin(a) * r;
      const py = cy - 20 - Math.cos(a) * r * 1.1;
      spathePoints.push({ x: px, y: py });
    }
    strokes.push({ points: spathePoints, color: '#FFFFFF', width: 14 });

    const throatPoints = [];
    for (let a = -0.8; a <= 0.8; a += 0.1) {
      const r = 45 * Math.cos(a);
      const px = cx + Math.sin(a) * r;
      const py = cy + 10 - Math.cos(a) * r * 0.8;
      throatPoints.push({ x: px, y: py });
    }
    strokes.push({ points: throatPoints, color: pick(['#FF758F', '#FFB3C6']), width: 12 });

    for (let offset of [-12, 12]) {
      const spikePoints = [];
      for (let t = 0; t <= 1; t += 0.1) {
        const px = cx + offset + Math.sin(t * Math.PI) * 4;
        const py = cy + 20 - t * 65;
        spikePoints.push({ x: px, y: py });
      }
      strokes.push({ points: spikePoints, color: '#FFB703', width: 10 });

      for (let dotY = cy - 40; dotY <= cy + 10; dotY += 12) {
        strokes.push({
          points: [{ x: cx + offset + rand(-3, 3), y: dotY }],
          color: '#FB8500',
          width: 10
        });
      }
    }

    strokes.push({
      points: [{ x: cx - 20, y: cy + 30 }, { x: cx - 35, y: cy + 20 }, { x: cx - 20, y: cy + 10 }],
      color: '#06D6A0',
      width: 8
    });

  } else if (chosenType === 'flower_cluster') {
    // 💐 Rengarenk Çiçek Buketi (Layered blooms on swirling vine with floating pollen)
    const vinePoints = [];
    for (let t = 0; t <= Math.PI * 2; t += 0.15) {
      const r = 40 + t * 12;
      const px = cx + Math.cos(t * 1.5) * r;
      const py = cy + Math.sin(t * 1.5) * r * 0.7;
      vinePoints.push({ x: px, y: py });
    }
    strokes.push({ points: vinePoints, color: '#FFFFFF', width: 8 });

    for (let layer = 3; layer >= 1; layer--) {
      const petals = 6;
      for (let p = 0; p < petals; p++) {
        const angle = (p * 2 * Math.PI) / petals + layer * 0.3;
        const points = [];
        const len = layer * 16;
        for (let t = 0; t <= 1; t += 0.1) {
          const r = t * len;
          const w = Math.sin(t * Math.PI) * 10;
          points.push({
            x: cx + Math.cos(angle) * r + Math.cos(angle + Math.PI / 2) * w,
            y: cy + 20 + Math.sin(angle) * r + Math.sin(angle + Math.PI / 2) * w
          });
        }
        strokes.push({ points, color: layer === 3 ? '#FF4D6D' : layer === 2 ? '#FF758F' : '#FFB703', width: 9 });
      }
    }

    for (let p = 0; p < 8; p++) {
      const angle = (p * 2 * Math.PI) / 8;
      strokes.push({
        points: [{ x: cx - 25, y: cy - 40 }, { x: cx - 25 + Math.cos(angle) * 22, y: cy - 40 + Math.sin(angle) * 22 }],
        color: '#FFB703',
        width: 8
      });
    }

    for (let i = 0; i < 18; i++) {
      const dotAngle = rand(0, Math.PI * 2);
      const dotDist = rand(30, 85);
      strokes.push({
        points: [{ x: cx + Math.cos(dotAngle) * dotDist, y: cy + Math.sin(dotAngle) * dotDist }],
        color: pick(['#FFB703', '#FFFFFF', '#4CC9F0', '#06D6A0']),
        width: rand(6, 11)
      });
    }

  } else if (chosenType === 'royal_orchid') {
    // 💜 Kraliyet Orkidesi (Purple wavy petals with crisp white outlines & golden stamen filaments)
    const petalColors = ['#7209B7', '#9D4EDD'];

    for (let p = 0; p < 5; p++) {
      const angle = (p * 2 * Math.PI) / 5 - Math.PI / 2;
      const len = rand(65, 85);
      const bodyPoints = [];
      for (let t = 0; t <= 1; t += 0.08) {
        const r = t * len;
        const wave = Math.sin(t * Math.PI * 2) * 12;
        bodyPoints.push({
          x: cx + Math.cos(angle) * r + Math.cos(angle + Math.PI / 2) * wave,
          y: cy + Math.sin(angle) * r + Math.sin(angle + Math.PI / 2) * wave
        });
      }
      strokes.push({ points: bodyPoints, color: petalColors[p % 2], width: 16 });

      const whiteBorder = bodyPoints.map((pt) => ({
        x: pt.x + Math.cos(angle + Math.PI / 2) * 4,
        y: pt.y + Math.sin(angle + Math.PI / 2) * 4
      }));
      strokes.push({ points: whiteBorder, color: '#FFFFFF', width: 6 });
    }

    for (let s = 0; s < 5; s++) {
      const sAngle = (s * 2 * Math.PI) / 5 - Math.PI / 2;
      const sLen = 45;
      const stamenPoints = [];
      for (let t = 0; t <= 1; t += 0.1) {
        const r = t * sLen;
        const curve = Math.sin(t * Math.PI) * 10;
        stamenPoints.push({
          x: cx + Math.cos(sAngle) * r + Math.cos(sAngle + Math.PI / 2) * curve,
          y: cy + Math.sin(sAngle) * r + Math.sin(sAngle + Math.PI / 2) * curve
        });
      }
      strokes.push({ points: stamenPoints, color: '#FFFFFF', width: 5 });
      const tipPt = stamenPoints[stamenPoints.length - 1];
      strokes.push({ points: [tipPt], color: '#FFB703', width: 10 });
    }

    for (let c = 0; c < 6; c++) {
      strokes.push({
        points: [{ x: cx + rand(-8, 8), y: cy + rand(-8, 8) }],
        color: '#FFB703',
        width: 9
      });
    }

  } else if (chosenType === 'cosmic_spiral') {
    // 🌌 Kozmik Galaksi Spirali (Pink/purple spiral core with floating swirl rings & dots)
    const spiralColors = ['#FF4D6D', '#9D4EDD', '#7209B7', '#4CC9F0', '#FFFFFF'];
    const spiralPoints = [];
    for (let a = 0; a <= Math.PI * 7; a += 0.2) {
      const r = (a / (Math.PI * 7)) * 75;
      spiralPoints.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
    }
    strokes.push({ points: spiralPoints, color: '#FF4D6D', width: 12 });

    const innerSpiral = [];
    for (let a = 0; a <= Math.PI * 5; a += 0.25) {
      const r = (a / (Math.PI * 5)) * 55;
      innerSpiral.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
    }
    strokes.push({ points: innerSpiral, color: '#9D4EDD', width: 8 });

    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const ringPoints = [];
      for (let a = 0; a <= Math.PI * 1.5; a += 0.2) {
        const r = 25 + a * 8;
        ringPoints.push({
          x: cx + Math.cos(angle) * 60 + Math.cos(a) * r,
          y: cy + Math.sin(angle) * 60 + Math.sin(a) * r
        });
      }
      strokes.push({ points: ringPoints, color: spiralColors[i % spiralColors.length], width: 7 });
    }

    for (let d = 0; d < 12; d++) {
      const dAngle = rand(0, Math.PI * 2);
      const dDist = rand(45, 95);
      strokes.push({
        points: [{ x: cx + Math.cos(dAngle) * dDist, y: cy + Math.sin(dAngle) * dDist }],
        color: pick(['#FFFFFF', '#4CC9F0', '#FFB703']),
        width: rand(7, 12)
      });
    }

  } else if (chosenType === 'rose_cabbage') {
    const layers = Math.floor(rand(5, 8));
    for (let layer = layers; layer >= 1; layer--) {
      const petals = layer * 3 + Math.floor(rand(0, 3));
      const radius = layer * 14 + rand(-2, 4);
      const color = pick(['#FF4D6D', '#7209B7', '#FF758F', '#9D4EDD']);
      const strokeW = 8 + layer * 2.5;

      for (let p = 0; p < petals; p++) {
        const baseAngle = (p * 2 * Math.PI) / petals + layer * 0.45;
        const points = [];
        const span = rand(0.6, 1.0);
        for (let a = -span; a <= span; a += 0.12) {
          const r = radius * (1 + 0.22 * Math.cos(a * (Math.PI / (span * 2))));
          const px = cx + Math.cos(baseAngle + a) * r;
          const py = cy + Math.sin(baseAngle + a) * r;
          points.push({ x: px, y: py });
        }
        strokes.push({ points, color, width: strokeW });
      }
    }
  } else if (chosenType === 'sakura_blossom') {
    const petals = 5;
    for (let p = 0; p < petals; p++) {
      const angle = (p * 2 * Math.PI) / petals - Math.PI / 2;
      const points = [];
      const len = rand(65, 80);
      for (let t = 0; t <= 1; t += 0.08) {
        const r = t * len;
        const w = Math.sin(t * Math.PI) * 22;
        points.push({
          x: cx + Math.cos(angle) * r + Math.cos(angle + Math.PI / 2) * w,
          y: cy + Math.sin(angle) * r + Math.sin(angle + Math.PI / 2) * w
        });
      }
      strokes.push({ points, color: p % 2 === 0 ? '#FFB3C6' : '#FF758F', width: 14 });
    }
    for (let f = 0; f < 8; f++) {
      const fAngle = (f * 2 * Math.PI) / 8;
      strokes.push({
        points: [{ x: cx, y: cy }, { x: cx + Math.cos(fAngle) * 25, y: cy + Math.sin(fAngle) * 25 }],
        color: '#FFFFFF',
        width: 4
      });
      strokes.push({
        points: [{ x: cx + Math.cos(fAngle) * 25, y: cy + Math.sin(fAngle) * 25 }],
        color: '#FFB703',
        width: 8
      });
    }
  } else if (chosenType === 'sunflower_giant') {
    const numPetals = 22;
    const petalLen = 85;
    for (let i = 0; i < numPetals; i++) {
      const angle = (i * 2 * Math.PI) / numPetals;
      const points = [];
      for (let t = 0; t <= 1; t += 0.1) {
        const dist = t * petalLen;
        const bulb = Math.sin(t * Math.PI) * 11;
        points.push({
          x: cx + Math.cos(angle) * dist + Math.cos(angle + Math.PI / 2) * bulb,
          y: cy + Math.sin(angle) * dist + Math.sin(angle + Math.PI / 2) * bulb
        });
      }
      strokes.push({ points, color: i % 2 === 0 ? '#FFB703' : '#FB8500', width: 11 });
    }
    const diskPoints = [];
    for (let a = 0; a <= Math.PI * 6; a += 0.25) {
      const r = (a / (Math.PI * 6)) * 24;
      diskPoints.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
    }
    strokes.push({ points: diskPoints, color: '#78350F', width: 10 });
  } else if (chosenType === 'water_lotus') {
    for (let layer = 3; layer >= 1; layer--) {
      const petals = 8;
      for (let p = 0; p < petals; p++) {
        const angle = (p * 2 * Math.PI) / petals + layer * 0.3;
        const points = [];
        const len = layer * 25;
        for (let t = 0; t <= 1; t += 0.08) {
          const r = t * len;
          const w = Math.sin(t * Math.PI) * 16;
          points.push({
            x: cx + Math.cos(angle) * r + Math.cos(angle + Math.PI / 2) * w,
            y: cy + Math.sin(angle) * r + Math.sin(angle + Math.PI / 2) * w
          });
        }
        strokes.push({ points, color: layer === 3 ? '#FF4D6D' : layer === 2 ? '#FF758F' : '#FFFFFF', width: 12 });
      }
    }
  } else {
    // 🌺 Tropikal Hibiskus
    const petals = 5;
    for (let p = 0; p < petals; p++) {
      const angle = (p * 2 * Math.PI) / petals;
      const points = [];
      const len = 80;
      for (let t = 0; t <= 1; t += 0.08) {
        const r = t * len;
        const w = Math.sin(t * Math.PI) * 24;
        points.push({
          x: cx + Math.cos(angle) * r + Math.cos(angle + Math.PI / 2) * w,
          y: cy + Math.sin(angle) * r + Math.sin(angle + Math.PI / 2) * w
        });
      }
      strokes.push({ points, color: pick(['#FF4D6D', '#FB8500', '#FF758F']), width: 16 });
    }
    const columnPoints = [];
    for (let t = 0; t <= 1; t += 0.1) {
      columnPoints.push({ x: cx + t * 45, y: cy - t * 45 });
    }
    strokes.push({ points: columnPoints, color: '#FFB703', width: 7 });

    for (let a = 0; a < 5; a++) {
      strokes.push({
        points: [{ x: cx + 45 + rand(-6, 6), y: cy - 45 + rand(-6, 6) }],
        color: '#FFFFFF',
        width: 8
      });
    }
  }

  // --- MATHEMATICAL ALIGNMENT TO STEM REFERENCE (y = 240) ---
  let maxY = -Infinity;
  strokes.forEach((s) => {
    s.points.forEach((p) => {
      if (p.y > maxY) maxY = p.y;
    });
  });

  if (Number.isFinite(maxY)) {
    const offsetY = 240 - maxY;
    strokes.forEach((s) => {
      s.points.forEach((p) => {
        p.y += offsetY;
      });
    });
  }

  return strokes;
}

export default function FlowerDrawerModal({ isOpen, onClose, onSaveFlower, targetPosition }) {
  const canvasRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const previewCanvasRefStep3 = useRef(null);

  // Stepper State (Step 1 = Draw, Step 2 = Stem & Info Form, Step 3 = Moderation Agreement Screen)
  const [step, setStep] = useState(1);

  // Stem Selection State (Selected in Step 2)
  const [selectedStemType, setSelectedStemType] = useState('classic');
  const [selectedStemColor, setSelectedStemColor] = useState('#52b788');

  // Drawing Tools State
  const [currentColor, setCurrentColor] = useState('#FF4D6D');
  const [brushSize, setBrushSize] = useState(12);
  const [activeTool, setActiveTool] = useState('brush'); // 'brush' | 'line' | 'circle' | 'rect'
  const [isFilled, setIsFilled] = useState(false);
  const [strokes, setStrokes] = useState([]);
  const [currentStroke, setCurrentStroke] = useState(null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const [selectedAiSpecies, setSelectedAiSpecies] = useState('random');

  const handleGenerateAiFlower = (targetSpecies = selectedAiSpecies) => {
    setIsAiGenerating(true);
    setTimeout(() => {
      const generated = generateAiFlowerStrokes(targetSpecies);
      setStrokes(generated);
      redrawCanvas(generated);
      setIsAiGenerating(false);
    }, 350);
  };

  // Form Fields
  const [name, setName] = useState('');
  const [instagram, setInstagram] = useState('');
  const [note, setNote] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [isModerationAgreed, setIsModerationAgreed] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  // Special guest flow
  const [showSpecialModal, setShowSpecialModal] = useState(false);
  const [realSender, setRealSender] = useState(null); // 'Ayşenur' | null
  const [pendingStep3, setPendingStep3] = useState(false);
  const [hasShownSpecial, setHasShownSpecial] = useState(false); // prevent repeated popups

  // Reset modal when opened
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setStrokes([]);
      setCurrentStroke(null);
      setName('');
      setInstagram('');
      setNote('');
      setIsAnonymous(false);
      setIsPrivate(false);
      setGeneratedPassword('');
      setCopiedPassword(false);
      setIsModerationAgreed(false);
      setErrorMsg('');
      setSelectedStemType('classic');
      setSelectedStemColor('#52b788');
      setShowSpecialModal(false);
      setRealSender(null);
      setPendingStep3(false);
      setHasShownSpecial(false);
      setTimeout(() => redrawCanvas([]), 50);
    }
  }, [isOpen]);

  // Real-time special guest detection: triggers as soon as matching name/instagram is typed
  useEffect(() => {
    let active = true;
    const checkSpecial = async () => {
      if (step === 2 && !isAnonymous && !hasShownSpecial && !showSpecialModal) {
        const isMatch = await isSpecialGuest(name, instagram);
        if (isMatch && active) {
          setShowSpecialModal(true);
          setHasShownSpecial(true);
        }
      }
    };
    checkSpecial();
    return () => { active = false; };
  }, [name, instagram, step, isAnonymous, hasShownSpecial, showSpecialModal]);
  // Redraw Unified Stem + Petal Preview Canvas on Step 2 and Step 3
  const drawPreviewOnCanvas = (canvasTarget) => {
    if (!canvasTarget) return;
    const ctx = canvasTarget.getContext('2d');
    ctx.clearRect(0, 0, canvasTarget.width, canvasTarget.height);

    const stemScale = 1.8;
    const stemHeight = 50 * stemScale; // 90px
    const rootX = 120;
    const rootY = 175;
    const topY = rootY - stemHeight; // 85px

    // 1. Draw Selected Stem
    ctx.save();
    ctx.translate(rootX, rootY);
    drawStem(ctx, selectedStemType, selectedStemColor, stemScale);
    ctx.restore();

    // 2. Draw User Petal Bloom resting on top tip of stem (petal base 150, 240)
    ctx.save();
    ctx.translate(rootX, topY);
    ctx.scale(0.46, 0.46);
    ctx.translate(-150, -240);

    strokes.forEach((s) => {
      drawSmoothStroke(ctx, s);
    });

    ctx.restore();
  };

  useEffect(() => {
    if (step === 2 && previewCanvasRef.current) {
      drawPreviewOnCanvas(previewCanvasRef.current);
    } else if (step === 3 && previewCanvasRefStep3.current) {
      drawPreviewOnCanvas(previewCanvasRefStep3.current);
    }
  }, [step, strokes, selectedStemType, selectedStemColor]);

  // Generate password when Private is toggled
  const handlePrivateToggle = (e) => {
    const checked = e.target.checked;
    setIsPrivate(checked);
    if (checked && !generatedPassword) {
      setGeneratedPassword(generate6CharPassword());
    }
  };

  // Copy 6-char Private Password
  const handleCopyPassword = () => {
    if (!generatedPassword) return;
    navigator.clipboard.writeText(generatedPassword);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  // Step 1 Pure Petal Canvas Redraw Logic
  const redrawCanvas = (strokesToDraw) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Reference Stem Tip Attachment Stub at Bottom Center (y = 240)
    ctx.save();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(150, 240);
    ctx.lineTo(150, 300);
    ctx.stroke();
    ctx.setLineDash([]);

    // Green Connection Anchor Point at y = 240
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(150, 240, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🌱 Sap Bağlantı Noktası', 150, 258);
    ctx.restore();

    // 2. Render User Petal Strokes
    strokesToDraw.forEach((s) => {
      drawSmoothStroke(ctx, s);
    });
  };

  // Canvas Pointer Coordinates
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const x = ((clientX - rect.left) / rect.width) * 300;
    const y = ((clientY - rect.top) / rect.height) * 300;
    return { x, y };
  };

  // Start Drawing Brush Stroke or Shape
  const handleStartDraw = (e) => {
    e.preventDefault();
    const pt = getCanvasCoords(e);
    const newStroke = {
      tool: activeTool,
      color: currentColor,
      size: brushSize,
      isFilled: isFilled,
      points: [pt, pt]
    };
    setCurrentStroke(newStroke);
    redrawCanvas([...strokes, newStroke]);
  };

  const handleMoveDraw = (e) => {
    if (!currentStroke) return;
    e.preventDefault();
    const pt = getCanvasCoords(e);

    let updatedPoints;
    if (activeTool === 'brush') {
      updatedPoints = [...currentStroke.points, pt];
    } else {
      updatedPoints = [currentStroke.points[0], pt];
    }

    const updatedStroke = {
      ...currentStroke,
      points: updatedPoints
    };
    setCurrentStroke(updatedStroke);
    redrawCanvas([...strokes, updatedStroke]);
  };

  const handleEndDraw = (e) => {
    if (!currentStroke) return;
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

  // Step 1 -> Step 2 Validation
  const handleProceedToStep2 = () => {
    setErrorMsg('');
    if (strokes.length === 0) {
      setErrorMsg('Lütfen önce çiçeğinizin taç yapraklarını çizin! 🌸');
      return;
    }
    setStep(2);
  };

  // Step 2 -> Step 3 Validation (special guest check already handled by useEffect)
  const handleProceedToStep3 = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isAnonymous && !name.trim()) {
      setErrorMsg('Lütfen isminizi girin veya anonim seçeneğini işaretleyin.');
      return;
    }

    // Check special guest ONLY if not anonymous and not yet shown
    if (!isAnonymous && !hasShownSpecial) {
      const isSpecial = await isSpecialGuest(name, instagram);
      if (isSpecial) {
        setShowSpecialModal(true);
        setHasShownSpecial(true);
        return;
      }
    }

    setStep(3);
  };

function b64(str) {
  try {
    return decodeURIComponent(
      atob(str)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch (e) {
    return str;
  }
}

  // Special guest chose anonymous
  const handleSpecialSendAnonymous = () => {
    const adjectives = ['Gizemli', 'Işıltılı', 'Neşeli', 'Sevimli', 'Sıcak'];
    const nouns = ['Yıldız', 'Çiçek', 'Peri', 'Rüzgar', 'Işık'];
    const randomName = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
    setName(randomName);
    setIsAnonymous(true);
    setRealSender(b64('QXnFn2VudXI='));
    setShowSpecialModal(false);
    setPendingStep3(false);
    // Stay on step 2 so user can enter note & pick stem
    setStep(2);
  };

  // Special guest chose to reveal as Ayşenur
  const handleSpecialSendAsAysenur = () => {
    setName(b64('QXnFn2VudXI='));
    setIsAnonymous(false);
    setRealSender(b64('QXnFn2VudXI='));
    setShowSpecialModal(false);
    setPendingStep3(false);
    // Stay on step 2 so user can enter note & pick stem
    setStep(2);
  };

  // Final Submit Handler (Step 3)
  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isModerationAgreed) {
      setErrorMsg('Lütfen devam etmek için moderasyon onay ve gizlilik şartını kabul ediniz. 🛡️');
      return;
    }

    const formattedIg = formatInstagramHandle(instagram);

    const newFlower = {
      id: `flower-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      x: targetPosition.x,
      y: targetPosition.y,
      name: isAnonymous ? 'Anonim' : name.trim(),
      instagram: isAnonymous ? '' : formattedIg,
      note: note.trim(),
      isAnonymous: isAnonymous,
      isPrivate: isPrivate,
      password: isPrivate ? generatedPassword : null,
      deleteCode: generate8CharDeleteCode(),
      createdAt: new Date().toISOString(),
      strokes: strokes,
      scale: 1,
      stemAngle: 0,
      stemType: selectedStemType,
      stemColor: selectedStemColor,
      // approved: realSender (Ayşenur) → auto-approve (1), others → pending (0)
      approved: realSender ? 1 : 0,
      realSender: realSender || null
    };

    try {
      confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });
    } catch (err) {}

    onSaveFlower(newFlower);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Special Guest Modal (Ayşenur/Lukac detection) */}
      <SpecialGuestModal
        isOpen={showSpecialModal}
        onClose={() => { setShowSpecialModal(false); setPendingStep3(false); }}
        detectedName={name}
        onSendAsAnonymous={handleSpecialSendAnonymous}
        onSendAsAysenur={handleSpecialSendAsAysenur}
      />

      <div style={styles.overlay} className="animate-fade-in">
      <div style={styles.modalCard} className="glass-card-light animate-slide-up">
        {/* Header with Stepper Progress */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>
              🌸 {step === 1 ? 'Adım 1: Taç Yaprak Çizimi' : step === 2 ? 'Adım 2: Sap Seçimi & Bilgiler' : 'Adım 3: Moderasyon & Kurallar'}
            </h2>
            <p style={styles.subtitle}>
              {step === 1
                ? 'Çiçeğinize özel taç yapraklarını çizin'
                : step === 2
                ? 'Sap türü ve not bilgilerinizi tamamlayın'
                : 'Topluluk ve moderasyon şartlarını onaylayın'}
            </p>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* STEP 1: Pure Petal Drawing Workspace */}
        {step === 1 && (
          <div style={styles.step1Container}>
            <div className="drawing-canvas-wrapper">
              <canvas
                ref={canvasRef}
                width={300}
                height={300}
                className="drawing-canvas"
                onMouseDown={handleStartDraw}
                onMouseMove={handleMoveDraw}
                onMouseUp={handleEndDraw}
                onTouchStart={handleStartDraw}
                onTouchMove={handleMoveDraw}
                onTouchEnd={handleEndDraw}
              />
            </div>

            {/* Drawing Tools & Shapes Selector */}
            <div style={styles.drawingToolRow}>
              <div style={styles.toolPillsGroup}>
                <button
                  type="button"
                  style={{ ...styles.toolBtn, ...(activeTool === 'brush' ? styles.activeToolBtn : {}) }}
                  onClick={() => setActiveTool('brush')}
                  title="Fırça (Serbest)"
                >
                  <Paintbrush size={14} /> Fırça
                </button>
                <button
                  type="button"
                  style={{ ...styles.toolBtn, ...(activeTool === 'line' ? styles.activeToolBtn : {}) }}
                  onClick={() => setActiveTool('line')}
                  title="Düz Çizgi"
                >
                  <Minus size={14} /> Çizgi
                </button>
                <button
                  type="button"
                  style={{ ...styles.toolBtn, ...(activeTool === 'circle' ? styles.activeToolBtn : {}) }}
                  onClick={() => setActiveTool('circle')}
                  title="Daire"
                >
                  <Circle size={14} /> Daire
                </button>
                <button
                  type="button"
                  style={{ ...styles.toolBtn, ...(activeTool === 'rect' ? styles.activeToolBtn : {}) }}
                  onClick={() => setActiveTool('rect')}
                  title="Kare"
                >
                  <Square size={14} /> Kare
                </button>

                {(activeTool === 'circle' || activeTool === 'rect') && (
                  <button
                    type="button"
                    style={{ ...styles.toolBtn, ...(isFilled ? styles.activeToolBtn : {}) }}
                    onClick={() => setIsFilled(!isFilled)}
                    title={isFilled ? 'İçi Dolu' : 'İçi Boş'}
                  >
                    {isFilled ? '🔳 Dolu' : '🔲 Boş'}
                  </button>
                )}
              </div>
            </div>

            {/* Thickness / Size Slider */}
            <div style={styles.thicknessRow}>
              <span style={{ fontSize: '0.76rem', color: '#475569', fontWeight: 700, minWidth: 64 }}>
                İncelik: {brushSize}px
              </span>
              <input
                type="range"
                min="2"
                max="36"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                style={{ flex: 1, accentColor: '#10b981', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', gap: 3 }}>
                {[4, 12, 24, 36].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setBrushSize(sz)}
                    style={{
                      ...styles.presetPill,
                      ...(brushSize === sz ? styles.activePresetPill : {})
                    }}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Petal Color Swatches + Custom Color Picker */}
            <div className="color-picker-grid" style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
              {FLORAL_COLORS.map((c) => (
                <div
                  key={c}
                  className={`color-swatch ${currentColor === c ? 'active' : ''}`}
                  style={{
                    backgroundColor: c,
                    border: c === '#FFFFFF' ? '1.5px solid #cbd5e1' : c === '#000000' ? '1.5px solid #334155' : 'none'
                  }}
                  onClick={() => setCurrentColor(c)}
                  title={c === '#000000' ? 'Siyah' : c}
                />
              ))}

              {/* Custom Color Picker Button */}
              <label
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: 'conic-gradient(from 0deg, red, yellow, lime, aqua, blue, magenta, red)',
                  border: '2px solid #ffffff',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                title="Özel Renk Seçici (Color Picker)"
              >
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) => setCurrentColor(e.target.value)}
                  style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                />
                <Palette size={15} color="#ffffff" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' }} />
              </label>
            </div>

            {/* AI Flower Species Selector & Generator Box */}
            <div style={styles.aiSpeciesBox}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Sparkles size={16} color="#ffd700" /> Yapay Zeka Çiçek Türü Seçin:
              </div>
              <select
                value={selectedAiSpecies}
                onChange={(e) => {
                  setSelectedAiSpecies(e.target.value);
                  handleGenerateAiFlower(e.target.value);
                }}
                style={styles.speciesSelect}
              >
                {AI_FLOWER_SPECIES.map((spec) => (
                  <option key={spec.key} value={spec.key} style={{ background: '#0f172a', color: '#f8fafc' }}>
                    {spec.icon} {spec.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => handleGenerateAiFlower(selectedAiSpecies)}
                disabled={isAiGenerating}
                style={styles.aiGenerateBtn}
              >
                <Sparkles size={18} color="#ffd700" />
                {isAiGenerating
                  ? 'Çiçek Çiziliyor...'
                  : `✨ ${AI_FLOWER_SPECIES.find((s) => s.key === selectedAiSpecies)?.label.split('/')[0] || 'Çiçek'} Üret / Değiştir`}
              </button>
            </div>

            {/* Action Buttons */}
            <div style={styles.canvasActions}>
              <button type="button" className="btn-secondary" onClick={handleUndo} style={styles.actionBtn}>
                <RotateCcw size={16} /> Geri Al
              </button>
              <button type="button" className="btn-secondary" onClick={handleClear} style={styles.actionBtn}>
                <Trash2 size={16} /> Temizle
              </button>
            </div>

            {errorMsg && <div style={styles.errorBanner}>{errorMsg}</div>}

            {/* Proceed to Step 2 Button */}
            <button
              type="button"
              className="btn-primary"
              onClick={handleProceedToStep2}
              style={{ width: '100%', marginTop: 14 }}
            >
              İlerle: Sap Seçimi ve Not Ekleyin <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* STEP 2: Stem Selection & Info Form */}
        {step === 2 && (
          <form onSubmit={handleProceedToStep3} style={styles.step2Container}>
            {/* Unified Flower + Stem Preview Header */}
            <div style={styles.flowerPreviewHeader}>
              <canvas ref={previewCanvasRef} width={240} height={200} />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setStep(1)}
                  style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                >
                  <ArrowLeft size={14} /> Taç Çizimini Düzenle
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleGenerateAiFlower}
                  disabled={isAiGenerating}
                  style={{ padding: '6px 14px', fontSize: '0.82rem', borderColor: '#a855f7', color: '#c084fc' }}
                >
                  <Sparkles size={14} color="#ffd700" /> Yapay Zekayla Yenile
                </button>
              </div>
            </div>

            {/* Stem Type Selector */}
            <div style={styles.stemSelectorWrapper}>
              <p style={styles.sectionLabel}>🌱 Sap Türü Seçin:</p>
              <div style={styles.stemPillsRow}>
                {STEM_TYPES.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    style={{
                      ...styles.stemPill,
                      ...(selectedStemType === st.id ? styles.activeStemPill : {})
                    }}
                    onClick={() => setSelectedStemType(st.id)}
                  >
                    <span>{st.icon}</span> {st.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Stem Color Selector */}
            <div style={styles.stemSelectorWrapper}>
              <p style={styles.sectionLabel}>🎨 Sap Rengi Seçin:</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', margin: '4px 0 14px 0' }}>
                {STEM_COLORS.map((sc) => (
                  <div
                    key={sc}
                    className={`color-swatch ${selectedStemColor === sc ? 'active' : ''}`}
                    style={{ backgroundColor: sc, width: 28, height: 28 }}
                    onClick={() => setSelectedStemColor(sc)}
                  />
                ))}
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '10px 0 16px 0' }} />

            {/* Anonymous Checkbox */}
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                style={styles.checkbox}
              />
              <span>Notumu ve adımı <strong>Anonim</strong> yap</span>
            </label>

            {/* Name Field */}
            {!isAnonymous && (
              <div className="form-group">
                <label className="form-label">
                  <User size={16} /> İsminiz
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder=""
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={35}
                />
              </div>
            )}

            {/* Instagram Field (Optional) */}
            {!isAnonymous && (
              <div className="form-group">
                <label className="form-label">
                  <InstagramIcon size={16} /> Instagram Hesabınız (İsteğe Bağlı)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="kullanici_adi (İsteğe bağlı)"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  maxLength={30}
                />
              </div>
            )}

            {/* Note Field */}
            <div className="form-group">
              <label className="form-label">
                <MessageSquare size={16} /> Çiçeğinize Not/Dilek Ekle
              </label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Bahçeye güzel bir dilek veya not bırakın..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={250}
              />
            </div>

            {/* Private Note Option & Auto Copyable Password */}
            <div style={styles.privateCard}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={handlePrivateToggle}
                  style={styles.checkbox}
                />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Lock size={16} color="#f59e0b" />
                  <strong>Gizli Not Olarak Paylaş</strong> (Otomatik Şifre Atanır)
                </span>
              </label>

              {isPrivate && generatedPassword && (
                <div className="animate-fade-in" style={{ marginTop: 8 }}>
                  <p style={styles.passwordHint}>
                    Çiçeğinize özel atanan 6 haneli erişim şifreniz:
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', margin: '6px 0' }}>
                    <div className="password-box" style={{ margin: 0 }}>{generatedPassword}</div>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}
                      onClick={handleCopyPassword}
                    >
                      {copiedPassword ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                      {copiedPassword ? 'Kopyalandı!' : 'Kopyala'}
                    </button>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#92400e', textAlign: 'center' }}>
                    🔑 Bu şifreyi kopyalayıp kaydedin. Notunuzu yalnızca bu şifreye sahip olanlar okuyabilir!
                  </p>
                </div>
              )}
            </div>

            {errorMsg && <div style={styles.errorBanner}>{errorMsg}</div>}

            {/* Proceed to Step 3 Button */}
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 10 }}>
              İlerle: Moderasyon ve Gizlilik Onayı <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* STEP 3: Dedicated Moderation & Rules Agreement Screen */}
        {step === 3 && (
          <form onSubmit={handleSubmit} style={styles.step2Container}>
            {/* Unified Flower + Stem Preview Header */}
            <div style={styles.flowerPreviewHeader}>
              <canvas ref={previewCanvasRefStep3} width={240} height={200} />
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setStep(2)}
                style={{ padding: '6px 14px', fontSize: '0.82rem', marginTop: 8 }}
              >
                <ArrowLeft size={14} /> Bilgileri Düzenle
              </button>
            </div>

            {/* Dedicated Moderation & Community Rules Disclaimer Card */}
            <div style={styles.moderationCard}>
              <div style={styles.moderationHeader}>
                <ShieldCheck size={22} color="#0284c7" />
                <h4 style={styles.moderationTitle}>🛡️ Moderasyon Kuralları & Gizlilik Garantisi</h4>
              </div>

              <div style={styles.moderationContent}>
                <p style={styles.moderationSubtitle}>
                  Çiçeğinizi bahçeye dikmeden önce lütfen aşağıdaki topluluk kurallarını okuyunuz:
                </p>
                <ul style={styles.moderationList}>
                  <li>
                    📌 <strong>Moderasyon İncelemesi:</strong> Eklenen çiçeklerin çizimleri ve açık notlar topluluk kuralları gereği <strong>moderasyon onayından</strong> geçmektedir.
                  </li>
                  <li>
                    🚫 <strong>Notlarda Yasak İçerikler:</strong> Açık notlarda müstehcen ifadeler, cinsel içerik, kişisel hakaret, küfür veya taciz içeren mesajlar <strong>onaylanmaz ve silinir</strong>.
                  </li>
                  <li>
                    🎨 <strong>Çizimlerde Yasak İçerikler:</strong> Müstehcen, cinsel imalı, ırkçı veya topluluğa uygun olmayan çizimler <strong>moderasyondan geçmez</strong>.
                  </li>
                  <li>
                    🔒 <strong>Gizli Not Güvencesi:</strong> Şifre ile kilitlenen gizli notların içeriği <strong>moderasyon ekibi dahil hiç kimse tarafından görüntülenemez</strong> (uçtan uca gizlidir).
                  </li>
                </ul>
              </div>

              <label style={styles.moderationCheckLabel}>
                <input
                  type="checkbox"
                  checked={isModerationAgreed}
                  onChange={(e) => setIsModerationAgreed(e.target.checked)}
                  style={styles.checkbox}
                />
                <span><strong>Yukarıdaki moderasyon kurallarını ve gizlilik garantisini okudum, kabul ediyorum.</strong></span>
              </label>
            </div>

            {errorMsg && <div style={styles.errorBanner}>{errorMsg}</div>}

            {/* Final Submit Button */}
            <button
              type="submit"
              className="btn-primary"
              style={{
                width: '100%',
                marginTop: 10,
                opacity: isModerationAgreed ? 1 : 0.6
              }}
            >
              <Sparkles size={18} /> Çiçeği Bahçeye Dik
            </button>
          </form>
        )}
      </div>
    </div>
    </>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(10, 25, 15, 0.75)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 16
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '92vh',
    overflowY: 'auto',
    borderRadius: 24,
    padding: 24
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottom: '1px solid rgba(0,0,0,0.08)',
    paddingBottom: 12
  },
  title: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.3rem',
    fontWeight: 700,
    color: '#0f172a'
  },
  subtitle: {
    fontSize: '0.82rem',
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
  step1Container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  drawingToolRow: {
    width: '100%',
    marginTop: 10,
    marginBottom: 6
  },
  toolPillsGroup: {
    display: 'flex',
    gap: 6,
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  toolBtn: {
    padding: '6px 12px',
    borderRadius: 10,
    border: '1.5px solid #cbd5e1',
    background: '#ffffff',
    color: '#475569',
    fontSize: '0.8rem',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    transition: 'all 0.15s ease'
  },
  activeToolBtn: {
    background: '#10b981',
    color: '#ffffff',
    borderColor: '#059669',
    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
  },
  thicknessRow: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    background: 'rgba(241, 245, 249, 0.8)',
    padding: '8px 12px',
    borderRadius: 12,
    border: '1px solid #e2e8f0'
  },
  aiSpeciesBox: {
    width: '100%',
    marginTop: 12,
    marginBottom: 6,
    padding: 12,
    borderRadius: 16,
    background: 'linear-gradient(135deg, #1e1b4b 0%, #31104b 100%)',
    border: '1.5px solid #a855f7',
    boxShadow: '0 4px 18px rgba(147, 51, 234, 0.25)',
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  speciesSelect: {
    width: '100%',
    padding: '9px 12px',
    borderRadius: 12,
    background: '#0f172a',
    border: '1.5px solid #fbbf24',
    color: '#fbbf24',
    fontSize: '0.86rem',
    fontWeight: 700,
    outline: 'none',
    cursor: 'pointer'
  },
  presetPill: {
    padding: '3px 8px',
    borderRadius: 6,
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    color: '#64748b',
    fontSize: '0.74rem',
    fontWeight: 700,
    cursor: 'pointer'
  },
  activePresetPill: {
    background: '#10b981',
    color: '#ffffff',
    borderColor: '#059669'
  },
  aiGenerateBtn: {
    width: '100%',
    gap: 10,
    marginTop: 14,
    marginBottom: 6,
    boxShadow: '0 4px 18px rgba(147, 51, 234, 0.4)',
    transition: 'all 0.2s ease',
    textShadow: '0 1px 3px rgba(0,0,0,0.3)'
  },
  stemSelectorWrapper: {
    width: '100%',
    margin: '6px 0'
  },
  sectionLabel: {
    fontSize: '0.84rem',
    fontWeight: 700,
    color: '#334155',
    marginBottom: 6,
    textAlign: 'center'
  },
  stemPillsRow: {
    display: 'flex',
    gap: 6,
    overflowX: 'auto',
    justifyContent: 'center',
    padding: '4px 0'
  },
  stemPill: {
    padding: '7px 12px',
    borderRadius: 12,
    border: '1px solid #cbd5e1',
    background: '#f8fafc',
    color: '#475569',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    whiteSpace: 'nowrap',
    transition: 'all 0.2s ease'
  },
  activeStemPill: {
    background: '#10b981',
    color: '#ffffff',
    borderColor: '#059669',
    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
  },
  canvasActions: {
    display: 'flex',
    gap: 12,
    marginTop: 12,
    width: '100%',
    justifyContent: 'center'
  },
  actionBtn: {
    padding: '8px 14px',
    fontSize: '0.84rem',
    display: 'flex',
    alignItems: 'center',
    gap: 6
  },
  step2Container: {
    display: 'flex',
    flexDirection: 'column'
  },
  flowerPreviewHeader: {
    background: 'linear-gradient(180deg, #d8f3dc 0%, #b7e4c7 100%)',
    borderRadius: 18,
    border: '2px solid #52b788',
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 16
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: '0.9rem',
    color: '#1e293b',
    cursor: 'pointer',
    marginBottom: 14
  },
  checkbox: {
    width: 18,
    height: 18,
    accentColor: '#10b981',
    cursor: 'pointer'
  },
  privateCard: {
    background: '#fffbeb',
    border: '1px solid #fef3c7',
    borderRadius: 14,
    padding: 12,
    marginTop: 4,
    marginBottom: 12
  },
  passwordHint: {
    fontSize: '0.82rem',
    color: '#b45309',
    textAlign: 'center'
  },
  errorBanner: {
    background: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    padding: '10px 14px',
    borderRadius: 12,
    fontSize: '0.88rem',
    marginTop: 10,
    textAlign: 'center'
  },
  moderationCard: {
    background: '#f0f9ff',
    border: '1.5px solid #bae6fd',
    borderRadius: 18,
    padding: 16,
    marginTop: 10,
    marginBottom: 14
  },
  moderationHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8
  },
  moderationTitle: {
    fontSize: '1rem',
    fontWeight: 800,
    color: '#0369a1'
  },
  moderationSubtitle: {
    fontSize: '0.82rem',
    color: '#0284c7',
    marginBottom: 10,
    fontWeight: 600
  },
  moderationList: {
    fontSize: '0.82rem',
    color: '#0c4a6e',
    lineHeight: 1.6,
    paddingLeft: 0,
    marginBottom: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    listStyleType: 'none'
  },
  moderationCheckLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: '0.85rem',
    color: '#0369a1',
    cursor: 'pointer',
    paddingTop: 12,
    borderTop: '1px dashed #bae6fd'
  }
};
