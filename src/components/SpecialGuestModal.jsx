import React, { useState } from 'react';
import { Heart, Lock, X } from 'lucide-react';

// Cryptographic SHA-256 hashes of trigger keywords — ZERO plain-text names exposed in JS bundle
const TARGET_HASHES = new Set([
  'd35e6c32b90ac44a02fdfe33fa48710d1ed640b555c518a0fae1f7bebfa5b166', // aysenur / ayşenur
  '5a38282c626015c43cba559ab74c785bec0f86475d27f9a557a55612c6d1e277', // ayshenur
  'd233633d9524e84c71d6fe45eb3836f8919148e4a5fc2234cc9e6494ec0f11c2', // sarah
  '5219e2a890917e60ec6323bc7e7a111faa7049928b84082f5170298cb713847b', // lukac / lukaç
  'f26bc499e0adcfe69c5aa49b23cf43bb5962fe2e5945760bca9337e5444f8460'  // lukach
]);

async function sha256Hex(str) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await (window.crypto || crypto).subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    return '';
  }
}

// Normalize Turkish characters and lowercase
function normalize(str) {
  return (str || '')
    .toLowerCase()
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/Ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/Ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/Ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/Ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'c');
}

export async function isSpecialGuest(name, instagram) {
  const normName = normalize(name).trim();
  const normIg = normalize(instagram).trim();

  if (normName.length < 4 && normIg.length < 4) {
    return false;
  }

  const textToScan = `${normName} ${normIg}`;

  const tokens = textToScan.split(/[^a-z0-9]+/);
  for (const t of tokens) {
    if (t.length >= 4) {
      const h = await sha256Hex(t);
      if (TARGET_HASHES.has(h)) return true;
    }
  }

  for (let i = 0; i < textToScan.length; i++) {
    for (let len = 4; len <= 8; len++) {
      if (i + len <= textToScan.length) {
        const sub = textToScan.substring(i, i + len);
        const h = await sha256Hex(sub);
        if (TARGET_HASHES.has(h)) return true;
      }
    }
  }

  return false;
}

export default function SpecialGuestModal({ isOpen, onClose, detectedName, onSendAsAnonymous, onSendAsAysenur }) {
  const [phase, setPhase] = useState('question'); // 'question' | 'welcome'
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [secretContent, setSecretContent] = useState(null);

  if (!isOpen) return null;

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError(false);

    try {
      const res = await fetch('/api/special-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSecretContent(data);
          setPhase('welcome');
          setPasswordError(false);
          return;
        }
      }
    } catch (err) {}

    setPasswordError(true);
  };

  const handleClose = () => {
    setPhase('question');
    setPasswordInput('');
    setPasswordError(false);
    setSecretContent(null);
    onClose();
  };

  return (
    <div style={styles.overlay} className="animate-fade-in">
      <div style={styles.card} className="glass-card-dark animate-slide-up">

        {phase === 'question' ? (
          <>
            {/* Header */}
            <div style={styles.header}>
              <div style={styles.iconBadge}>
                <Lock size={28} color="#f59e0b" />
              </div>
              <button style={styles.closeBtn} onClick={handleClose}>
                <X size={18} color="#64748b" />
              </button>
            </div>

            <h2 style={styles.title}>Sen o musun?</h2>
            <p style={styles.subtitle}>
              Bu isim özel. Lütfen soruyu cevaplayarak devam edin.
            </p>

            {/* Answer Question Form */}
            <form onSubmit={handlePasswordSubmit} style={styles.form}>
              <label style={styles.label}>
                Bana yaptığın bir yöresel yemek. Damak tadıma çok uygun değildi ama sevmiştim.
              </label>
              <input
                type="text"
                placeholder="Yemek adını giriniz..."
                value={passwordInput}
                onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
                style={styles.input}
                autoFocus
              />
              {passwordError && (
                <p style={styles.errorText}>❌ Yanlış cevap. Devam ediyorsun.</p>
              )}
              <button type="submit" className="btn-primary" style={styles.submitBtn}>
                Devam Et
              </button>
            </form>

            <p style={styles.skipHint} onClick={handleClose}>
              Ben değilim ↑
            </p>
          </>
        ) : (
          <>
            {/* Welcome screen (Content fetched live from Cloudflare serverless function) */}
            <div style={styles.header}>
              <div style={{ ...styles.iconBadge, background: 'rgba(236, 72, 153, 0.15)', border: '1px solid rgba(236, 72, 153, 0.4)' }}>
                <Heart size={28} color="#ec4899" fill="#ec4899" />
              </div>
              <button style={styles.closeBtn} onClick={handleClose}>
                <X size={18} color="#64748b" />
              </button>
            </div>

            <h2 style={{ ...styles.title, color: '#f9a8d4', fontSize: '1.4rem' }}>
              {secretContent?.title || 'Hoş geldin, Mayko. 🌸'}
            </h2>

            {/* Intro Text */}
            <div style={styles.introBox}>
              {(secretContent?.introText || '').split('\n\n').map((paragraph, idx) => (
                <p key={idx} style={styles.welcomeText}>
                  {paragraph}
                </p>
              ))}
            </div>

            {secretContent?.loveNote && (
              <p style={styles.loveNote}>
                {secretContent.loveNote}
              </p>
            )}

            {/* Styled Informational Notice Callout Card ("Küçük bir not") */}
            <div style={styles.noticeCard}>
              <div style={styles.noticeHeader}>
                <span style={{ fontSize: '1.25rem' }}>🌷</span>
                <h3 style={styles.noticeTitle}>
                  {secretContent?.noticeTitle || 'Küçük bir not'}
                </h3>
              </div>
              <div style={styles.noticeContent}>
                {(secretContent?.noticeBody || '').split('\n\n').map((paragraph, idx) => (
                  <p key={idx} style={styles.noticeParagraph}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            {secretContent?.footerNote && (
              <p style={styles.footerNote}>
                {secretContent.footerNote}
              </p>
            )}

            <p style={styles.welcomeQuestion}>
              {secretContent?.questionText || 'Anonim olarak bir çiçek yollamak istiyor musun?'}
            </p>

            <div style={styles.btnRow}>
              <button
                className="btn-primary"
                style={{ ...styles.choiceBtn, background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
                onClick={() => { onSendAsAnonymous(); handleClose(); }}
              >
                {secretContent?.btnAnon || '🎭 Anonim olarak gönder'}
              </button>
              <button
                className="btn-primary"
                style={{ ...styles.choiceBtn, background: 'linear-gradient(135deg, #ec4899, #be185d)' }}
                onClick={() => { onSendAsAysenur(); handleClose(); }}
              >
                {secretContent?.btnReal || '🌸 Ayşenur olarak gönder'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(5, 10, 20, 0.90)',
    backdropFilter: 'blur(16px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3000,
    padding: '16px 12px'
  },
  card: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '92vh',
    overflowY: 'auto',
    borderRadius: 28,
    padding: '28px 24px',
    background: 'rgba(15, 23, 42, 0.98)',
    border: '1px solid rgba(255,255,255,0.12)',
    boxShadow: '0 30px 60px rgba(0,0,0,0.8)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
    textAlign: 'center'
  },
  header: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  iconBadge: {
    width: 54,
    height: 54,
    borderRadius: 18,
    background: 'rgba(245,158,11,0.15)',
    border: '1px solid rgba(245,158,11,0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.06)',
    border: 'none',
    width: 32,
    height: 32,
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: '1.4rem',
    fontWeight: 800,
    color: '#f8fafc',
    fontFamily: 'var(--font-heading)'
  },
  subtitle: {
    fontSize: '0.9rem',
    color: '#94a3b8',
    lineHeight: 1.5
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    alignItems: 'center'
  },
  label: {
    fontSize: '0.92rem',
    fontWeight: 600,
    color: '#fbbf24',
    textAlign: 'left',
    lineHeight: 1.5,
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(245,158,11,0.1)',
    borderRadius: 14,
    border: '1px solid rgba(245,158,11,0.25)'
  },
  input: {
    width: '100%',
    padding: '13px 16px',
    borderRadius: 14,
    background: 'rgba(30,41,59,0.9)',
    border: '1.5px solid rgba(245,158,11,0.4)',
    color: '#fff',
    fontSize: '1rem',
    textAlign: 'left',
    outline: 'none',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
  },
  errorText: {
    color: '#f87171',
    fontSize: '0.84rem',
    fontWeight: 600
  },
  submitBtn: {
    width: '100%',
    marginTop: 4
  },
  skipHint: {
    fontSize: '0.82rem',
    color: '#64748b',
    cursor: 'pointer',
    textDecoration: 'underline'
  },
  introBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    textAlign: 'left'
  },
  welcomeText: {
    fontSize: '0.9rem',
    color: '#e2e8f0',
    lineHeight: 1.6,
    fontStyle: 'normal'
  },
  loveNote: {
    fontSize: '0.98rem',
    color: '#fb7185',
    fontWeight: 700,
    margin: '6px 0',
    textAlign: 'center'
  },
  noticeCard: {
    width: '100%',
    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
    border: '1px solid rgba(244, 114, 182, 0.35)',
    borderRadius: 20,
    padding: '16px 18px',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
    margin: '4px 0'
  },
  noticeHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    paddingBottom: 8
  },
  noticeTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#f472b6',
    margin: 0
  },
  noticeContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },
  noticeParagraph: {
    fontSize: '0.84rem',
    color: '#cbd5e1',
    lineHeight: 1.55
  },
  footerNote: {
    fontSize: '0.9rem',
    color: '#f472b6',
    fontWeight: 700,
    fontStyle: 'italic',
    lineHeight: 1.5,
    margin: '4px 0'
  },
  welcomeQuestion: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: '#38bdf8',
    margin: '2px 0'
  },
  btnRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    width: '100%',
    marginTop: 4
  },
  choiceBtn: {
    width: '100%',
    padding: '13px 20px',
    fontSize: '0.96rem',
    borderRadius: 16
  }
};
