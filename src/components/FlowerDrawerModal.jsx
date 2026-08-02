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
  ShieldCheck
} from 'lucide-react';
import InstagramIcon from './InstagramIcon';
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
  '#9D4EDD', '#7209B7', '#4CC9F0', '#06D6A0', '#FFFFFF'
];

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
  const [strokes, setStrokes] = useState([]);
  const [currentStroke, setCurrentStroke] = useState(null);

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
      setTimeout(() => redrawCanvas([]), 50);
    }
  }, [isOpen]);

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

  // Start Drawing Brush Stroke
  const handleStartDraw = (e) => {
    e.preventDefault();
    const pt = getCanvasCoords(e);
    const newStroke = { tool: 'brush', color: currentColor, size: brushSize, points: [pt] };
    setCurrentStroke(newStroke);
    redrawCanvas([...strokes, newStroke]);
  };

  const handleMoveDraw = (e) => {
    if (!currentStroke) return;
    e.preventDefault();
    const pt = getCanvasCoords(e);
    const updatedStroke = {
      ...currentStroke,
      points: [...currentStroke.points, pt]
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

  // Step 2 -> Step 3 Validation
  const handleProceedToStep3 = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isAnonymous && !name.trim()) {
      setErrorMsg('Lütfen isminizi girin veya anonim seçeneğini işaretleyin.');
      return;
    }

    setStep(3);
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
      stemColor: selectedStemColor
    };

    try {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 }
      });
    } catch (err) {}

    onSaveFlower(newFlower);
  };

  if (!isOpen) return null;

  return (
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

            {/* Petal Color Swatches */}
            <div className="color-picker-grid" style={{ marginTop: 14 }}>
              {FLORAL_COLORS.map((c) => (
                <div
                  key={c}
                  className={`color-swatch ${currentColor === c ? 'active' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setCurrentColor(c)}
                />
              ))}
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
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setStep(1)}
                style={{ padding: '6px 14px', fontSize: '0.82rem', marginTop: 8 }}
              >
                <ArrowLeft size={14} /> Taç Çizimini Düzenle
              </button>
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
                  placeholder="Örn: Elif"
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
