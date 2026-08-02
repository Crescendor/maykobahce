import React, { useState } from 'react';
import { X, Check, Copy, Camera, ShieldCheck, ArrowRight } from 'lucide-react';

export default function DeleteCodeModal({ isOpen, flower, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !flower) return null;

  const deleteCode = flower.deleteCode || 'DEFAULT88';

  const handleCopy = () => {
    navigator.clipboard.writeText(deleteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={styles.overlay} className="animate-fade-in">
      <div style={styles.card} className="glass-card-light animate-slide-up">
        {/* Close Button */}
        <button style={styles.closeBtn} onClick={onClose}>
          <X size={20} />
        </button>

        {/* Success Icon */}
        <div style={styles.iconBadge}>
          <ShieldCheck size={32} color="#10b981" />
        </div>

        {/* Title & Description */}
        <h2 style={styles.title}>🌸 Çiçeğiniz Bahçeye Dikildi!</h2>
        <p style={styles.subtitle}>
          Çiçeğinize özel 8 haneli silme şifresi oluşturuldu.
        </p>

        {/* Code Box */}
        <div style={styles.codeBox}>
          <span style={styles.codeText}>{deleteCode}</span>
          <button style={styles.copyIconBtn} onClick={handleCopy} title="Şifreyi Kopyala">
            {copied ? <Check size={18} color="#10b981" /> : <Copy size={18} />}
          </button>
        </div>

        {/* Screenshot / Note Warning Alert */}
        <div style={styles.warningBox}>
          <Camera size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
          <p style={styles.warningText}>
            <strong>Önemli Uyarı:</strong> İleride bu çiçeği silmek isterseniz bu 8 haneli şifreye ihtiyacınız olacak.
            Lütfen şifrenin <strong>ekran görüntüsünü alın</strong> veya bir yere not edin!
          </p>
        </div>

        {/* Action Button */}
        <button type="button" className="btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={onClose}>
          {copied ? 'Kopyalandı! Çiçeği Görüntüle' : 'Şifreyi Kopyala ve Çiçeği Görüntüle'} <ArrowRight size={18} />
        </button>
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
    background: 'rgba(10, 25, 15, 0.8)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1400,
    padding: 16
  },
  card: {
    position: 'relative',
    width: '100%',
    maxWidth: 440,
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
    justifyContent: 'center'
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    background: '#d8f3dc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    border: '2px solid #52b788'
  },
  title: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.4rem',
    fontWeight: 800,
    color: '#0f172a',
    marginBottom: 6
  },
  subtitle: {
    fontSize: '0.86rem',
    color: '#64748b',
    marginBottom: 16
  },
  codeBox: {
    width: '100%',
    background: '#fef3c7',
    border: '2px dashed #f59e0b',
    borderRadius: 16,
    padding: '14px 18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: '1.6rem',
    fontWeight: 900,
    letterSpacing: 4,
    color: '#78350f'
  },
  copyIconBtn: {
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: 10,
    width: 38,
    height: 38,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },
  warningBox: {
    background: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: 16,
    padding: 12,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    textAlign: 'left'
  },
  warningText: {
    fontSize: '0.82rem',
    color: '#b45309',
    lineHeight: 1.4
  }
};
