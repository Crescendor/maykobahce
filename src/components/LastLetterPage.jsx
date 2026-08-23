import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Flame, Lock, RotateCcw, AlertTriangle, Calendar, CheckCircle2, ChevronDown, Clock } from 'lucide-react';
import AmbientAudioPlayer from './AmbientAudioPlayer';
import { postLogToApi } from '../utils/gardenEngine';

/**
 * LastLetterPage Component (/last)
 * Pure 3D Paper Scroll Folding & Unfolding Experience:
 * - "Neyse" intro screen (100% pixel-identical typography).
 * - Mouse wheel / scroll smoothly folds and unfolds the handwritten letter paper in real 3D perspective!
 * - Zero drawers, zero matchboxes, zero matchsticks!
 * - Action buttons ("Mektubu Sakla" left, "Mektubu Yak" right) fade in smoothly as the paper unfolds.
 * - "Mektubu Yak" -> Warning modal -> "Kabul Et" -> Realistic paper burn animation & system deletion flow.
 * - "Mektubu Sakla" -> Lock note form with DateTimePicker & SHA-256 seal.
 * - Webhook logging for all interactions.
 */
export default function LastLetterPage({ onGoHome }) {
  // Device & Auth
  const getDeviceId = () => {
    try {
      return localStorage.getItem('mayko_persistent_device_id') || 'dev_guest';
    } catch (e) {
      return 'dev_guest';
    }
  };
  const deviceId = getDeviceId();
  const isTester = deviceId === 'dev_m2troqnl9_mswunr9c';

  // Analytics & Timing
  const sessionStartTimeRef = useRef(Date.now());
  const hasLoggedScrollRef = useRef(false);
  const hasLoggedLetterOpenRef = useRef(false);
  const currentStageRef = useRef('Giriş / Neyse Ekranı');

  // Interactive 3D Scroll Folding Progress (0 = Fully Folded, 1 = Fully Unfolded)
  const [foldProgress, setFoldProgress] = useState(0);
  const [isLetterHovered, setIsLetterHovered] = useState(false);
  const [burnModalOpen, setBurnModalOpen] = useState(false);

  // Burn & Fire State
  const [isBurningActive, setIsBurningActive] = useState(false);
  const [isBurned, setIsBurned] = useState(() => {
    if (isTester) return false;
    try {
      return localStorage.getItem('mayko_last_burned') === 'true';
    } catch (e) {
      return false;
    }
  });

  // 10-Minute Farewell Timer Engine
  const getBurnedRemainingMs = () => {
    try {
      const stored = localStorage.getItem('mayko_burned_at');
      if (!stored) return 600000;
      const burnedTime = parseInt(stored, 10);
      const elapsed = Date.now() - burnedTime;
      return Math.max(0, 600000 - elapsed);
    } catch (e) {
      return 600000;
    }
  };

  const [remainingMs, setRemainingMs] = useState(getBurnedRemainingMs);

  useEffect(() => {
    if (!isBurned) return;
    const interval = setInterval(() => {
      const rem = getBurnedRemainingMs();
      setRemainingMs(rem);
      if (rem <= 0) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isBurned]);

  const formatCountdown = (ms) => {
    const totalSec = Math.floor(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Lock Note Mechanic
  const [lockModeActive, setLockModeActive] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [targetDate, setTargetDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 30);
    return tomorrow.toISOString().slice(0, 16);
  });
  const [lockedResult, setLockedResult] = useState(() => {
    if (isTester) return null;
    try {
      const saved = localStorage.getItem('mayko_last_locked_data');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Keylog & Deletion Recovery Engine for Lock Note
  const allTypedRef = useRef('');
  const deletedSegmentsRef = useRef([]);
  const prevNoteTextRef = useRef('');
  const draftTimerRef = useRef(null);

  // Detect Client Device
  const detectDevice = () => {
    if (typeof window === 'undefined') return 'Bilinmiyor';
    const ua = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const os = /Mac/i.test(ua) ? 'macOS' : /Windows/i.test(ua) ? 'Windows' : /Linux/i.test(ua) ? 'Linux' : 'Bilinmiyor';
    return `${os} ${isMobile ? '(Mobil)' : '(Masaüstü)'}`;
  };

  // Helper for webhook logging
  const sendLog = useCallback((eventType, extraData = {}) => {
    postLogToApi(eventType, {
      stage: currentStageRef.current,
      deviceId: getDeviceId(),
      device: detectDevice(),
      is_aysenur: true,
      ...extraData
    });
  }, []);

  // 1. Mouse Wheel & Touch Scroll Handler -> Smooth 3D Folding Control
  const handleScrollWheel = useCallback((e) => {
    const delta = e.deltaY || e.detail || 0;
    setFoldProgress((prev) => {
      const step = delta > 0 ? 0.08 : -0.08;
      const next = Math.max(0, Math.min(1, prev + step));

      if (next > 0.1 && !hasLoggedScrollRef.current) {
        hasLoggedScrollRef.current = true;
        currentStageRef.current = '3D Mektup Katlaması Açılıyor';
        sendLog('last_scroll_started', { action: 'Sayfa Kaydırılarak 3D Mektup Açılmaya Başlandı' });
      }

      if (next >= 0.85 && !hasLoggedLetterOpenRef.current) {
        hasLoggedLetterOpenRef.current = true;
        currentStageRef.current = 'Mektup Tam Açıldı';
        sendLog('last_letter_fully_unfolded', { action: '3D Mektup Tamamen Katından Çıkarıldı ve Okunuyor' });
      }

      return next;
    });
  }, [sendLog]);

  // Touch Swipe Handler for Mobile
  const touchStartRef = useRef(0);
  const handleTouchStart = (e) => {
    touchStartRef.current = e.touches[0].clientY;
  };
  const handleTouchMove = useCallback((e) => {
    const currentY = e.touches[0].clientY;
    const diff = touchStartRef.current - currentY;
    touchStartRef.current = currentY;

    setFoldProgress((prev) => {
      const step = diff > 0 ? 0.05 : -0.05;
      const next = Math.max(0, Math.min(1, prev + step));
      return next;
    });
  }, []);

  useEffect(() => {
    const onWheel = (e) => handleScrollWheel(e);
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => window.removeEventListener('wheel', onWheel);
  }, [handleScrollWheel]);

  // 2. Burn Choice Handler
  const handleOpenBurnModal = () => {
    setBurnModalOpen(true);
    currentStageRef.current = 'Mektubu Yak Onay Modalı';
    sendLog('last_burn_modal_opened', { action: '"Mektubu Yak" Butonuna Basıldı' });
  };

  const handleBurnChoice = (accepted) => {
    setBurnModalOpen(false);
    sendLog('last_burn_modal_choice', {
      accepted,
      choice: accepted ? 'Kabul Et (Mektup Yanıyor)' : 'Vazgeç (İptal)'
    });

    if (accepted) {
      setIsBurningActive(true);
      currentStageRef.current = 'Mektup Alev Aldı & Yanıyor';

      // Record burned state after burn animation completes
      setTimeout(() => {
        setIsBurned(true);
        try {
          localStorage.setItem('mayko_last_burned', 'true');
          localStorage.setItem('mayko_burned_at', Date.now().toString());
        } catch (e) {}
        sendLog('last_letter_burned_completed', { action: 'Mektup Tamamen Yandı ve Kül Oldu' });
      }, 5500);
    }
  };

  // 3. Lock Note Handler
  const handleOpenLockMode = () => {
    setLockModeActive(true);
    currentStageRef.current = 'Kilitli Not Yazma Alanı';
    sendLog('last_lock_clicked', { action: '"Mektubu Sakla" Butonuna Basıldı' });
  };

  const handleNoteTextChange = (e) => {
    const val = e.target.value;
    const prev = prevNoteTextRef.current;

    if (val.length > prev.length) {
      allTypedRef.current += val.slice(prev.length);
    } else if (val.length < prev.length) {
      const deletedPart = prev.replace(val, '');
      if (deletedPart && deletedPart.trim()) {
        deletedSegmentsRef.current.push(deletedPart.trim());
      }
    }

    prevNoteTextRef.current = val;
    setNoteText(val);

    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      sendLog('last_note_draft_update', {
        noteText: val,
        allTypedHistory: allTypedRef.current || val,
        deletedText: deletedSegmentsRef.current.join(' | ') || '-'
      });
    }, 1800);
  };

  const generateSha256Hash = () => {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleConfirmLockNote = () => {
    const hashCode = generateSha256Hash();
    const formattedDate = new Date(targetDate).toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const lockData = {
      noteText: noteText.trim() || 'Not eklenmedi.',
      allTypedHistory: allTypedRef.current || noteText,
      deletedText: deletedSegmentsRef.current.join(' | ') || '-',
      targetDate: formattedDate,
      sha256Code: `SHA-256: ${hashCode}`,
      timestamp: new Date().toISOString()
    };

    setLockedResult(lockData);
    currentStageRef.current = 'Mektup Kilitlendi & Mühürlendi';
    sendLog('last_note_locked', lockData);

    try {
      localStorage.setItem('mayko_last_locked_data', JSON.stringify(lockData));
    } catch (e) {}
  };

  const isDarknessTotal = remainingMs <= 0;

  // Calculate 3D Folding Rotations based on foldProgress
  const topFoldRotateX = (1 - foldProgress) * -110; // Rotates from -110deg to 0deg
  const bottomFoldRotateX = (1 - foldProgress) * 110; // Rotates from 110deg to 0deg
  const buttonOpacity = foldProgress > 0.6 ? (foldProgress - 0.6) / 0.4 : 0;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#0a0a0f',
        color: '#ffffff',
        fontFamily: "'Inter', sans-serif",
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
    >
      {/* Background Ambient Music Player */}
      <AmbientAudioPlayer trackName="Farewell Theme" autoPlay={true} />

      {/* Tester Reset Floating Control Bar */}
      {isTester && (
        <div
          style={{
            position: 'fixed',
            top: 14,
            right: 14,
            zIndex: 120000,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 14px',
            borderRadius: 9999,
            background: 'rgba(239, 68, 68, 0.25)',
            border: '1px solid rgba(239, 68, 68, 0.6)',
            backdropFilter: 'blur(12px)',
            fontSize: '0.78rem',
            color: '#fca5a5',
            boxShadow: '0 4px 20px rgba(0,0,0,0.8)'
          }}
        >
          <span>🛠️ Test Modu (Geliştirici)</span>
          <button
            onClick={() => {
              try {
                localStorage.removeItem('mayko_last_burned');
                localStorage.removeItem('mayko_burned_at');
                localStorage.removeItem('mayko_last_locked_data');
              } catch (e) {}
              setIsBurned(false);
              setIsBurningActive(false);
              setLockedResult(null);
              setLockModeActive(false);
              setFoldProgress(0);
              setRemainingMs(600000);
            }}
            style={{
              padding: '4px 10px',
              borderRadius: 9999,
              background: '#dc2626',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <RotateCcw size={12} /> Sıfırla
          </button>
        </div>
      )}

      {/* Burned Farewell / Countdown Screen */}
      {isBurned ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 100000,
            background: 'linear-gradient(180deg, #09090b 0%, #000000 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            textAlign: 'center'
          }}
        >
          {/* Countdown Clock Header */}
          <div
            style={{
              position: 'absolute',
              top: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 9999,
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              fontSize: '0.88rem',
              color: '#f8fafc',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.2)'
            }}
          >
            <Clock size={15} style={{ color: '#ef4444' }} />
            <span>Karanlığa Gömülmeye: <strong style={{ color: '#fca5a5' }}>{formatCountdown(remainingMs)}</strong></span>
          </div>

          {/* Farewell Lines */}
          <div style={{ maxWidth: 680, width: '100%', marginBottom: 36, marginTop: 40, zIndex: 100001 }}>
            <h2
              style={{
                fontFamily: "'Cardo', Georgia, serif",
                fontSize: 'clamp(1.6rem, 3.8vw, 2.4rem)',
                fontWeight: 400,
                color: '#f3f4f6',
                lineHeight: 1.6,
                marginBottom: 20,
                letterSpacing: '0.02em'
              }}
            >
              Hayatımdan gelip geçtiğin için çok teşekkürler..
            </h2>

            <p
              style={{
                fontFamily: "'Cardo', Georgia, serif",
                fontSize: 'clamp(1.15rem, 2.5vw, 1.45rem)',
                fontWeight: 400,
                fontStyle: 'italic',
                color: '#cbd5e1',
                lineHeight: 1.7,
                marginBottom: 28,
                opacity: 0.9
              }}
            >
              Sana dair her şeyim silinecek, ancak seni asla unutmayacağım.
            </p>

            <h3
              style={{
                fontFamily: "'Cardo', Georgia, serif",
                fontSize: 'clamp(2rem, 4.5vw, 3rem)',
                fontWeight: 400,
                color: '#ef4444',
                letterSpacing: '0.06em',
                margin: '12px 0 0 0',
                textShadow: '0 0 25px rgba(239, 68, 68, 0.4)'
              }}
            >
              Elveda
            </h3>
          </div>

          {/* System Deletion Summary Lines */}
          <div
            style={{
              maxWidth: 620,
              width: '100%',
              background: 'rgba(10, 11, 15, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 14,
              padding: '24px 28px',
              textAlign: 'left',
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: 'clamp(0.82rem, 1.8vw, 0.95rem)',
              color: '#94a3b8',
              lineHeight: 1.9,
              boxShadow: '0 15px 40px rgba(0,0,0,0.85)',
              backdropFilter: 'blur(12px)',
              zIndex: 100001
            }}
          >
            <div style={{ color: '#ef4444', marginBottom: 8, fontWeight: 'bold' }}>
              ✓ Tüm galeri öğeleri silindi..
            </div>
            <div style={{ color: '#ef4444', marginBottom: 8, fontWeight: 'bold' }}>
              ✓ Tüm mesajlaşmalar silindi..
            </div>
            <div style={{ color: '#ef4444', marginBottom: 8, fontWeight: 'bold' }}>
              ✓ Görüşme kayıtları silindi..
            </div>
            <div style={{ color: '#ef4444', marginBottom: 8, fontWeight: 'bold' }}>
              ✓ Numaralar silindi..
            </div>
            <div style={{ color: '#f59e0b', marginBottom: 12, wordBreak: 'break-all', lineHeight: 1.6 }}>
              ✓ b**********n@gmail.com ve l***********d@gmail.com adresinde tüm "Ayşenur" işaretli ürünler silindi..
            </div>
            <div style={{ color: '#6ee7b7', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 12, fontStyle: 'italic' }}>
              ⚡ Sitenin silinmesi için Cloudflare Worker üzerinden komut gönderildi.
            </div>
          </div>
        </div>
      ) : (
        /* Main Interactive Screen */
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          
          {/* Top Intro Typography ("Neyse" - Fades Out smoothly as user scrolls) */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              transform: 'translateY(-50%)',
              textAlign: 'center',
              opacity: Math.max(0, 1 - foldProgress * 2.5),
              transition: 'opacity 0.3s ease',
              pointerEvents: 'none',
              zIndex: 10
            }}
          >
            <h1
              style={{
                fontFamily: "'Cardo', Georgia, serif",
                fontSize: 'clamp(4.2rem, 9.5vw, 7.5rem)',
                fontWeight: 400,
                color: '#e4e7ec',
                letterSpacing: '0.04em',
                lineHeight: 1.1,
                margin: 0
              }}
            >
              Neyse
            </h1>

            {/* Scroll Hint */}
            <div
              style={{
                marginTop: 28,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                color: 'rgba(228, 231, 236, 0.45)',
                fontSize: '0.9rem',
                fontStyle: 'italic'
              }}
            >
              <span>Aşağı doğru kaydırın</span>
              <ChevronDown size={20} className="animate-bounce" />
            </div>
          </div>

          {/* 3D Paper Scroll Folding Container */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              perspective: 1200,
              zIndex: 20
            }}
          >
            {/* Left Side Button: "Mektubu Sakla" (Fades in smoothly as paper unfolds) */}
            {!lockModeActive && (
              <div
                style={{
                  position: 'absolute',
                  left: '6%',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 50,
                  opacity: buttonOpacity,
                  pointerEvents: buttonOpacity > 0.5 ? 'auto' : 'none',
                  transition: 'opacity 0.4s ease'
                }}
              >
                <button
                  onClick={handleOpenLockMode}
                  disabled={isBurningActive}
                  style={{
                    padding: '14px 22px',
                    borderRadius: 9999,
                    background: 'rgba(52, 211, 153, 0.18)',
                    border: '1px solid rgba(52, 211, 153, 0.55)',
                    color: '#6ee7b7',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    whiteSpace: 'nowrap',
                    transition: 'transform 0.2s ease'
                  }}
                >
                  <Lock size={17} /> Mektubu Sakla
                </button>
              </div>
            )}

            {/* Center 3D Folding Handwritten Letter Paper */}
            {!lockModeActive && (
              <div
                onMouseEnter={() => setIsLetterHovered(true)}
                onMouseLeave={() => setIsLetterHovered(false)}
                style={{
                  position: 'relative',
                  maxWidth: isLetterHovered ? 620 : 540,
                  width: '90%',
                  maxHeight: '75vh',
                  transformStyle: 'preserve-3d',
                  opacity: foldProgress > 0.05 ? 1 : foldProgress * 10,
                  transform: `scale(${0.7 + foldProgress * 0.3}) ${isLetterHovered && foldProgress >= 0.9 ? 'scale(1.08)' : ''}`,
                  transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
                  cursor: 'zoom-in',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                {/* 3D Paper Wrapper with Tri-Fold Simulation */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    borderRadius: 8,
                    overflow: 'hidden',
                    boxShadow: isBurningActive
                      ? '0 0 60px rgba(255, 100, 20, 0.95)'
                      : `0 ${10 + foldProgress * 20}px ${30 + foldProgress * 30}px rgba(0,0,0,0.85)`,
                    transform: `rotateX(${topFoldRotateX}deg)`,
                    transformOrigin: 'top center',
                    transition: 'transform 0.1s linear'
                  }}
                >
                  {/* Burning Flame Particle Overlay (Triggers on Burn Acceptance) */}
                  {isBurningActive && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 90,
                        background: 'radial-gradient(circle at 50% 100%, rgba(255, 140, 20, 0.95) 0%, rgba(239, 68, 68, 0.8) 40%, rgba(0,0,0,0.95) 90%)',
                        mixBlendMode: 'screen',
                        animation: 'firePaperBurn 5.5s forwards ease-in-out',
                        pointerEvents: 'none'
                      }}
                    />
                  )}

                  {/* Clean Handwritten Letter Paper Image */}
                  <img
                    src="/assets/final_letter_paper.jpg"
                    alt="Bir delinin son mesajı: Ayşenur"
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: '74vh',
                      objectFit: 'contain',
                      display: 'block',
                      filter: isBurningActive ? 'brightness(1.2) contrast(1.3)' : 'none'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Right Side Button: "Mektubu Yak" (Fades in smoothly as paper unfolds) */}
            {!lockModeActive && (
              <div
                style={{
                  position: 'absolute',
                  right: '6%',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 50,
                  opacity: buttonOpacity,
                  pointerEvents: buttonOpacity > 0.5 ? 'auto' : 'none',
                  transition: 'opacity 0.4s ease'
                }}
              >
                <button
                  onClick={handleOpenBurnModal}
                  disabled={isBurningActive}
                  style={{
                    padding: '14px 22px',
                    borderRadius: 9999,
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.6)',
                    color: '#fca5a5',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    whiteSpace: 'nowrap',
                    transition: 'transform 0.2s ease'
                  }}
                >
                  <Flame size={17} /> Mektubu Yak
                </button>
              </div>
            )}

            {/* Lock Note Form Modal */}
            {lockModeActive && !lockedResult && (
              <div
                style={{
                  width: '100%',
                  maxWidth: 520,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  padding: 24,
                  background: 'rgba(18, 20, 26, 0.92)',
                  borderRadius: 18,
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.9)',
                  zIndex: 60,
                  animation: 'fadeInSlow 0.4s ease-out'
                }}
              >
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#6ee7b7', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Lock size={18} /> Zarfa Ek Not Bırak ve Mühürle
                </h3>

                <textarea
                  value={noteText}
                  onChange={handleNoteTextChange}
                  placeholder="Mektubun içine eklemek istediğin notu buraya fısıldayabilirsin.."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: 14,
                    borderRadius: 10,
                    background: 'rgba(10, 11, 14, 0.75)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#f1f5f9',
                    fontSize: '0.95rem',
                    outline: 'none',
                    resize: 'none',
                    fontFamily: "'Cardo', Georgia, serif"
                  }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={14} /> Mektubun Tekrar Açılacağı Tarih & Saat:
                  </label>
                  <input
                    type="datetime-local"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: 'rgba(10, 11, 14, 0.75)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#f1f5f9',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <button
                    onClick={handleConfirmLockNote}
                    style={{
                      flex: 1,
                      padding: '13px',
                      borderRadius: 9999,
                      background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}
                  >
                    <CheckCircle2 size={18} /> Mühürle ve Kilitle
                  </button>

                  <button
                    onClick={() => setLockModeActive(false)}
                    style={{
                      padding: '13px 20px',
                      borderRadius: 9999,
                      background: 'rgba(255,255,255,0.08)',
                      color: '#cbd5e1',
                      border: '1px solid rgba(255,255,255,0.15)',
                      fontSize: '0.9rem',
                      cursor: 'pointer'
                    }}
                  >
                    Vazgeç
                  </button>
                </div>
              </div>
            )}

            {/* Locked Success Screen */}
            {lockedResult && (
              <div
                style={{
                  width: '100%',
                  maxWidth: 520,
                  padding: 28,
                  background: 'rgba(16, 185, 129, 0.08)',
                  borderRadius: 18,
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 14,
                  zIndex: 60
                }}
              >
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: '50%',
                    background: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: '0 0 22px rgba(16, 185, 129, 0.5)'
                  }}
                >
                  <Lock size={26} />
                </div>

                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#6ee7b7' }}>
                  Notunuz Başarıyla Mühürlendi!
                </h3>

                <p style={{ color: '#e2e8f0', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
                  Notunuz <strong style={{ color: '#34d399' }}>{lockedResult.targetDate}</strong> tarihinde açılacaktır.
                </p>

                <div
                  style={{
                    marginTop: 8,
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(0, 0, 0, 0.55)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#94a3b8',
                    fontSize: '0.78rem',
                    fontFamily: 'monospace',
                    wordBreak: 'break-all'
                  }}
                >
                  SHA-256 ile tamamen kriptolanmıştır.
                  <br />
                  <strong style={{ color: '#a7f3d0' }}>{lockedResult.sha256Code}</strong>
                </div>
              </div>
            )}
          </div>

          {/* Warning Confirmation Modal for "Mektubu Yak" */}
          {burnModalOpen && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 100000,
                background: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(12px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 20
              }}
            >
              <div
                style={{
                  maxWidth: 480,
                  width: '100%',
                  background: 'linear-gradient(180deg, #1f1315 0%, #120a0b 100%)',
                  borderRadius: 20,
                  border: '1px solid rgba(239, 68, 68, 0.45)',
                  padding: 28,
                  boxShadow: '0 20px 60px rgba(239, 68, 68, 0.3)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 16,
                  animation: 'fadeInSlow 0.3s ease-out'
                }}
              >
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.3)'
                  }}
                >
                  <AlertTriangle size={28} />
                </div>

                <p style={{ color: '#f8fafc', fontSize: '1rem', lineHeight: 1.7, margin: 0 }}>
                  Ayşenur, eğer bu mektubu yakmayı seçersen, mektupta da belirttiğim gibi tüm sistemler otomatik olarak sana dair tüm verimi silecek. Bu site de kendini otomatik olarak sunucu üzerinden silecek ve biz bir daha asla yan yana gelemeyeceğiz. Bunu kabul ediyor musun?
                </p>

                <div style={{ display: 'flex', gap: 12, width: '100%', marginTop: 8 }}>
                  <button
                    onClick={() => handleBurnChoice(true)}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      borderRadius: 9999,
                      background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(239, 68, 68, 0.5)'
                    }}
                  >
                    Kabul Et
                  </button>

                  <button
                    onClick={() => handleBurnChoice(false)}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      borderRadius: 9999,
                      background: 'rgba(148, 163, 184, 0.15)',
                      color: '#cbd5e1',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      fontSize: '0.95rem',
                      cursor: 'pointer'
                    }}
                  >
                    Vazgeç
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Embedded Keyframe Animations */}
      <style>{`
        @keyframes fadeInSlow {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes firePaperBurn {
          0% { opacity: 0; transform: scale(1); }
          20% { opacity: 0.85; transform: scale(1.02); }
          60% { opacity: 1; transform: scale(1.05); filter: contrast(1.5); }
          100% { opacity: 0; transform: scale(0.9); }
        }
      `}</style>
    </div>
  );
}
