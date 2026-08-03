import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Lock, Unlock, Share2, Check, ExternalLink, Trash2 } from 'lucide-react';
import InstagramIcon from './InstagramIcon';
import { drawSmoothStroke, drawStem } from '../utils/gardenEngine';

export default function FlowerPopup({ flower, onClose, onDeleteFlower }) {
  const previewCanvasRef = useRef(null);
  const [enteredPassword, setEnteredPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockError, setUnlockError] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Deletion State
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [deletePassInput, setDeletePassInput] = useState('');
  const [deleteError, setDeleteError] = useState(false);

  useEffect(() => {
    if (flower) {
      setIsUnlocked(!flower.isPrivate);
      setEnteredPassword('');
      setUnlockError(false);
      setCopiedLink(false);
      renderFlowerPreview();
    }
  }, [flower]);

  // Render Mini Flower Preview inside popup header
  const renderFlowerPreview = () => {
    if (!flower || !previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const stemScale = 1.8;
    const stemHeight = 50 * stemScale; // 90px
    const rootX = 120;
    const rootY = 175;
    const topY = rootY - stemHeight; // 85px

    // Draw Stem (Prominently scaled for preview card)
    ctx.save();
    ctx.translate(rootX, rootY);
    drawStem(ctx, flower.stemType || 'classic', flower.stemColor || '#52b788', stemScale);
    ctx.restore();

    // Draw Petal Bloom resting right on top tip of stem (petal base 150, 240)
    ctx.save();
    ctx.translate(rootX, topY);
    ctx.scale(0.46, 0.46);
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
  };

  if (!flower) return null;

  // Unlock Private Note Handler
  const handleUnlockPrivateNote = (e) => {
    e.preventDefault();
    setUnlockError(false);

    const targetPass = (flower.password || '').trim().toUpperCase();
    const inputPass = enteredPassword.trim().toUpperCase();

    if (inputPass === targetPass) {
      setIsUnlocked(true);
    } else {
      setUnlockError(true);
    }
  };

  // Copy Direct Link to Clipboard
  const handleCopyLink = () => {
    const directUrl = `${window.location.origin}${window.location.pathname}#flower-${flower.id}`;
    navigator.clipboard.writeText(directUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Format Timestamp
  const formattedDate = new Date(flower.createdAt).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const cleanIg = flower.instagram ? flower.instagram.replace(/^@/, '') : '';

  // Handle Delete Confirmation
  const handleConfirmDelete = (e) => {
    e.preventDefault();
    setDeleteError(false);

    const targetCode = (flower.deleteCode || '').trim().toUpperCase();
    const inputCode = deletePassInput.trim().toUpperCase();

    if (inputCode === targetCode && onDeleteFlower) {
      onDeleteFlower(flower.id, inputCode);
    } else {
      setDeleteError(true);
    }
  };

  return (
    <div style={styles.overlay} className="animate-fade-in">
      <div style={styles.card} className="glass-card-light animate-slide-up">
        {/* Close Button */}
        <button style={styles.closeBtn} onClick={onClose}>
          <X size={20} />
        </button>

        {/* Flower Header & Canvas */}
        <div style={styles.previewContainer}>
          <canvas ref={previewCanvasRef} width={240} height={200} />
        </div>

        {/* Creator Info */}
        <div style={styles.infoSection}>
          <h3 style={styles.creatorName}>
            {flower.name || 'Anonim'}
          </h3>

          {flower.instagram && (
            <a
              href={`https://instagram.com/${cleanIg}`}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.igLink}
            >
              <InstagramIcon size={16} /> {flower.instagram} <ExternalLink size={12} />
            </a>
          )}

          <p style={styles.timestamp}>
            <Calendar size={14} /> {formattedDate}
          </p>
        </div>

        {/* Note Content Section */}
        <div style={styles.noteSection}>
          {!flower.isPrivate || isUnlocked ? (
            /* Unlocked / Public Note */
            <div style={styles.unlockedNoteBox}>
              <p style={styles.noteText}>
                {flower.note ? `"${flower.note}"` : 'Bu çiçeğe yazılı bir not iliştirilmemiş.'}
              </p>
              {flower.isPrivate && (
                <span style={styles.unlockedBadge}>
                  <Unlock size={13} /> Şifreyle Açıldı
                </span>
              )}
            </div>
          ) : (
            /* Locked Private Note Prompt */
            <div style={styles.lockedBox} className={unlockError ? 'animate-shake' : ''}>
              <div style={styles.lockHeader}>
                <Lock size={22} color="#f59e0b" />
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#78350f' }}>
                  Bu Not Gizlidir
                </h4>
              </div>
              <p style={{ fontSize: '0.84rem', color: '#92400e', marginBottom: 12 }}>
                Notu okumak için 6 haneli erişim şifresini giriniz:
              </p>

              <form onSubmit={handleUnlockPrivateNote} style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Şifre Giriniz"
                  value={enteredPassword}
                  onChange={(e) => setEnteredPassword(e.target.value.toUpperCase())}
                  maxLength={6}
                  style={styles.passInput}
                />
                <button type="submit" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                  Aç
                </button>
              </form>

              {unlockError && (
                <p style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: 8, fontWeight: 600 }}>
                  ❌ Hatalı şifre! Lütfen tekrar deneyin.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Delete Prompt UI */}
        {showDeletePrompt && (
          <div style={styles.deletePromptCard} className="animate-fade-in">
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#991b1b', marginBottom: 6 }}>
              🗑️ Çiçeği Sil
            </h4>
            <p style={{ fontSize: '0.82rem', color: '#7f1d1d', marginBottom: 10 }}>
              Çiçeğinizi silmek için 8 haneli silme şifresini giriniz:
            </p>
            <form onSubmit={handleConfirmDelete} style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
              <input
                type="text"
                placeholder="8 haneli silme şifresi (Örn: K9X2M7P4)"
                value={deletePassInput}
                onChange={(e) => setDeletePassInput(e.target.value.toUpperCase())}
                maxLength={8}
                style={styles.deletePassInput}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1, padding: '8px' }}
                  onClick={() => setShowDeletePrompt(false)}
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1, padding: '8px', background: '#dc2626' }}
                >
                  Çiçeği Sil
                </button>
              </div>
            </form>
            {deleteError && (
              <p style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: 8, fontWeight: 600 }}>
                ❌ Hatalı silme şifresi!
              </p>
            )}
          </div>
        )}

        {/* Actions Footer */}
        <div style={styles.footer}>
          <button type="button" className="btn-secondary" style={styles.shareBtn} onClick={handleCopyLink}>
            {copiedLink ? <Check size={16} color="#10b981" /> : <Share2 size={16} />}
            {copiedLink ? 'Link Kopyalandı!' : 'Çiçek Bağlantısını Kopyala'}
          </button>

          {!showDeletePrompt && (
            <button
              type="button"
              style={styles.deleteBtn}
              onClick={() => setShowDeletePrompt(true)}
              title="Çiçeği Sil"
            >
              <Trash2 size={16} /> Çiçeği Sil
            </button>
          )}
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
    background: 'rgba(10, 25, 15, 0.65)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1100,
    padding: 16
  },
  card: {
    position: 'relative',
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center'
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    background: 'rgba(0,0,0,0.06)',
    border: 'none',
    width: 34,
    height: 34,
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#334155'
  },
  previewContainer: {
    background: 'linear-gradient(180deg, #d8f3dc 0%, #b7e4c7 100%)',
    borderRadius: 20,
    padding: 10,
    marginBottom: 16,
    border: '2px solid #52b788',
    display: 'flex',
    justifyContent: 'center'
  },
  infoSection: {
    width: '100%',
    marginBottom: 16
  },
  creatorName: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.4rem',
    fontWeight: 800,
    color: '#0f172a',
    marginBottom: 4
  },
  igLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    color: '#e1306c',
    fontSize: '0.92rem',
    fontWeight: 600,
    textDecoration: 'none',
    marginBottom: 6
  },
  timestamp: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    fontSize: '0.82rem',
    color: '#64748b'
  },
  noteSection: {
    width: '100%',
    marginBottom: 16
  },
  unlockedNoteBox: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 16,
    padding: 16,
    position: 'relative'
  },
  noteText: {
    fontStyle: 'italic',
    color: '#334155',
    fontSize: '0.96rem',
    lineHeight: 1.5
  },
  unlockedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    fontSize: '0.75rem',
    color: '#059669',
    fontWeight: 600
  },
  lockedBox: {
    background: '#fffbeb',
    border: '2px dashed #f59e0b',
    borderRadius: 16,
    padding: 16
  },
  lockHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 6
  },
  passInput: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: 10,
    border: '1px solid #cbd5e1',
    fontFamily: 'monospace',
    fontWeight: 700,
    fontSize: '1rem',
    letterSpacing: 2,
    textAlign: 'center'
  },
  footer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },
  shareBtn: {
    width: '100%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '12px'
  },
  deleteBtn: {
    width: '100%',
    background: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: 'var(--radius-md)',
    padding: '10px',
    fontWeight: 600,
    fontSize: '0.85rem',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    transition: 'all 0.2s ease'
  },
  deletePromptCard: {
    background: '#fef2f2',
    border: '2px dashed #fca5a5',
    borderRadius: 16,
    padding: 14,
    width: '100%',
    marginBottom: 12
  },
  deletePassInput: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 10,
    border: '1px solid #fca5a5',
    fontFamily: 'monospace',
    fontWeight: 700,
    fontSize: '0.95rem',
    letterSpacing: 2,
    textAlign: 'center'
  }
};
