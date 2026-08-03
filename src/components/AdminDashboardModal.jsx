import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  ShieldAlert,
  Trash2,
  MapPin,
  X,
  Search,
  Eye,
  Key,
  Calendar,
  CheckCircle,
  Clock,
  Heart,
  Star,
  Sparkles
} from 'lucide-react';
import InstagramIcon from './InstagramIcon';

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

export default function AdminDashboardModal({ isOpen, onClose, flowers, onDeleteFlower, onFocusFlower, onAdminAuth, onPatchFlower }) {
  // ALL hooks must be declared before any early returns (React rules of hooks)
  const [passwordInput, setPasswordInput] = useState('');
  // Initialize from localStorage so admin login survives page refresh
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem('mayko_admin_auth') === 'true'
  );
  const [loginError, setLoginError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [localPatches, setLocalPatches] = useState({}); // optimistic UI: { [id]: { approved, animation, animationColor } }

  if (!isOpen) return null;

  // Handle Admin Login (Server API verification with local fallback)
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError(false);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput })
      });
      if (res.ok) {
        setIsAuthenticated(true);
        localStorage.setItem('mayko_admin_auth', 'true');
        localStorage.setItem('mayko_admin_token', passwordInput);
        if (onAdminAuth) onAdminAuth();
        return;
      } else {
        setLoginError(true);
      }
    } catch (err) {
      setLoginError(true);
    }
  };

  // Patch a flower (approve or set animation) via API with optimistic update
  const patchFlower = async (flowerId, patch) => {
    setLocalPatches((prev) => ({ ...prev, [flowerId]: { ...(prev[flowerId] || {}), ...patch } }));
    if (onPatchFlower) {
      onPatchFlower(flowerId, patch);
    }
    try {
      const adminToken = localStorage.getItem('mayko_admin_token') || '';
      await fetch(`/api/flower/${flowerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPassword: adminToken, ...patch })
      });
    } catch (e) {
      console.error('Patch failed', e);
    }
  };

  // Merge local patches into flower list for live UI
  const mergedFlowers = flowers.map((f) => ({ ...f, ...(localPatches[f.id] || {}) }));

  // Filter Flowers
  const filteredFlowers = mergedFlowers.filter((f) => {
    const q = searchQuery.toLowerCase();
    return (
      (f.name || '').toLowerCase().includes(q) ||
      (f.note || '').toLowerCase().includes(q) ||
      (f.instagram || '').toLowerCase().includes(q) ||
      (f.password || '').toLowerCase().includes(q) ||
      (f.deleteCode || '').toLowerCase().includes(q)
    );
  });

  const privateCount = flowers.filter((f) => f.isPrivate).length;
  const anonCount = flowers.filter((f) => f.isAnonymous).length;
  const pendingCount = mergedFlowers.filter((f) => f.approved === 0).length;

  const ANIMATIONS = [
    { key: null, label: '— Yok', icon: '' },
    { key: 'heart', label: 'Kalp', icon: '💜' },
    { key: 'star', label: 'Yıldız', icon: '⭐' },
    { key: 'glow', label: 'Parlamalı', icon: '✨' }
  ];

  return (
    <div style={styles.overlay} className="animate-fade-in">
      <div style={styles.modalCard} className="glass-card-dark animate-slide-up">
        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldAlert size={24} color="#10b981" />
            <div>
              <h2 style={styles.title}>Yönetici Paneli (Admin Console)</h2>
              <p style={styles.subtitle}>Sanal Çimenlik Moderasyon & Çiçek Yönetim Merkezi</p>
            </div>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>
            <X size={20} color="#94a3b8" />
          </button>
        </div>

        {/* PASSWORD LOGIN SCREEN */}
        {!isAuthenticated ? (
          <form onSubmit={handleLogin} style={styles.loginCard}>
            <div style={styles.lockIconBadge}>
              <Lock size={32} color="#f59e0b" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: 6 }}>
              Yönetici Erişimi Gerekli
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#94a3b8', marginBottom: 16 }}>
              Lütfen devam etmek için yönetici şifresini giriniz:
            </p>

            <div style={{ width: '100%', maxWidth: 320, marginBottom: 12 }}>
              <input
                type="password"
                placeholder="Admin Şifresi"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                style={styles.loginInput}
              />
            </div>

            {loginError && (
              <p style={{ color: '#ef4444', fontSize: '0.84rem', marginBottom: 12, fontWeight: 600 }}>
                ❌ Hatalı yönetici şifresi!
              </p>
            )}

            <button type="submit" className="btn-primary" style={{ padding: '10px 24px', fontSize: '0.92rem' }}>
              Paneli Aç
            </button>
          </form>
        ) : (
          /* AUTHENTICATED DASHBOARD CONTENT */
          <div style={styles.dashboardBody}>
            {/* Stats Metrics Row */}
            <div style={styles.statsRow}>
              <div style={styles.statCard}>
                <span style={styles.statNumber}>{flowers.length}</span>
                <span style={styles.statLabel}>Toplam Çiçek</span>
              </div>
              <div style={styles.statCard}>
                <span style={{ ...styles.statNumber, color: pendingCount > 0 ? '#f87171' : '#34d399' }}>{pendingCount}</span>
                <span style={styles.statLabel}>⏳ Onay Bekleyen</span>
              </div>
              <div style={styles.statCard}>
                <span style={{ ...styles.statNumber, color: '#f59e0b' }}>{privateCount}</span>
                <span style={styles.statLabel}>Gizli Notlu</span>
              </div>
              <div style={styles.statCard}>
                <span style={{ ...styles.statNumber, color: '#38bdf8' }}>{anonCount}</span>
                <span style={styles.statLabel}>Anonim</span>
              </div>
            </div>

            {/* Search Bar */}
            <div style={styles.searchWrapper}>
              <Search size={18} color="#94a3b8" />
              <input
                type="text"
                placeholder="İsim, Not, Instagram, Şifre veya Silme Koduna Göre Ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
            </div>

            {/* Flowers Table / List */}
            <div style={styles.tableContainer}>
              {filteredFlowers.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                  Arama kriterlerine uygun çiçek bulunamadı.
                </div>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.thRow}>
                      <th style={styles.th}>Çiçek / Oluşturan</th>
                      <th style={styles.th}>İçerik & Not</th>
                      <th style={styles.th}>Kodlar</th>
                      <th style={styles.th}>Animasyon</th>
                      <th style={styles.th}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFlowers.map((flower) => {
                      const formattedDate = new Date(flower.createdAt).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      return (
                        <tr key={flower.id} style={{ ...styles.tr, opacity: flower.approved === 0 ? 0.75 : 1 }}>
                          {/* Creator Info */}
                          <td style={styles.td}>
                            <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>
                              {flower.name || 'Anonim'}
                            </div>
                            {/* real_sender badge */}
                            {flower.realSender && (
                              <div style={{ fontSize: '0.76rem', color: '#f9a8d4', fontWeight: 700, marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                                🌸 {flower.realSender} {b64('Z8O2bmRlcmRp')} {flower.isAnonymous ? b64('KEFub25pbSk=') : ''}
                              </div>
                            )}
                            {flower.instagram && (
                              <div style={{ fontSize: '0.78rem', color: '#ec4899', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                <InstagramIcon size={12} /> {flower.instagram}
                              </div>
                            )}
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Calendar size={12} /> {formattedDate}
                            </div>
                            {/* Approval badge */}
                            <div style={{ marginTop: 5 }}>
                              {flower.approved === 0 ? (
                                <span style={{ fontSize: '0.72rem', background: 'rgba(251,146,60,0.2)', color: '#fb923c', padding: '2px 8px', borderRadius: 99, border: '1px solid #fb923c' }}>
                                  ⏳ Onay Bekliyor
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.72rem', background: 'rgba(52,211,153,0.15)', color: '#34d399', padding: '2px 8px', borderRadius: 99, border: '1px solid #34d399' }}>
                                  ✅ Onaylandı
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Note Content */}
                          <td style={styles.td}>
                            {flower.note ? (
                              <div style={styles.noteContentBox}>"{flower.note}"</div>
                            ) : (
                              <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.82rem' }}>Not yazılmamış</span>
                            )}
                            {flower.isPrivate && (
                              <div style={styles.privateBadgeAdmin}>
                                <Lock size={12} color="#f59e0b" /> Gizli Not
                              </div>
                            )}
                          </td>

                          {/* Passwords & Codes */}
                          <td style={styles.td}>
                            {flower.isPrivate && (
                              <div style={{ fontSize: '0.82rem', color: '#fbbf24', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Key size={13} /> Şifre: <code style={styles.codeTag}>{flower.password}</code>
                              </div>
                            )}
                            <div style={{ fontSize: '0.82rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <ShieldAlert size={13} /> Silme Kodu: <code style={styles.codeTag}>{flower.deleteCode || 'K8X9P4M2'}</code>
                            </div>
                          </td>

                          {/* Animation Selector */}
                          <td style={styles.td}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                              {ANIMATIONS.map((anim) => (
                                <button
                                  key={String(anim.key)}
                                  type="button"
                                  onClick={() => patchFlower(flower.id, { animation: anim.key })}
                                  style={{
                                    fontSize: '0.75rem',
                                    padding: '3px 8px',
                                    borderRadius: 8,
                                    border: `1px solid ${flower.animation === anim.key ? '#10b981' : '#334155'}`,
                                    background: flower.animation === anim.key ? 'rgba(16,185,129,0.2)' : 'rgba(30,41,59,0.6)',
                                    color: flower.animation === anim.key ? '#34d399' : '#94a3b8',
                                    cursor: 'pointer',
                                    textAlign: 'left'
                                  }}
                                >
                                  {anim.icon} {anim.label}
                                </button>
                              ))}
                              {flower.animation === 'glow' && (
                                <div style={{ marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Renk:</span>
                                  <input
                                    type="color"
                                    defaultValue={flower.animationColor || '#10b981'}
                                    onChange={(e) => patchFlower(flower.id, { animationColor: e.target.value })}
                                    style={{ width: 28, height: 22, border: 'none', borderRadius: 5, cursor: 'pointer', background: 'transparent' }}
                                  />
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Admin Actions */}
                          <td style={styles.td}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {flower.approved === 0 && (
                                <button
                                  type="button"
                                  style={styles.approveBtn}
                                  onClick={() => patchFlower(flower.id, { approved: 1 })}
                                  title="Onayla"
                                >
                                  <CheckCircle size={14} /> Onayla
                                </button>
                              )}
                              <button
                                type="button"
                                style={styles.focusBtn}
                                onClick={() => { onFocusFlower(flower); onClose(); }}
                                title="Haritada Göster"
                              >
                                <MapPin size={14} /> Göster
                              </button>
                              <button
                                type="button"
                                style={styles.deleteBtn}
                                onClick={() => onDeleteFlower(flower.id, flower.deleteCode)}
                                title="Çiçeği Sil"
                              >
                                <Trash2 size={14} /> Sil
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
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
    background: 'rgba(5, 15, 10, 0.85)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: 16
  },
  modalCard: {
    width: '100%',
    maxWidth: 960,
    maxHeight: '92vh',
    overflowY: 'auto',
    borderRadius: 24,
    padding: 24,
    background: 'rgba(15, 23, 42, 0.95)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    paddingBottom: 14
  },
  title: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.4rem',
    fontWeight: 800,
    color: '#f8fafc'
  },
  subtitle: {
    fontSize: '0.82rem',
    color: '#94a3b8'
  },
  closeBtn: {
    background: 'rgba(255, 255, 255, 0.08)',
    border: 'none',
    width: 36,
    height: 36,
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  loginCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 20px',
    textAlign: 'center'
  },
  lockIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    background: 'rgba(245, 158, 11, 0.15)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  loginInput: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 14,
    background: 'rgba(30, 41, 59, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    color: '#ffffff',
    fontSize: '1rem',
    textAlign: 'center'
  },
  dashboardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 12
  },
  statCard: {
    background: 'rgba(30, 41, 59, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  statNumber: {
    fontSize: '1.8rem',
    fontWeight: 900,
    color: '#10b981'
  },
  statLabel: {
    fontSize: '0.8rem',
    color: '#94a3b8',
    marginTop: 2
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'rgba(30, 41, 59, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    padding: '10px 16px'
  },
  searchInput: {
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#ffffff',
    fontSize: '0.9rem',
    width: '100%'
  },
  tableContainer: {
    overflowX: 'auto',
    borderRadius: 16,
    border: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(15, 23, 42, 0.6)'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '0.88rem'
  },
  thRow: {
    background: 'rgba(30, 41, 59, 0.9)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
  },
  th: {
    padding: '12px 16px',
    color: '#cbd5e1',
    fontWeight: 700,
    fontSize: '0.82rem'
  },
  tr: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
  },
  td: {
    padding: '14px 16px',
    verticalAlign: 'middle'
  },
  noteContentBox: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: '8px 12px',
    color: '#e2e8f0',
    fontSize: '0.86rem',
    fontStyle: 'italic',
    lineHeight: 1.4,
    maxWidth: 320
  },
  privateBadgeAdmin: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: '0.74rem',
    color: '#f59e0b',
    fontWeight: 600,
    marginTop: 4
  },
  codeTag: {
    background: 'rgba(0,0,0,0.3)',
    padding: '2px 6px',
    borderRadius: 6,
    fontFamily: 'monospace',
    fontWeight: 700,
    letterSpacing: 1
  },
  focusBtn: {
    background: 'rgba(16, 185, 129, 0.15)',
    color: '#34d399',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: 10,
    padding: '6px 12px',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4
  },
  deleteBtn: {
    background: 'rgba(239, 68, 68, 0.15)',
    color: '#f87171',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: 10,
    padding: '6px 12px',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4
  },
  approveBtn: {
    background: 'rgba(34, 197, 94, 0.2)',
    color: '#4ade80',
    border: '1px solid rgba(34, 197, 94, 0.4)',
    borderRadius: 10,
    padding: '6px 12px',
    fontSize: '0.8rem',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4
  }
};
