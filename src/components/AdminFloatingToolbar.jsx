import React, { useState, useRef } from 'react';
import { Crown, Move, Paintbrush, Type, Trash2, ShieldAlert, ImagePlus, Globe, X, Sliders, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminFloatingToolbar({
  isAdminAuthenticated,
  adminTool,
  setAdminTool,
  onOpenDashboard
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isAdminAuthenticated) return null;

  // Render Collapsed Small Left Handle Button
  if (isCollapsed) {
    return (
      <div style={styles.collapsedWrapper} className="animate-slide-up">
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          style={styles.collapsedBtn}
          title="Admin Alet Çubuğunu Genişlet 🎨"
        >
          <Crown size={18} color="#f59e0b" />
          <span style={{ fontWeight: 800, color: '#fbbf24', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>Admin Aletleri</span>
          <ChevronRight size={16} color="#fbbf24" />
        </button>
      </div>
    );
  }

  // Render Expanded Left Vertical Toolbar
  return (
    <div style={styles.container} className="animate-slide-up glass-panel">
      {/* Header: Admin Mode Badge & Collapse Toggle */}
      <div style={styles.headerRow}>
        <div style={styles.badge}>
          <Crown size={18} color="#f59e0b" />
          <span style={{ fontWeight: 800, color: '#fbbf24', fontSize: '0.86rem' }}>Admin Aletleri</span>
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

      {/* Tools Column: Çiçek Taşı & Yönetim Konsolu */}
      <div style={styles.toolsColumn}>
        <button
          type="button"
          style={{ ...styles.toolBtn, ...(adminTool === 'move_flower' ? styles.activeToolBtn : {}) }}
          onClick={() => setAdminTool(adminTool === 'move_flower' ? null : 'move_flower')}
          title="Çiçeklerin Yerini Değiştir / Taşı (Tekrar basarak kapatın)"
        >
          <Move size={15} /> Çiçekleri Taşı
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
    width: 175
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
    gap: 8,
    width: '100%'
  },
  toolBtn: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 14,
    border: '1px solid rgba(255, 255, 255, 0.12)',
    background: 'rgba(30, 41, 59, 0.75)',
    color: '#cbd5e1',
    fontSize: '0.8rem',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    transition: 'all 0.15s ease'
  },
  activeToolBtn: {
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    color: '#ffffff',
    borderColor: '#f59e0b',
    boxShadow: '0 3px 12px rgba(245, 158, 11, 0.4)'
  },
  dashboardBtn: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 14,
    background: 'rgba(30, 41, 59, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    color: '#cbd5e1',
    fontSize: '0.8rem',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  }
};
