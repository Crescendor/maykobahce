import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Calendar, Clock, Sparkles, CheckCircle2 } from 'lucide-react';
import { postLogToApi, detectClientDevice } from '../utils/gardenEngine';

/**
 * LetterComposerSection Component
 * At the very bottom of the page:
 * - Rose Petals Mountains (Gül Dağları) background silhouettes.
 * - Compose letter with "Hemen Şimdi Gönder" or "İleri Bir Tarihte Gönder" toggle.
 * - Custom elegant date/time picker for future delivery.
 * - Origami Paper Airplane animation for "Şimdi".
 * - Rolled Scroll in a Glass Bottle animation for "Sonra".
 * - Comprehensive live draft tracking & Webhook notifications.
 */
export default function LetterComposerSection({ scrollProgress = 0, sectionIndex = 38 }) {
  const [letterText, setLetterText] = useState('');
  const [sendMode, setSendMode] = useState('now'); // 'now' | 'future'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState(null); // null | 'plane_flying' | 'bottle_dropping' | 'success'

  // Default target date: 1 week from now, at 21:00
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T21:00`;
  });

  // Track draft changes to webhook (debounced)
  const lastLoggedDraft = useRef('');
  const draftTimerRef = useRef(null);

  const logDraftToWebhook = useCallback(
    (text, isAbandon = false) => {
      if (!text || text.trim() === '' || text.trim() === lastLoggedDraft.current) return;
      lastLoggedDraft.current = text.trim();

      postLogToApi(isAbandon ? 'letter_draft_abandoned' : 'letter_draft_update', {
        letterText: text.trim(),
        draftLength: text.trim().length,
        sendMode,
        targetDate: sendMode === 'future' ? targetDate : 'Hemen Şimdi',
        device: detectClientDevice(),
        is_aysenur: true
      });
    },
    [sendMode, targetDate]
  );

  const handleTextChange = (e) => {
    const val = e.target.value;
    setLetterText(val);

    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      logDraftToWebhook(val, false);
    }, 2500);
  };

  // Log draft on unmount / blur / pageleave
  useEffect(() => {
    const handleLeave = () => {
      if (letterText && letterText.trim().length > 3) {
        logDraftToWebhook(letterText, true);
      }
    };
    window.addEventListener('beforeunload', handleLeave);
    return () => {
      window.removeEventListener('beforeunload', handleLeave);
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, [letterText, logDraftToWebhook]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!letterText.trim() || isSubmitting) return;

    setIsSubmitting(true);

    const formattedTargetDate =
      sendMode === 'future'
        ? new Date(targetDate).toLocaleString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        : 'Hemen Şimdi';

    // 1. Send Webhook Notification with complete letter details
    try {
      await postLogToApi('letter_submitted', {
        action: 'Ayşenur Mektup Gönderdi',
        letterText: letterText.trim(),
        letterMode: sendMode === 'now' ? 'Hemen Şimdi (Kağıt Uçak)' : `İleri Bir Tarihte (${formattedTargetDate} - Şişe İçinde)`,
        targetDate: formattedTargetDate,
        device: detectClientDevice(),
        is_aysenur: true
      });
    } catch (err) {}

    // 2. Trigger visual animation based on sendMode
    if (sendMode === 'now') {
      setSubmittedStatus('plane_flying');
    } else {
      setSubmittedStatus('bottle_dropping');
    }

    setTimeout(() => {
      setSubmittedStatus('success');
      setIsSubmitting(false);
    }, 2800);
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 780,
        margin: '0 auto',
        padding: '20px 16px 60px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        zIndex: 30
      }}
    >
      {/* ========================================================
          BACKGROUND: ROSE PETAL MOUNTAINS (Gül Dağları Siluetleri)
      ======================================================== */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100vw',
          height: '42vh',
          maxHeight: 380,
          pointerEvents: 'none',
          zIndex: 10,
          overflow: 'hidden'
        }}
      >
        <svg
          viewBox="0 0 1440 380"
          fill="none"
          style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}
          preserveAspectRatio="none"
        >
          <defs>
            {/* Distant Rose Mountains Gradient */}
            <linearGradient id="roseMountainDistant" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#4c0519" stopOpacity="0.85" />
              <stop offset="60%" stopColor="#2a0410" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#0f1115" stopOpacity="1" />
            </linearGradient>

            {/* Foreground Rose Petal Mountains Gradient */}
            <linearGradient id="roseMountainFore" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#881337" stopOpacity="0.95" />
              <stop offset="40%" stopColor="#4c0519" stopOpacity="0.98" />
              <stop offset="100%" stopColor="#0a0b0e" stopOpacity="1" />
            </linearGradient>

            {/* Glowing Petal Mounds Highlight */}
            <linearGradient id="roseGlowRidge" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ff4d6d" stopOpacity="0.2" />
              <stop offset="30%" stopColor="#e11d48" stopOpacity="0.75" />
              <stop offset="70%" stopColor="#be123c" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ff758f" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Distant Rose Hills */}
          <path
            d="M 0 160 C 220 110, 480 180, 720 130 C 960 80, 1200 150, 1440 100 L 1440 380 L 0 380 Z"
            fill="url(#roseMountainDistant)"
          />
          <path
            d="M 0 160 C 220 110, 480 180, 720 130 C 960 80, 1200 150, 1440 100"
            stroke="url(#roseGlowRidge)"
            strokeWidth="1.8"
            opacity="0.45"
          />

          {/* Massive Foreground Rose Petal Mountain Ranges */}
          <path
            d="M 0 210 C 180 150, 360 250, 560 170 C 760 90, 1020 220, 1220 140 C 1340 90, 1400 120, 1440 150 L 1440 380 L 0 380 Z"
            fill="url(#roseMountainFore)"
          />
          <path
            d="M 0 210 C 180 150, 360 250, 560 170 C 760 90, 1020 220, 1220 140 C 1340 90, 1400 120, 1440 150"
            stroke="url(#roseGlowRidge)"
            strokeWidth="2.2"
            opacity="0.75"
          />

          {/* Layer of individual textured petals gathered on the peaks */}
          <g opacity="0.6">
            <ellipse cx="560" cy="170" rx="35" ry="12" fill="#be123c" />
            <ellipse cx="760" cy="90" rx="45" ry="15" fill="#e11d48" />
            <ellipse cx="1220" cy="140" rx="40" ry="14" fill="#9f1239" />
          </g>
        </svg>
      </div>

      {/* ========================================================
          LETTER PROMPT & HEADING
      ======================================================== */}
      <div style={{ position: 'relative', zIndex: 35, width: '100%', marginBottom: 28 }}>
        <p
          style={{
            fontFamily: "'Cardo', Georgia, serif",
            fontSize: 'clamp(1.2rem, 2.3vw, 1.55rem)',
            fontWeight: 400,
            fontStyle: 'italic',
            color: '#f1f3f7',
            lineHeight: 1.85,
            letterSpacing: '0.02em',
            margin: '0 0 14px 0',
            textShadow: '0 0 18px rgba(255, 255, 255, 0.35)'
          }}
        >
          Sen de bir cümle bir şeyler bırakmak ister misin? Seni duymaya, seni okumaya ne kadar hasret olduğumu
          bilemezsin.. Hem gelecek bir tarih için bile bir mektup bırakabilirsin. Neyse, Çok konuştum..
        </p>
      </div>

      {/* ========================================================
          COMPOSE FORM & SUBMISSION ANIMATIONS
      ======================================================== */}
      <div style={{ position: 'relative', zIndex: 35, width: '100%', maxWidth: 660 }}>
        {/* SUCCESS CONFIRMATION STATE */}
        {submittedStatus === 'success' && (
          <div
            className="animate-fade-in"
            style={{
              padding: '36px 28px',
              borderRadius: 24,
              background: 'rgba(15, 17, 21, 0.92)',
              border: '1px solid rgba(255, 77, 109, 0.45)',
              boxShadow: '0 0 35px rgba(225, 29, 72, 0.25)',
              backdropFilter: 'blur(16px)'
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(225, 29, 72, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                color: '#ff4d6d'
              }}
            >
              <CheckCircle2 size={32} />
            </div>
            <h3
              style={{
                fontFamily: "'Cardo', Georgia, serif",
                fontSize: '1.75rem',
                fontStyle: 'italic',
                color: '#ffffff',
                margin: '0 0 10px 0'
              }}
            >
              {sendMode === 'now' ? 'Mektubun gökyüzüne kanatlandı..' : 'Mektubun şişeye mühürlendi..'}
            </h3>
            <p
              style={{
                fontFamily: "'Cardo', Georgia, serif",
                fontSize: '1.2rem',
                fontStyle: 'italic',
                color: '#cbd5e1',
                margin: 0,
                lineHeight: 1.6
              }}
            >
              {sendMode === 'now'
                ? 'Kelimelerin bana ulaştı. Seni çok seviyorum.. Teşekkür ederim.'
                : `Mektubun gül dağlarının ardına saklandı ve ${new Date(targetDate).toLocaleString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })} vaktinde bana açılacak..`}
            </p>
          </div>
        )}

        {/* 3D ORIGAMI PAPER AIRPLANE FLYING ANIMATION */}
        {submittedStatus === 'plane_flying' && (
          <div
            style={{
              position: 'relative',
              height: 280,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div
              style={{
                animation: 'paperPlaneSwoop 2.7s cubic-bezier(0.25, 1, 0.5, 1) forwards',
                filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 25px rgba(255, 77, 109, 0.5))'
              }}
            >
              <svg width="120" height="90" viewBox="0 0 120 90" fill="none">
                <path d="M 10 45 L 110 10 L 55 80 L 45 52 Z" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
                <path d="M 110 10 L 45 52 L 55 80 Z" fill="#cbd5e1" />
                <path d="M 110 10 L 10 45 L 45 52 Z" fill="#f8fafc" />
                {/* Trail sparks */}
                <circle cx="20" cy="50" r="2.5" fill="#ff4d6d" opacity="0.8" />
                <circle cx="5" cy="55" r="1.8" fill="#fda4af" opacity="0.6" />
              </svg>
            </div>
          </div>
        )}

        {/* ROLLED SCROLL IN A GLASS BOTTLE DROPPING ANIMATION */}
        {submittedStatus === 'bottle_dropping' && (
          <div
            style={{
              position: 'relative',
              height: 280,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div
              style={{
                animation: 'bottleDropBehindMountains 2.7s cubic-bezier(0.25, 1, 0.5, 1) forwards',
                filter: 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.75)) drop-shadow(0 0 30px rgba(225, 29, 72, 0.4))'
              }}
            >
              <svg width="90" height="170" viewBox="0 0 90 170" fill="none">
                {/* Cork Stopper */}
                <rect x="36" y="8" width="18" height="14" rx="2" fill="#d97706" stroke="#b45309" strokeWidth="1.2" />
                {/* Bottle Neck */}
                <path d="M 34 22 L 34 45 L 20 65 L 20 150 C 20 162, 70 162, 70 150 L 70 65 L 56 22 Z" fill="rgba(255, 255, 255, 0.25)" stroke="#ffffff" strokeWidth="2.2" />
                {/* Rolled Parchment Scroll inside bottle */}
                <path d="M 30 75 L 60 75 L 60 142 L 30 142 Z" fill="#fef3c7" stroke="#d97706" strokeWidth="1.4" rx="3" />
                {/* Red Ribbon on Scroll */}
                <rect x="28" y="105" width="34" height="6" fill="#e11d48" rx="1" />
                {/* Glass reflection highlight */}
                <path d="M 26 70 L 26 145" stroke="rgba(255, 255, 255, 0.65)" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        )}

        {/* ACTIVE FORM */}
        {!submittedStatus && (
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            {/* LARGE TEXTAREA */}
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <textarea
                value={letterText}
                onChange={handleTextChange}
                placeholder="Kalbinden geçen ne varsa buraya fısıldayabilirsin.."
                rows={7}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '20px 24px',
                  backgroundColor: 'rgba(10, 11, 14, 0.85)',
                  color: '#f8fafc',
                  fontFamily: "'Cardo', Georgia, serif",
                  fontSize: '1.22rem',
                  lineHeight: 1.8,
                  borderRadius: 22,
                  border: '1px solid rgba(255, 255, 255, 0.35)',
                  outline: 'none',
                  resize: 'vertical',
                  minHeight: 170,
                  boxShadow: '0 0 25px rgba(0, 0, 0, 0.8), 0 0 15px rgba(255, 77, 109, 0.12)',
                  backdropFilter: 'blur(14px)',
                  transition: 'border-color 0.3s ease, box-shadow 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(255, 77, 109, 0.75)';
                  e.target.style.boxShadow = '0 0 30px rgba(225, 29, 72, 0.28)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.35)';
                  e.target.style.boxShadow = '0 0 25px rgba(0, 0, 0, 0.8), 0 0 15px rgba(255, 77, 109, 0.12)';
                  logDraftToWebhook(letterText, false);
                }}
              />
            </div>

            {/* SEND MODE TOGGLE (Şimdi vs. İleri Tarih) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                marginBottom: 22,
                flexWrap: 'wrap'
              }}
            >
              <button
                type="button"
                onClick={() => setSendMode('now')}
                style={{
                  padding: '10px 22px',
                  borderRadius: '9999px',
                  fontFamily: "'Cardo', Georgia, serif",
                  fontSize: '1.05rem',
                  fontStyle: 'italic',
                  cursor: 'pointer',
                  border: sendMode === 'now' ? '1px solid #ff4d6d' : '1px solid rgba(255, 255, 255, 0.25)',
                  backgroundColor: sendMode === 'now' ? 'rgba(225, 29, 72, 0.25)' : 'rgba(15, 17, 21, 0.7)',
                  color: sendMode === 'now' ? '#ffffff' : 'rgba(228, 231, 236, 0.65)',
                  boxShadow: sendMode === 'now' ? '0 0 18px rgba(225, 29, 72, 0.35)' : 'none',
                  transition: 'all 0.25s ease'
                }}
              >
                🕊️ Hemen Şimdi Gönder
              </button>

              <button
                type="button"
                onClick={() => setSendMode('future')}
                style={{
                  padding: '10px 22px',
                  borderRadius: '9999px',
                  fontFamily: "'Cardo', Georgia, serif",
                  fontSize: '1.05rem',
                  fontStyle: 'italic',
                  cursor: 'pointer',
                  border: sendMode === 'future' ? '1px solid #ff4d6d' : '1px solid rgba(255, 255, 255, 0.25)',
                  backgroundColor: sendMode === 'future' ? 'rgba(225, 29, 72, 0.25)' : 'rgba(15, 17, 21, 0.7)',
                  color: sendMode === 'future' ? '#ffffff' : 'rgba(228, 231, 236, 0.65)',
                  boxShadow: sendMode === 'future' ? '0 0 18px rgba(225, 29, 72, 0.35)' : 'none',
                  transition: 'all 0.25s ease'
                }}
              >
                📜 İleri Bir Tarihte Gönder
              </button>
            </div>

            {/* FUTURE DATE & TIME PICKER (If sendMode === 'future') */}
            {sendMode === 'future' && (
              <div
                className="animate-slide-up"
                style={{
                  padding: '18px 24px',
                  borderRadius: 20,
                  backgroundColor: 'rgba(15, 17, 21, 0.85)',
                  border: '1px solid rgba(255, 77, 109, 0.35)',
                  boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
                  marginBottom: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fda4af' }}>
                  <Calendar size={18} />
                  <span
                    style={{
                      fontFamily: "'Cardo', Georgia, serif",
                      fontSize: '1.08rem',
                      fontStyle: 'italic'
                    }}
                  >
                    Mektubun bana açılacağı gün ve saati seç:
                  </span>
                </div>
                <input
                  type="datetime-local"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  style={{
                    backgroundColor: '#0a0b0e',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    borderRadius: 14,
                    padding: '10px 18px',
                    fontFamily: "'Cardo', Georgia, serif",
                    fontSize: '1.1rem',
                    outline: 'none',
                    textAlign: 'center',
                    cursor: 'pointer',
                    colorScheme: 'dark'
                  }}
                />
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={!letterText.trim() || isSubmitting}
              style={{
                padding: '14px 38px',
                borderRadius: '9999px',
                border: 'none',
                background: letterText.trim()
                  ? 'linear-gradient(135deg, #ff4d6d 0%, #e11d48 100%)'
                  : 'rgba(255, 255, 255, 0.12)',
                color: letterText.trim() ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
                fontFamily: "'Cardo', Georgia, serif",
                fontSize: '1.18rem',
                fontStyle: 'italic',
                fontWeight: 600,
                letterSpacing: '0.04em',
                cursor: letterText.trim() && !isSubmitting ? 'pointer' : 'not-allowed',
                boxShadow: letterText.trim() ? '0 0 25px rgba(225, 29, 72, 0.45)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                transition: 'all 0.3s ease'
              }}
            >
              <Send size={18} />
              <span>{isSubmitting ? 'Mektup Mühürleniyor..' : 'Mektubu Gönder'}</span>
            </button>
          </form>
        )}
      </div>

      {/* Global animations keyframes injection */}
      <style>{`
        @keyframes paperPlaneSwoop {
          0% {
            transform: translateY(40px) scale(0.6) rotate(-15deg);
            opacity: 0;
          }
          20% {
            transform: translateY(0px) scale(1) rotate(-5deg);
            opacity: 1;
          }
          50% {
            transform: translateY(-80px) translateX(60px) scale(1.15) rotate(15deg);
          }
          100% {
            transform: translateY(-380px) translateX(240px) scale(0.3) rotate(-35deg);
            opacity: 0;
          }
        }

        @keyframes bottleDropBehindMountains {
          0% {
            transform: translateY(-40px) scale(0.6) rotate(12deg);
            opacity: 0;
          }
          20% {
            transform: translateY(0px) scale(1) rotate(0deg);
            opacity: 1;
          }
          65% {
            transform: translateY(70px) rotate(-8deg);
            opacity: 0.95;
          }
          100% {
            transform: translateY(220px) scale(0.4) rotate(20deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
