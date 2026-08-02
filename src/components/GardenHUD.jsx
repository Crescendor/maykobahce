import React from 'react';
import { Plus, Minus, Compass, Search, Flower, Sparkles } from 'lucide-react';
import { MAX_FLOWERS } from '../utils/gardenEngine';
import MaykoLogo from './MaykoLogo';

export default function GardenHUD({
  flowerCount,
  onZoomIn,
  onZoomOut,
  onResetView,
  onOpenSearch,
  onStartPlanting,
  isPlantingMode,
  onCancelPlanting
}) {
  return (
    <>
      {/* Top Header Bar – Logo | Slogan (row 1), Counter (row 2) */}
      <div style={styles.topHeader} className="glass-panel header-top">
        {/* Row 1: Logo + Slogan */}
        <div style={styles.headerRow} className="header-row">
          <div style={styles.headerSectionLeft}>
            <img src="/mayko_logo.png" alt="mayko" style={styles.logoImg} />
          </div>
          <div style={styles.headerSectionCenter}>
            <p style={styles.brandSub}>"Ben sana bir bahçe verdim."</p>
          </div>
        </div>

        {/* Row 2 (mobile) / inline right (desktop): Counter Badge */}
        <div style={styles.counterRow} className="header-counter-row">
          <div style={styles.counterBadge}>
            <Flower size={14} color="#34d399" />
            <span style={{ fontStyle: 'italic', fontSize: '0.84rem' }}>
              {flowerCount} çiçek var.
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Banner when Planting Mode is Active */}
      {isPlantingMode && (
        <div style={styles.plantingBanner} className="animate-slide-up glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={20} color="#fbbf24" />
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
              Çimenlikte çiçeğinizi dikmek istediğiniz noktaya dokunun!
            </span>
          </div>
          <button style={styles.cancelBtn} onClick={onCancelPlanting}>
            Vazgeç
          </button>
        </div>
      )}

      {/* Floating Action Controls (Right Side) */}
      <div style={styles.controlsCol}>
        <button
          style={styles.controlBtn}
          className="glass-panel"
          onClick={onZoomIn}
          title="Yakınlaştır"
        >
          <Plus size={22} />
        </button>

        <button
          style={styles.controlBtn}
          className="glass-panel"
          onClick={onZoomOut}
          title="Uzaklaştır"
        >
          <Minus size={22} />
        </button>

        <button
          style={styles.controlBtn}
          className="glass-panel"
          onClick={onResetView}
          title="Merkeze Sıfırla"
        >
          <Compass size={22} />
        </button>

        <button
          style={styles.controlBtn}
          className="glass-panel"
          onClick={onOpenSearch}
          title="Çiçek Ara"
        >
          <Search size={22} />
        </button>
      </div>

      {/* Main Floating Action Button (Bottom Center) */}
      {!isPlantingMode && (
        <div style={styles.fabWrapper}>
          <button className="btn-fab" onClick={onStartPlanting}>
            <Flower size={24} />
            <span>Çiçek Dik</span>
          </button>
        </div>
      )}
    </>
  );
}

const styles = {
  topHeader: {
    position: 'fixed',
    top: 16,
    left: 18,
    right: 18,
    maxWidth: 720,
    margin: '0 auto',
    borderRadius: 24,
    padding: '10px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    zIndex: 900
  },
  /* Row 1: Logo | Slogan */
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%'
  },
  headerSectionLeft: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0
  },
  headerSectionCenter: {
    display: 'flex',
    alignItems: 'center',
    flex: 1
  },
  /* Row 2: Counter badge always below */
  counterRow: {
    display: 'flex',
    justifyContent: 'center'
  },
  logoImg: {
    height: 40,
    width: 'auto',
    objectFit: 'contain',
    filter: 'drop-shadow(0 2px 10px rgba(186, 85, 211, 0.45))'
  },
  brandSub: {
    fontSize: '0.88rem',
    fontWeight: 600,
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: 0.2,
    whiteSpace: 'nowrap'
  },
  counterBadge: {
    background: 'rgba(255, 255, 255, 0.12)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    borderRadius: 99,
    padding: '5px 14px',
    fontSize: '0.82rem',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    whiteSpace: 'nowrap'
  },
  plantingBanner: {
    position: 'fixed',
    top: 90,
    left: 18,
    right: 18,
    maxWidth: 540,
    margin: '0 auto',
    borderRadius: 20,
    padding: '14px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 950,
    border: '2px solid #fbbf24',
    background: 'rgba(15, 30, 22, 0.9)'
  },
  cancelBtn: {
    background: 'rgba(255, 255, 255, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    color: '#ffffff',
    padding: '7px 14px',
    borderRadius: 12,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.85rem'
  },
  controlsCol: {
    position: 'fixed',
    right: 18,
    bottom: 95,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    zIndex: 900
  },
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
    border: '1px solid rgba(255, 255, 255, 0.25)'
  },
  fabWrapper: {
    position: 'fixed',
    bottom: 28,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'center',
    zIndex: 900
  }
};
