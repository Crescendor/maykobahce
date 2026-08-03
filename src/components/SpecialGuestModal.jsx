import React, { useState } from 'react';
import { Heart, Lock, X } from 'lucide-react';

// Cryptographic SHA-256 hashes of trigger keywords — ZERO plain-text words exposed in JS bundle
const TARGET_HASHES = new Set([
  'd35e6c32b90ac44a02fdfe33fa48710d1ed640b555c518a0fae1f7bebfa5b166',
  'd233633d9524e84c71d6fe45eb3836f8919148e4a5fc2234cc9e6494ec0f11c2',
  '5219e2a890917e60ec6323bc7e7a111faa7049928b84082f5170298cb713847b',
  'f26bc499e0adcfe69c5aa49b23cf43bb5962fe2e5945760bca9337e5444f8460'
]);

// Base64 decoder helper to prevent static text scraping in bundle
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

// Normalize Turkish i/ı differences and lowercase
function normalize(str) {
  return (str || '')
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

export async function isSpecialGuest(name, instagram) {
  const normName = normalize(name).trim();
  const normIg = normalize(instagram).trim();

  // Explicit length guard: empty, short, or normal inputs shorter than 4 chars NEVER trigger
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

            <h2 style={styles.title}>{b64('U2VuIG8gbXVzdW4/')}</h2>
            <p style={styles.subtitle}>
              {b64('QnUgaXNpbSDDtnplbC4gxZ5pbWRpIMWfaWZyZXlpIHPDtnlsZS4=')}
            </p>

            {/* Password form */}
            <form onSubmit={handlePasswordSubmit} style={styles.form}>
              <label style={styles.label}>{b64('QmFiYW7EsW4gYWTEsT8=')}</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
                style={styles.input}
                autoFocus
              />
              {passwordError && (
                <p style={styles.errorText}>{b64('4p2MIFlhbmzEscWfY2V2YXAuIERldmFtIGVkaXlvcnN1bi4=')}</p>
              )}
              <button type="submit" className="btn-primary" style={styles.submitBtn}>
                {b64('RGV2YW0gRXQ=')}
              </button>
            </form>

            <p style={styles.skipHint} onClick={handleClose}>
              {b64('QmVuIGRlxJ9pbGltIOKGkQ==')}
            </p>
          </>
        ) : (
          <>
            {/* Welcome screen (Content fetched live from serverless function after authentication) */}
            <div style={styles.header}>
              <div style={{ ...styles.iconBadge, background: 'rgba(236, 72, 153, 0.15)', border: '1px solid rgba(236, 72, 153, 0.4)' }}>
                <Heart size={28} color="#ec4899" fill="#ec4899" />
              </div>
            </div>

            <h2 style={{ ...styles.title, color: '#f9a8d4' }}>{secretContent?.title || b64('QmFow6dlbmUgaG/FnyBnZWxkaW4uIPCfjLg=')}</h2>

            <p style={styles.welcomeText}>
              {secretContent?.text || ''}
            </p>

            {secretContent?.loveNote && (
              <p style={{ fontSize: '0.92rem', color: '#f472b6', fontWeight: 700, fontStyle: 'italic', margin: '4px 0' }}>
                {secretContent.loveNote}
              </p>
            )}

            <p style={styles.welcomeQuestion}>
              {b64('QW5vbmltIG9sYXJhayBiaXIgw6dpw6dlayB5b2xsYW1hayBpc3RpeW9yIG11c3VuPw==')}
            </p>

            <div style={styles.btnRow}>
              <button
                className="btn-primary"
                style={{ ...styles.choiceBtn, background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
                onClick={() => { onSendAsAnonymous(); handleClose(); }}
              >
                {secretContent?.btnAnon || b64('8J+OryBBbm9uaW0gb2xhcmFrIGfDtm5kZXI=')}
              </button>
              <button
                className="btn-primary"
                style={{ ...styles.choiceBtn, background: 'linear-gradient(135deg, #ec4899, #be185d)' }}
                onClick={() => { onSendAsAysenur(); handleClose(); }}
              >
                {secretContent?.btnReal || b64('8J+MuCBBecWfZW51ciBvYmFyYWsgZ8O2bmRlcg==')}
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
    background: 'rgba(5, 10, 20, 0.88)',
    backdropFilter: 'blur(16px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3000,
    padding: 20
  },
  card: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 28,
    padding: '32px 28px',
    background: 'rgba(15, 23, 42, 0.97)',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 30px 60px rgba(0,0,0,0.7)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    textAlign: 'center'
  },
  header: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  iconBadge: {
    width: 60,
    height: 60,
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
    fontSize: '1.5rem',
    fontWeight: 800,
    color: '#f8fafc',
    fontFamily: 'var(--font-heading)'
  },
  subtitle: {
    fontSize: '0.95rem',
    color: '#94a3b8',
    lineHeight: 1.5
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    alignItems: 'center'
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#e2e8f0',
    alignSelf: 'flex-start'
  },
  input: {
    width: '100%',
    padding: '13px 16px',
    borderRadius: 14,
    background: 'rgba(30,41,59,0.8)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: '#fff',
    fontSize: '1.1rem',
    textAlign: 'center',
    letterSpacing: 4,
    outline: 'none'
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
    color: '#475569',
    cursor: 'pointer',
    textDecoration: 'underline'
  },
  welcomeText: {
    fontSize: '0.9rem',
    color: '#cbd5e1',
    lineHeight: 1.75,
    fontStyle: 'italic',
    maxWidth: 380
  },
  welcomeQuestion: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#f9a8d4',
    fontStyle: 'italic'
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
    fontSize: '0.96rem'
  }
};
