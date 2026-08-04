import React, { useState, useRef, useEffect } from 'react';
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
  XCircle,
  Clock,
  Heart,
  Star,
  Sparkles,
  Edit3,
  Save
} from 'lucide-react';
import InstagramIcon from './InstagramIcon';
import { drawSmoothStroke, drawStem } from '../utils/gardenEngine';

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

function FlowerThumbnail({ flower }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Stem
    ctx.save();
    ctx.translate(35, 60);
    drawStem(ctx, flower.stemType || 'classic', flower.stemColor || '#52b788', 0.65);
    ctx.restore();

    // Petals / Strokes
    ctx.save();
    ctx.translate(35, 26);
    ctx.scale(0.13, 0.13);
    ctx.translate(-150, -240);

    if (flower.strokes && flower.strokes.length > 0) {
      flower.strokes.forEach((stroke) => {
        drawSmoothStroke(ctx, stroke);
      });
    } else {
      ctx.beginPath();
      ctx.arc(150, 150, 45, 0, Math.PI * 2);
      ctx.fillStyle = '#ff4d6d';
      ctx.fill();
    }
    ctx.restore();
  }, [flower]);

  return (
    <div style={{
      width: 66,
      height: 66,
      borderRadius: 14,
      background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
      border: '1px solid rgba(255,255,255,0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
    }}>
      <canvas ref={canvasRef} width={70} height={70} style={{ width: 62, height: 62 }} />
    </div>
  );
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
  const [editingFlowerId, setEditingFlowerId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [viewNoteFlower, setViewNoteFlower] = useState(null);

  const handleStartEdit = (flower) => {
    const patch = localPatches[flower.id] || {};
    setEditingFlowerId(flower.id);
    setEditName(patch.name !== undefined ? patch.name : (flower.name || ''));
    setEditNote(patch.note !== undefined ? patch.note : (flower.note || ''));
    setEditInstagram(patch.instagram !== undefined ? patch.instagram : (flower.instagram || ''));
  };

  const handleCancelEdit = () => {
    setEditingFlowerId(null);
  };

  const handleSaveEdit = (flowerId) => {
    patchFlower(flowerId, {
      name: editName,
      note: editNote,
      instagram: editInstagram
    });
    setEditingFlowerId(null);
  };

  if (!isOpen) return null;

  // Handle Admin Login (Client verification + API fallback)
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError(false);

    const inputPass = (passwordInput || '').trim();
    const expectedPass = 'Doxish44_';

    if (inputPass === expectedPass) {
      setIsAuthenticated(true);
      localStorage.setItem('mayko_admin_auth', 'true');
      localStorage.setItem('mayko_admin_token', inputPass);
      if (onAdminAuth) onAdminAuth();
      return;
    }

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: inputPass })
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data && data.authenticated) {
        setIsAuthenticated(true);
        localStorage.setItem('mayko_admin_auth', 'true');
        localStorage.setItem('mayko_admin_token', inputPass);
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

  const handleClearAllAnimations = async () => {
    if (!window.confirm('Haritadaki tüm çiçeklerin özel animasyonlarını (kalp, yıldız, duman, yarasa vb.) kaldırmak istediğinize emin misiniz?')) {
      return;
    }
    const animatedFlowers = flowers.filter((f) => f.animation);
    if (animatedFlowers.length === 0) {
      alert('Haritada zaten aktif özel animasyonu olan çiçek bulunmuyor.');
      return;
    }
    animatedFlowers.forEach((f) => {
      patchFlower(f.id, { animation: null, animationColor: null });
    });
    alert(`${animatedFlowers.length} adet çiçeğin özel animasyonları başarıyla kaldırıldı! ✨`);
  };

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
    { key: null, label: '— Animasyon Yok', icon: '' },
    { key: 'heart', label: 'Uçan Kalpler', icon: '💜' },
    { key: 'star', label: 'Yıldız Yağmuru', icon: '⭐' },
    { key: 'glow', label: 'Neon Halka', icon: '✨' },
    { key: 'smoke', label: 'Renkli Duman', icon: '🌫️' },
    { key: 'bats', label: 'Yarasa (Dark)', icon: '🦇' },
    { key: 'fireflies', label: 'Ateş Böcekleri', icon: '🪲' },
    { key: 'butterflies', label: 'Kelebekler', icon: '🦋' },
    { key: 'rainbow_ring', label: 'Gökkuşağı Aurası', icon: '🌈' },
    { key: 'sakura_petals', label: 'Sakura Dökümü', icon: '🌸' },
    { key: 'sparkles_gold', label: 'Işıltı Çeşmesi', icon: '💫' }
  ];

  const CARD_THEMES_OPTIONS = [
    { key: '', label: '— Varsayılan Tema 🌿' },
    { key: 'gold', label: 'Saf Altın & Lüks ✨' },
    { key: 'dark_gothic', label: 'Gotik Dark (Yarasalı) 🦇' },
    { key: 'love_romance', label: 'Aşk & Romantizm ❤️' },
    { key: 'starry_galaxy', label: 'Yıldızlar & Galaksi 🌌' },
    { key: 'neon_cyber', label: 'Neon Siberpunk ⚡' },
    { key: 'sakura_bloom', label: 'Pembe Sakura 🌸' },
    { key: 'ocean_breeze', label: 'Okyanus Esintisi 🌊' },
    { key: 'sunset_glow', label: 'Gün Batımı 🌅' },
    { key: 'emerald_forest', label: 'Zümrüt Ormanı 🌲' },
    { key: 'royal_purple', label: 'Kraliyet Moru 👑' },
    { key: 'vintage_sepia', label: 'Nostaljik Sepya 📜' },
    { key: 'fire_blaze', label: 'Alev & Ateş 🔥' },
    { key: 'ice_frost', label: 'Buz & Don ❄️' },
    { key: 'fairy_magic', label: 'Peri Masalı ✨' },
    { key: 'cosmic_aurora', label: 'Kutup Işıkları 🌌' },
    { key: 'sunflower_summer', label: 'Yaz Güneşi ☀️' },
    { key: 'midnight_shadow', label: 'Gece Yarısı 🌙' },
    { key: 'diamond_crystal', label: 'Elmas & Kristal 💎' },
    { key: 'rainbow_dream', label: 'Gökkuşağı Rüyası 🌈' }
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
            {/* Top Fixed Section: Stats Metrics & Search Bar */}
            <div style={styles.topFixedSection}>
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

              {/* Search Bar & Bulk Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', marginBottom: 16 }}>
                <div style={{ ...styles.searchWrapper, flex: 1, marginBottom: 0 }}>
                  <Search size={18} color="#94a3b8" />
                  <input
                    type="text"
                    placeholder="İsim, Not, Instagram, Şifre veya Silme Koduna Göre Ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={styles.searchInput}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleClearAllAnimations}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 14,
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1.5px solid rgba(239, 68, 68, 0.4)',
                    color: '#f87171',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    whiteSpace: 'nowrap'
                  }}
                  title="Tüm Çiçeklerin Özel Animasyonlarını Sıfırla / Kaldır"
                >
                  <Sparkles size={15} /> Tüm Animasyonları Kaldır
                </button>
              </div>
            </div>

            {/* Scrollable Flowers Table / List */}
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
                      <th style={styles.th}>Kodlar & Şifre</th>
                      <th style={styles.th}>Animasyon & Tema</th>
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

                      const noteText = localPatches[flower.id]?.note !== undefined ? localPatches[flower.id].note : flower.note;

                      return (
                        <tr key={flower.id} style={{ ...styles.tr, opacity: flower.approved === 0 ? 0.75 : 1 }}>
                          {/* Creator Info & Flower Image Preview */}
                          <td style={styles.td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <FlowerThumbnail flower={flower} />
                              <div style={{ minWidth: 150 }}>
                                {editingFlowerId === flower.id ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    <input
                                      type="text"
                                      value={editName}
                                      onChange={(e) => setEditName(e.target.value)}
                                      style={styles.inlineEditInput}
                                      placeholder="İsim..."
                                    />
                                    <input
                                      type="text"
                                      value={editInstagram}
                                      onChange={(e) => setEditInstagram(e.target.value)}
                                      style={styles.inlineEditInput}
                                      placeholder="@kullanici"
                                    />
                                  </div>
                                ) : (
                                  <>
                                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.88rem' }}>
                                      {(localPatches[flower.id]?.name !== undefined ? localPatches[flower.id].name : flower.name) || 'Anonim'}
                                    </div>
                                    {flower.realSender && (
                                      <div style={{ fontSize: '0.72rem', color: '#f9a8d4', fontWeight: 700 }}>
                                        🌸 {flower.realSender}
                                      </div>
                                    )}
                                    {(localPatches[flower.id]?.instagram !== undefined ? localPatches[flower.id].instagram : flower.instagram) && (
                                      <div style={{ fontSize: '0.74rem', color: '#ec4899', display: 'flex', alignItems: 'center', gap: 3 }}>
                                        <InstagramIcon size={11} /> {localPatches[flower.id]?.instagram !== undefined ? localPatches[flower.id].instagram : flower.instagram}
                                      </div>
                                    )}
                                    <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 3 }}>
                                      <Calendar size={11} /> {formattedDate}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Note Content & Preview Modal Trigger */}
                          <td style={styles.td}>
                            {editingFlowerId === flower.id ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 180 }}>
                                <textarea
                                  value={editNote}
                                  onChange={(e) => setEditNote(e.target.value)}
                                  rows={2}
                                  style={styles.inlineEditTextarea}
                                  placeholder="Not..."
                                />
                                <div style={{ display: 'flex', gap: 4 }}>
                                  <button type="button" style={styles.saveEditBtn} onClick={() => handleSaveEdit(flower.id)}>
                                    <Save size={12} /> Kaydet
                                  </button>
                                  <button type="button" style={styles.cancelEditBtn} onClick={handleCancelEdit}>
                                    <X size={12} /> İptal
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 220 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ fontSize: '0.8rem', color: noteText ? '#e2e8f0' : '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
                                    {noteText ? `"${noteText}"` : 'Not yok'}
                                  </span>
                                  {noteText && (
                                    <button
                                      type="button"
                                      onClick={() => setViewNoteFlower(flower)}
                                      style={styles.viewNoteBtn}
                                      title="Notu Tam Ekran Göster"
                                    >
                                      👁️ Göster
                                    </button>
                                  )}
                                </div>
                                {flower.isPrivate && (
                                  <div style={{ fontSize: '0.72rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <Lock size={11} /> Şifre: <code style={styles.codeTag}>{flower.password || 'Yok'}</code>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Passwords & Codes */}
                          <td style={styles.td}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: '0.78rem' }}>
                              {flower.isPrivate && (
                                <div style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 3 }}>
                                  <Key size={12} /> <code style={styles.codeTag}>{flower.password}</code>
                                </div>
                              )}
                              <div style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <ShieldAlert size={12} /> <code style={styles.codeTag}>{flower.deleteCode || 'K8X9P4M2'}</code>
                              </div>
                            </div>
                          </td>

                          {/* Animation, 20 Themes & Admin Comment Droplists */}
                          <td style={styles.td}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 160 }}>
                              {/* Animasyon Select */}
                              <select
                                value={flower.animation || ''}
                                onChange={(e) => patchFlower(flower.id, { animation: e.target.value || null })}
                                style={styles.animSelect}
                              >
                                {ANIMATIONS.map((anim) => (
                                  <option key={String(anim.key)} value={anim.key || ''} style={styles.animOption}>
                                    {anim.icon ? `${anim.icon} ${anim.label}` : anim.label}
                                  </option>
                                ))}
                              </select>

                              {/* 20 Kart Teması Select */}
                              <select
                                value={flower.theme || ''}
                                onChange={(e) => patchFlower(flower.id, { theme: e.target.value || null })}
                                style={styles.themeSelect}
                              >
                                {CARD_THEMES_OPTIONS.map((t) => (
                                  <option key={t.key} value={t.key} style={styles.animOption}>
                                    {t.label}
                                  </option>
                                ))}
                              </select>

                              {/* Admin Yorumu Input */}
                              <input
                                type="text"
                                placeholder="👑 Admin Yorumu..."
                                defaultValue={flower.adminComment || ''}
                                onBlur={(e) => patchFlower(flower.id, { adminComment: e.target.value.trim() || null })}
                                style={styles.adminCommentInput}
                              />
                            </div>
                          </td>

                          {/* Moderation Actions Column */}
                          <td style={styles.td}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 140 }}>
                              {flower.approved === 0 ? (
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <button
                                    type="button"
                                    style={styles.approveBtn}
                                    onClick={() => patchFlower(flower.id, { approved: 1 })}
                                    title="Onayla ve Canlı Haritada Göster"
                                  >
                                    <CheckCircle size={13} /> Onayla
                                  </button>

                                  <button
                                    type="button"
                                    style={styles.rejectBtn}
                                    onClick={() => {
                                      if (window.confirm(`"${flower.name || 'Anonim'}" çiçeğini reddedip silmek istediğinize emin misiniz?`)) {
                                        setLocalPatches((prev) => {
                                          const next = { ...prev };
                                          delete next[flower.id];
                                          return next;
                                        });
                                        onDeleteFlower(flower.id, flower.deleteCode);
                                      }
                                    }}
                                    title="Reddet / Çiçeği Sil"
                                  >
                                    <XCircle size={13} /> Reddet
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  style={styles.unapproveBtn}
                                  onClick={() => patchFlower(flower.id, { approved: 0 })}
                                  title="Onayı Geri Al (Onay Bekliyor Durumuna Getir)"
                                >
                                  <Clock size={12} /> Onayı Geri Al
                                </button>
                              )}

                              {/* Action Select Dropdown */}
                              <select
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === 'edit') handleStartEdit(flower);
                                  if (val === 'focus') { onFocusFlower(flower); onClose(); }
                                  if (val === 'delete') {
                                    if (window.confirm(`"${flower.name || 'Anonim'}" çiçeğini silmek istediğinize emin misiniz?`)) {
                                      setLocalPatches((prev) => {
                                        const next = { ...prev };
                                        delete next[flower.id];
                                        return next;
                                      });
                                      onDeleteFlower(flower.id, flower.deleteCode);
                                    }
                                  }
                                  if (val === 'note') setViewNoteFlower(flower);
                                  e.target.value = '';
                                }}
                                style={styles.actionsSelect}
                              >
                                <option value="">⚙️ Diğer İşlemler...</option>
                                <option value="edit">✏️ İsim & Not Düzenle</option>
                                <option value="note">👁️ Notu Tam Göster</option>
                                <option value="focus">📍 Haritada Göster</option>
                                <option value="delete">🗑️ Çiçeği Sil</option>
                              </select>
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

      {/* Clean Minified Note Preview Modal */}
      {viewNoteFlower && (
        <div style={styles.overlayNoteModal} onClick={() => setViewNoteFlower(null)}>
          <div style={styles.cardNoteModal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>
                🌸 {viewNoteFlower.name || 'Anonim'} Çiçeğinin Notu
              </h4>
              <button style={styles.closeBtn} onClick={() => setViewNoteFlower(null)}>
                <X size={18} color="#94a3b8" />
              </button>
            </div>
            <div style={{ background: 'rgba(30, 41, 59, 0.9)', padding: 14, borderRadius: 12, color: '#f1f5f9', fontSize: '0.9rem', lineHeight: 1.5, maxHeight: 180, overflowY: 'auto' }}>
              "{viewNoteFlower.note || 'Bu çiçeğe herhangi bir not eklenmemiş.'}"
            </div>
            {viewNoteFlower.isPrivate && (
              <div style={{ marginTop: 10, fontSize: '0.8rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Key size={13} /> Şifreli Not (Şifre: <code style={styles.codeTag}>{viewNoteFlower.password}</code>)
              </div>
            )}
            <button
              onClick={() => setViewNoteFlower(null)}
              className="btn-primary"
              style={{ width: '100%', marginTop: 14, padding: '8px', fontSize: '0.85rem' }}
            >
              Kapat
            </button>
          </div>
        </div>
      )}
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
    width: '96vw',
    maxWidth: 1380,
    height: '92vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    borderRadius: 24,
    padding: 24,
    background: 'rgba(15, 23, 42, 0.96)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    paddingBottom: 12,
    flexShrink: 0
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
  loginTitle: {
    fontSize: '1.3rem',
    fontWeight: 800,
    color: '#f8fafc',
    marginBottom: 6
  },
  loginSubtitle: {
    fontSize: '0.86rem',
    color: '#94a3b8',
    marginBottom: 20
  },
  loginForm: {
    width: '100%',
    maxWidth: 320,
    display: 'flex',
    flexDirection: 'column',
    gap: 12
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
    flex: 1,
    overflow: 'hidden',
    gap: 14
  },
  topFixedSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    flexShrink: 0
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
    padding: 14,
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
    flex: 1,
    overflowY: 'auto',
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
    position: 'sticky',
    top: 0,
    zIndex: 10,
    background: 'rgba(30, 41, 59, 0.98)',
    backdropFilter: 'blur(8px)',
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
  animSelect: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 10,
    background: 'rgba(30, 41, 59, 0.95)',
    border: '1px solid rgba(16, 185, 129, 0.4)',
    color: '#f8fafc',
    fontSize: '0.84rem',
    fontWeight: 600,
    outline: 'none',
    cursor: 'pointer'
  },
  animOption: {
    background: '#0f172a',
    color: '#f8fafc',
    fontSize: '0.86rem',
    padding: '6px'
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
  editBtn: {
    background: 'rgba(168, 85, 247, 0.18)',
    color: '#c084fc',
    border: '1px solid rgba(168, 85, 247, 0.35)',
    borderRadius: 10,
    padding: '6px 12px',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4
  },
  saveEditBtn: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: 8,
    padding: '6px 14px',
    fontSize: '0.82rem',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4
  },
  cancelEditBtn: {
    background: 'rgba(51, 65, 85, 0.8)',
    color: '#cbd5e1',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: '6px 12px',
    fontSize: '0.82rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4
  },
  inlineEditInput: {
    padding: '6px 10px',
    borderRadius: 8,
    border: '1px solid rgba(168, 85, 247, 0.4)',
    background: 'rgba(30, 41, 59, 0.9)',
    color: '#f8fafc',
    fontSize: '0.84rem',
    outline: 'none',
    width: '100%'
  },
  inlineEditTextarea: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid rgba(168, 85, 247, 0.4)',
    background: 'rgba(30, 41, 59, 0.9)',
    color: '#f8fafc',
    fontSize: '0.84rem',
    outline: 'none',
    resize: 'vertical'
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
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: '#ffffff',
    border: '1px solid #34d399',
    borderRadius: 10,
    padding: '6px 12px',
    fontSize: '0.8rem',
    fontWeight: 800,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
  },
  rejectBtn: {
    padding: '6px 10px',
    borderRadius: 10,
    background: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.5)',
    color: '#f87171',
    fontSize: '0.8rem',
    fontWeight: 800,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4
  },
  unapproveBtn: {
    padding: '5px 10px',
    borderRadius: 10,
    background: 'rgba(245, 158, 11, 0.18)',
    border: '1px solid rgba(245, 158, 11, 0.4)',
    color: '#fbbf24',
    fontSize: '0.76rem',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4
  },
  themeSelect: {
    width: '100%',
    padding: '6px 10px',
    borderRadius: 8,
    background: 'rgba(30, 41, 59, 0.95)',
    border: '1px solid rgba(245, 158, 11, 0.4)',
    color: '#fbbf24',
    fontSize: '0.78rem',
    fontWeight: 700,
    outline: 'none',
    cursor: 'pointer'
  },
  adminCommentInput: {
    width: '100%',
    padding: '5px 8px',
    borderRadius: 8,
    background: 'rgba(245, 158, 11, 0.12)',
    border: '1px dashed rgba(245, 158, 11, 0.5)',
    color: '#fffbeb',
    fontSize: '0.76rem',
    outline: 'none'
  },
  actionsSelect: {
    padding: '6px 10px',
    borderRadius: 8,
    background: 'rgba(51, 65, 85, 0.9)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    color: '#f8fafc',
    fontSize: '0.78rem',
    fontWeight: 700,
    outline: 'none',
    cursor: 'pointer'
  },
  viewNoteBtn: {
    padding: '2px 8px',
    borderRadius: 6,
    background: 'rgba(56, 189, 248, 0.2)',
    border: '1px solid rgba(56, 189, 248, 0.4)',
    color: '#38bdf8',
    fontSize: '0.74rem',
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  },
  overlayNoteModal: {
    position: 'fixed',
    inset: 0,
    zIndex: 3000,
    background: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  cardNoteModal: {
    width: '100%',
    maxWidth: 400,
    background: 'rgba(15, 23, 42, 0.98)',
    border: '1.5px solid rgba(56, 189, 248, 0.4)',
    borderRadius: 20,
    padding: 20,
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)'
  }
};
