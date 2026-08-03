import React from 'react';
import { Crown, Move, Paintbrush, Type, Trash2, ShieldAlert, Sparkles, X } from 'lucide-react';

export default function AdminFloatingToolbar({
  isAdminAuthenticated,
  adminTool,
  setAdminTool,
  adminColor,
  setAdminColor,
  onOpenDashboard,
  meadowObjectsCount,
  onClearAllMeadowDrawings
}) {
  if (!isAdminAuthenticated) return null;

  return (
    <div style={styles.container} className="animate-slide-up glass-panel">
      {/* Admin Mode Badge */}
      <div style={styles.badge}>
        <Crown size={18} color="#f59e0b" />
        <span style={{ fontWeight: 800, color: '#fbbf24', fontSize: '0.88rem' }}>Admin Modu</span>
      </div>

      <div style={styles.divider} />

      {/* Tool Action Buttons */}
      <div style={styles.toolsRow}>
        <button
          type="button"
          style={{ ...styles.toolBtn, ...(adminTool === 'move_flower' ? styles.activeToolBtn : {}) }}
          onClick={() => setAdminTool('move_flower')}
          title="Çiçekleri Sürükle Bırak İle Taşı"
        >
          <Move size={15} /> Çiçek Taşı
        </button>

        <button
          type="button"
          style={{ ...styles.toolBtn, ...(adminTool === 'draw' ? styles.activeToolBtn : {}) }}
          onClick={() => setAdminTool('draw')}
          title="Harita Üzerine Serbest Çizim Yap"
        >
          <Paintbrush size={15} /> Çizim
        </button>

        <button
          type="button"
          style={{ ...styles.toolBtn, ...(adminTool === 'text' ? styles.activeToolBtn : {}) }}
          onClick={() => setAdminTool('text')}
          title="Haritaya Yazı Metni Ekle"
        >
          <Type size={15} /> Yazı Ekle
        </button>

        <button
          type="button"
          style={{ ...styles.toolBtn, ...(adminTool === 'delete' ? styles.activeToolBtn : {}) }}
          onClick={() => setAdminTool('delete')}
          title="Çiçek veya Çizim Nesnesi Sil"
        >
          <Trash2 size={15} /> Sil
        </button>
      </div>

      {/* Color Picker for Draw & Text Tools */}
      {(adminTool === 'draw' || adminTool === 'text') && (
        <div style={styles.colorWrapper}>
          <span style={{ fontSize: '0.76rem', color: '#cbd5e1', fontWeight: 600 }}>Renk:</span>
          <input
            type="color"
            value={adminColor}
            onChange={(e) => setAdminColor(e.target.value)}
            style={styles.colorInput}
            title="Çizim/Yazı Rengi"
          />
        </div>
      )}

      {/* Clear Meadow Drawings if any exist */}
      {meadowObjectsCount > 0 && (
        <button
          type="button"
          onClick={onClearAllMeadowDrawings}
          style={styles.clearBtn}
          title="Haritadaki Tüm Çizimleri Temizle"
        >
          <X size={14} /> Çizimleri Sil ({meadowObjectsCount})
        </button>
      )}

      <div style={styles.divider} />

      {/* Dashboard Button */}
      <button
        type="button"
        onClick={onOpenDashboard}
        style={styles.dashboardBtn}
        title="Yönetici Paneli Tablosunu Aç"
      >
        <ShieldAlert size={15} /> Yönetim Konsolu
      </button>
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    top: 18,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1800,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 16px',
    borderRadius: 99,
    background: 'rgba(15, 23, 42, 0.92)',
    border: '1.5px solid rgba(245, 158, 11, 0.5)',
    boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(245, 158, 11, 0.2)',
    backdropFilter: 'blur(12px)',
    maxWidth: '96vw',
    overflowX: 'auto'
  },
  badge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    whiteSpace: 'nowrap'
  },
  divider: {
    width: 1,
    height: 22,
    background: 'rgba(255, 255, 255, 0.15)'
  },
  toolsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6
  },
  toolBtn: {
    padding: '6px 12px',
    borderRadius: 20,
    border: '1px solid rgba(255, 255, 255, 0.12)',
    background: 'rgba(30, 41, 59, 0.7)',
    color: '#cbd5e1',
    fontSize: '0.8rem',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease'
  },
  activeToolBtn: {
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    color: '#ffffff',
    borderColor: '#f59e0b',
    boxShadow: '0 2px 10px rgba(245, 158, 11, 0.4)'
  },
  colorWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'rgba(255, 255, 255, 0.08)',
    padding: '4px 8px',
    borderRadius: 20
  },
  colorInput: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    background: 'transparent'
  },
  clearBtn: {
    padding: '5px 10px',
    borderRadius: 16,
    background: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    color: '#f87171',
    fontSize: '0.76rem',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    whiteSpace: 'nowrap'
  },
  dashboardBtn: {
    padding: '6px 14px',
    borderRadius: 20,
    background: 'rgba(16, 185, 129, 0.2)',
    border: '1px solid rgba(16, 185, 129, 0.4)',
    color: '#34d399',
    fontSize: '0.8rem',
    fontWeight: 800,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    whiteSpace: 'nowrap'
  }
};
