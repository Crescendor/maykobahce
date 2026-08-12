import React from 'react';
import { X } from 'lucide-react';
import { postLogToApi, detectClientDevice } from '../utils/gardenEngine';

export default function MelancholyQuoteModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const handleProceed = () => {
    try {
      postLogToApi('melancholy_quote_viewed', {
        action: 'Hüzün Modu Karşılama Ekranı Görüldü / Bahçeye Geçildi',
        device: detectClientDevice(),
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        timestamp: new Date().toISOString()
      });
    } catch (e) {}
    onClose();
  };

  return (
    <div style={styles.overlay} className="animate-fade-in" onClick={handleProceed}>
      <div style={styles.card} className="animate-slide-up" onClick={(e) => e.stopPropagation()}>
        {/* Subtle Close Button */}
        <button style={styles.closeBtn} onClick={handleProceed} aria-label="Kapat">
          <X size={18} />
        </button>

        {/* Melancholic Flower Icon */}
        <div style={styles.iconWrapper}>
          <span style={{ fontSize: '2rem', filter: 'grayscale(100%) opacity(0.85)' }}>🥀</span>
        </div>

        {/* The Quote */}
        <blockquote style={styles.quoteText}>
          “Ayrılığın acısı, yeniden kavuşma umuduyla hafifler.”
        </blockquote>

        <cite style={styles.authorText}>
          — George Eliot
        </cite>

        <button style={styles.continueBtn} onClick={handleProceed}>
          Bahçeyi Gör
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(5, 5, 8, 0.88)',
    backdropFilter: 'blur(16px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4000,
    padding: 20
  },
  card: {
    width: '100%',
    maxWidth: 480,
    background: 'linear-gradient(180deg, rgba(20, 20, 25, 0.96) 0%, rgba(10, 10, 14, 0.98) 100%)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: 24,
    padding: '36px 32px 30px',
    boxShadow: '0 30px 70px rgba(0, 0, 0, 0.9), 0 0 30px rgba(255, 255, 255, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    position: 'relative'
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#94a3b8',
    width: 32,
    height: 32,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20
  },
  quoteText: {
    fontSize: '1.2rem',
    lineHeight: 1.6,
    fontStyle: 'italic',
    color: '#f1f5f9',
    fontWeight: 500,
    margin: '0 0 14px 0',
    letterSpacing: '0.01em',
    fontFamily: 'serif'
  },
  authorText: {
    fontSize: '0.92rem',
    color: '#94a3b8',
    fontWeight: 600,
    letterSpacing: '0.04em',
    marginBottom: 26,
    fontStyle: 'normal'
  },
  continueBtn: {
    padding: '10px 24px',
    borderRadius: 14,
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    color: '#f8fafc',
    fontSize: '0.88rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s'
  }
};
