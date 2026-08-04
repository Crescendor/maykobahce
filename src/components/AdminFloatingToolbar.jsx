import React, { useState, useRef } from 'react';
import { Crown, Move, Paintbrush, Type, Trash2, ShieldAlert, ImagePlus, Globe, X, Sliders, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminFloatingToolbar({
  isAdminAuthenticated,
  adminTool,
  setAdminTool,
  adminColor,
  setAdminColor,
  adminFont,
  setAdminFont,
  onOpenDashboard,
  meadowObjectsCount,
  onClearAllMeadowDrawings,
  onAddPngSticker,
  onAddCircleShape,
  onAddSquareShape,
  onAddSpeechBubble,
  onPublishMeadowObjects,
  selectedImageSize,
  onUpdateSelectedImageSize
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const fileInputRef = useRef(null);

  if (!isAdminAuthenticated) return null;

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Lütfen geçerli bir PNG veya görsel dosyası seçin.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (dataUrl && onAddPngSticker) {
        onAddPngSticker(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Render Collapsed Small Left Handle Button
  if (isCollapsed) {
    return (
      <div style={styles.collapsedWrapper} className="animate-slide-up">
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          style={styles.collapsedBtn}
          title="Photoshop Admin Alet Çubuğunu Genişlet 🎨"
        >
          <Crown size={18} color="#f59e0b" />
          <span style={{ fontWeight: 800, color: '#fbbf24', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>Admin Aletleri</span>
          <ChevronRight size={16} color="#fbbf24" />
        </button>
      </div>
    );
  }

  // Render Expanded Left Vertical Photoshop Toolbar
  return (
    <div style={styles.container} className="animate-slide-up glass-panel">
      {/* Hidden File Input for PNG Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/webp,image/jpeg"
        onChange={handleImageFileChange}
        style={{ display: 'none' }}
      />

      {/* Header: Admin Mode Badge & Collapse Toggle */}
      <div style={styles.headerRow}>
        <div style={styles.badge}>
          <Crown size={18} color="#f59e0b" />
          <span style={{ fontWeight: 800, color: '#fbbf24', fontSize: '0.86rem' }}>Photoshop Modu</span>
        </div>
        <button
          type="button"
          onClick={() => setIsCollapsed(true)}
          style={styles.collapseToggleBtn}
          title="Alet Çubuğunu Sol Tarafa Daralt ◀"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      <div style={styles.dividerHorizontal} />

      {/* Primary Photoshop Vertical Tool Grid */}
      <div style={styles.toolsColumn}>
        <button
          type="button"
          style={{ ...styles.toolBtn, ...(adminTool === 'move_flower' ? styles.activeToolBtn : {}) }}
          onClick={() => setAdminTool(adminTool === 'move_flower' ? null : 'move_flower')}
          title="Çiçekleri ve PNG Görsellerini Taşı (Tekrar basarak kapatın)"
        >
          <Move size={15} /> Taşı
        </button>

        <button
          type="button"
          style={{ ...styles.toolBtn, ...(adminTool === 'draw' ? styles.activeToolBtn : {}) }}
          onClick={() => setAdminTool(adminTool === 'draw' ? null : 'draw')}
          title="Harita Üzerine Serbest Çizim Yap (Tekrar basarak kapatın)"
        >
          <Paintbrush size={15} /> Çizim
        </button>

        <button
          type="button"
          style={{ ...styles.toolBtn, ...(adminTool === 'text' ? styles.activeToolBtn : {}) }}
          onClick={() => setAdminTool(adminTool === 'text' ? null : 'text')}
          title="Haritaya Yazı Metni Ekle (Tekrar basarak kapatın)"
        >
          <Type size={15} /> Yazı Ekle
        </button>

        {/* Shapes Group */}
        <div style={styles.shapesGrid}>
          <button
            type="button"
            style={styles.toolBtnSmall}
            onClick={onAddCircleShape}
            title="Daire Şekli Ekle"
          >
            ⭕ Yuvarlak
          </button>

          <button
            type="button"
            style={styles.toolBtnSmall}
            onClick={onAddSquareShape}
            title="Kare Şekli Ekle"
          >
            🔲 Kare
          </button>
        </div>

        <button
          type="button"
          style={styles.toolBtn}
          onClick={onAddSpeechBubble}
          title="Haritaya Sohbet Balonu Ekle"
        >
          💬 Balon Ekle
        </button>

        {/* PNG Upload Button */}
        <button
          type="button"
          style={styles.toolBtn}
          onClick={() => fileInputRef.current?.click()}
          title="Haritaya Özel PNG Görsel / Çıkartma Yükle"
        >
          <ImagePlus size={15} color="#38bdf8" /> PNG Ekle
        </button>

        <button
          type="button"
          style={{ ...styles.toolBtn, ...(adminTool === 'delete' ? styles.activeToolBtn : {}) }}
          onClick={() => setAdminTool(adminTool === 'delete' ? null : 'delete')}
          title="Çiçek, Çizim veya PNG Görseli Sil (Tekrar basarak kapatın)"
        >
          <Trash2 size={15} /> Sil
        </button>
      </div>

      {/* Conditional Tool Settings: Font Family Selector */}
      {adminTool === 'text' && (
        <>
          <div style={styles.dividerHorizontal} />
          <div style={styles.colorWrapper}>
            <span style={{ fontSize: '0.74rem', color: '#cbd5e1', fontWeight: 600 }}>Yazı Tipi:</span>
            <select
              value={adminFont || 'sans-serif'}
              onChange={(e) => setAdminFont && setAdminFont(e.target.value)}
              style={styles.fontSelect}
            >
              <option value="sans-serif">Standart (Sans)</option>
              <option value="serif">Zarif (Serif)</option>
              <option value="monospace">Kod (Monospace)</option>
              <option value="cursive">Romantik (Script)</option>
              <option value="Impact, sans-serif">Dev (Impact)</option>
              <option value="'Playfair Display', serif">Kraliyet (Playfair)</option>
            </select>
          </div>
        </>
      )}

      {/* Conditional Tool Settings: Color Picker for Draw & Text Tools */}
      {(adminTool === 'draw' || adminTool === 'text') && (
        <>
          <div style={styles.dividerHorizontal} />
          <div style={styles.colorWrapper}>
            <span style={{ fontSize: '0.74rem', color: '#cbd5e1', fontWeight: 600 }}>Renk:</span>
            <input
              type="color"
              value={adminColor}
              onChange={(e) => setAdminColor(e.target.value)}
              style={styles.colorInput}
              title="Çizim/Yazı Rengi"
            />
          </div>
        </>
      )}

      {/* PNG / Shape Size Slider Control */}
      {selectedImageSize && (
        <>
          <div style={styles.dividerHorizontal} />
          <div style={styles.sizeSliderWrapper}>
            <Sliders size={14} color="#38bdf8" />
            <span style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 600 }}>
              Boyut: {selectedImageSize}px
            </span>
            <input
              type="range"
              min="40"
              max="600"
              value={selectedImageSize}
              onChange={(e) => onUpdateSelectedImageSize && onUpdateSelectedImageSize(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
            />
          </div>
        </>
      )}

      {/* Clear Meadow Drawings if any exist */}
      {meadowObjectsCount > 0 && (
        <>
          <div style={styles.dividerHorizontal} />
          <button
            type="button"
            onClick={onClearAllMeadowDrawings}
            style={styles.clearBtn}
            title="Haritadaki Tüm Çizimleri Temizle"
          >
            <X size={14} /> Temizle ({meadowObjectsCount})
          </button>
        </>
      )}

      <div style={styles.dividerHorizontal} />

      {/* Actions: Publish & Management Console */}
      <div style={styles.actionsColumn}>
        <button
          type="button"
          onClick={onPublishMeadowObjects}
          style={styles.publishBtn}
          title="Haritaya Koyduğunuz Tüm Çizim, Yazı ve PNG Görsellerini Canlıya Alın"
        >
          <Globe size={15} /> Uygula / Yayınla
        </button>

        <button
          type="button"
          onClick={onOpenDashboard}
          style={styles.dashboardBtn}
          title="Yönetici Paneli Tablosunu Aç"
        >
          <ShieldAlert size={15} /> Yönetim Konsolu
        </button>
      </div>
    </div>
  );
}

const styles = {
  collapsedWrapper: {
    position: 'fixed',
    left: 16,
    top: '40%',
    transform: 'translateY(-50%)',
    zIndex: 1750
  },
  collapsedBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    borderRadius: 30,
    background: 'rgba(15, 23, 42, 0.95)',
    border: '1.5px solid rgba(245, 158, 11, 0.6)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6), 0 0 16px rgba(245, 158, 11, 0.3)',
    backdropFilter: 'blur(10px)',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  container: {
    position: 'fixed',
    left: 18,
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 1750,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: '14px 12px',
    borderRadius: 24,
    background: 'rgba(15, 23, 42, 0.95)',
    border: '1.5px solid rgba(245, 158, 11, 0.5)',
    boxShadow: '0 14px 40px rgba(0, 0, 0, 0.75), 0 0 24px rgba(245, 158, 11, 0.2)',
    backdropFilter: 'blur(16px)',
    width: 175,
    maxHeight: '85vh',
    overflowY: 'auto'
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%'
  },
  badge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6
  },
  collapseToggleBtn: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    borderRadius: '50%',
    width: 26,
    height: 26,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#cbd5e1',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  dividerHorizontal: {
    width: '100%',
    height: 1,
    background: 'rgba(255, 255, 255, 0.12)'
  },
  toolsColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    width: '100%'
  },
  shapesGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 5,
    width: '100%'
  },
  toolBtn: {
    width: '100%',
    padding: '7px 10px',
    borderRadius: 14,
    border: '1px solid rgba(255, 255, 255, 0.12)',
    background: 'rgba(30, 41, 59, 0.75)',
    color: '#cbd5e1',
    fontSize: '0.78rem',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    transition: 'all 0.15s ease'
  },
  toolBtnSmall: {
    padding: '6px 4px',
    borderRadius: 12,
    border: '1px solid rgba(255, 255, 255, 0.12)',
    background: 'rgba(30, 41, 59, 0.75)',
    color: '#cbd5e1',
    fontSize: '0.72rem',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center'
  },
  activeToolBtn: {
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    color: '#ffffff',
    borderColor: '#f59e0b',
    boxShadow: '0 3px 12px rgba(245, 158, 11, 0.4)'
  },
  fontSelect: {
    width: '100%',
    padding: '5px 6px',
    borderRadius: 10,
    background: '#0f172a',
    color: '#f8fafc',
    border: '1px solid rgba(255,255,255,0.2)',
    fontSize: '0.74rem',
    fontWeight: 700
  },
  colorWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    background: 'rgba(255, 255, 255, 0.06)',
    padding: '6px 8px',
    borderRadius: 12,
    width: '100%'
  },
  colorInput: {
    width: '100%',
    height: 28,
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    background: 'transparent'
  },
  sizeSliderWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    background: 'rgba(56, 189, 248, 0.12)',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    padding: '6px 8px',
    borderRadius: 12,
    width: '100%'
  },
  clearBtn: {
    width: '100%',
    padding: '6px 8px',
    borderRadius: 12,
    background: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    color: '#f87171',
    fontSize: '0.74rem',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4
  },
  actionsColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    width: '100%'
  },
  publishBtn: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 14,
    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    border: '1px solid #34d399',
    color: '#ffffff',
    fontSize: '0.8rem',
    fontWeight: 900,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    boxShadow: '0 3px 12px rgba(16, 185, 129, 0.4)'
  },
  dashboardBtn: {
    width: '100%',
    padding: '7px 8px',
    borderRadius: 14,
    background: 'rgba(30, 41, 59, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    color: '#cbd5e1',
    fontSize: '0.76rem',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5
  }
};
