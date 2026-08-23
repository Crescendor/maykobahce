import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Flame, Lock, RotateCcw, AlertTriangle, Calendar, CheckCircle2, ChevronDown, Clock } from 'lucide-react';
import AmbientAudioPlayer from './AmbientAudioPlayer';
import { postLogToApi } from '../utils/gardenEngine';

/**
 * SCSS Particle Fire Engine Component (User Animation)
 * Renders 50 varied particle flames along the bottom of the viewport:
 * background-image: radial-gradient(rgb(255,80,0) 20%, rgba(255,80,0,0) 70%);
 * mix-blend-mode: screen;
 * animation: rise $dur ease-in infinite;
 * Flames never get erased or interrupted during page transitions or on the farewell screen!
 */
function ParticleFireEngine({ active }) {
  if (!active) return null;

  // Generate 50 particles with varied sizes, positions, delays, and durations
  const particles = Array.from({ length: 50 }, (_, i) => {
    const size = 3.5 + ((i * 7) % 4.5); // 3.5em to 8em particle size
    const left = (i / 50) * 100; // Spread horizontally across 0% - 100%
    const delay = ((i * 13) % 10) / 10; // 0s to 1s animation delay
    const dur = 0.85 + ((i * 17) % 6) / 10; // 0.85s to 1.45s animation duration
    return { id: i, size, left, delay, dur };
  });

  return (
    <div className="particle-fire-container">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: `${p.left}%`,
            width: `${p.size}em`,
            height: `${p.size}em`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`
          }}
        />
      ))}
    </div>
  );
}

/**
 * LastLetterPage Component (/last)
 * Special emotional ending page:
 * - "Neyse" intro (100% pixel-identical to home page typography).
 * - Drawer hidden below screen until first scroll; slides up from out of sight.
 * - Matchbox (right) and Envelope (left) clearly separated inside drawer.
 * - Matchbox click slides open matchbox tray and unfolds Handwritten Letter.
 * - "Mektubu yak.." -> Clicking reveals Kibrit Zımparası (Match Striker) on top of letter paper.
 * - User SCSS Particle Fire Engine along bottom of screen (never cut during transition).
 * - 10-Minute Farewell Screen Timer -> Full Pitch Black Silent Darkness.
 * - "Bir notla birlikte kilitle" -> Live keylogged note form + DateTimePicker -> SHA-256 seal.
 * - Full BotGhost/Discord webhook tracking for all actions.
 * - Tester privileges for device dev_m2troqnl9_mswunr9c (Reset/Extinguish button + unlimited retries).
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
  const hasLoggedFirstScrollRef = useRef(false);
  const hasLoggedDrawerRef = useRef(false);
  const hasLoggedMatchboxRef = useRef(false);
  const hasLoggedLetterRef = useRef(false);
  const hasSentExitRef = useRef(false);
  const currentStageRef = useRef('Giriş / Neyse Ekranı');

  // Interactive States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [matchboxOpen, setMatchboxOpen] = useState(false);
  const [letterUnfolded, setLetterUnfolded] = useState(false);
  const [burnModalOpen, setBurnModalOpen] = useState(false);
  const [showStriker, setShowStriker] = useState(false); // Striker appears ONLY when "Mektubu yak.." is clicked

  // Burn & Fire Mechanic
  const [matchIgnited, setMatchIgnited] = useState(false);
  const [isStrikingMatch, setIsStrikingMatch] = useState(false);
  const [matchPos, setMatchPos] = useState({ x: 0, y: 0 });
  const [isDraggingMatch, setIsDraggingMatch] = useState(false);
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

  // Striker area ref for collision detection
  const strikerRef = useRef(null);
  const matchstickRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });

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

  // 1. Initial Scroll Listener -> Open Drawer smoothly from out of sight
  const handleScrollOrSwipe = useCallback(() => {
    if (!hasLoggedFirstScrollRef.current) {
      hasLoggedFirstScrollRef.current = true;
      currentStageRef.current = 'Siyah Çekmece Açıldı';
      sendLog('last_first_scroll', { action: '/last Sayfasında Kaydırma Yapıldı' });
    }
    if (!drawerOpen) {
      setDrawerOpen(true);
      if (!hasLoggedDrawerRef.current) {
        hasLoggedDrawerRef.current = true;
        sendLog('last_drawer_opened', { action: 'Siyah Ahşap Çekmece Açıldı' });
      }
    }
  }, [drawerOpen, sendLog]);

  useEffect(() => {
    const onWheel = (e) => {
      if (e.deltaY > 5 || e.deltaY < -5) {
        handleScrollOrSwipe();
      }
    };
    const onTouchMove = () => {
      handleScrollOrSwipe();
    };

    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [handleScrollOrSwipe]);

  // 2. Open Matchbox & Unfold Letter
  const handleMatchboxClick = () => {
    if (!matchboxOpen) {
      setMatchboxOpen(true);
      if (!hasLoggedMatchboxRef.current) {
        hasLoggedMatchboxRef.current = true;
        sendLog('last_matchbox_clicked', { action: 'Kibrit Kutusu Kaydırılarak Açıldı' });
      }
    }
    if (!letterUnfolded) {
      setTimeout(() => {
        setLetterUnfolded(true);
        currentStageRef.current = 'Son Mektup Okunuyor';
        if (!hasLoggedLetterRef.current) {
          hasLoggedLetterRef.current = true;
          sendLog('last_letter_opened', { action: 'Zarf Açıldı ve Mektup Okunuyor' });
        }
      }, 450);
    }
  };

  // 3. Burn Flow Modal (Reveals Striker Strip & Matchstick when chosen)
  const handleOpenBurnModal = () => {
    setBurnModalOpen(true);
    currentStageRef.current = 'Mektubu Yak Onay Modalı';
    sendLog('last_burn_modal_opened', { action: '"Mektubu yak.." Butonuna Basıldı' });
  };

  const handleBurnChoice = (accepted) => {
    setBurnModalOpen(false);
    sendLog('last_burn_modal_choice', {
      accepted,
      choice: accepted ? 'Kabul Et (Yakılacak)' : 'Vazgeç (İptal)'
    });

    if (accepted) {
      setShowStriker(true); // Reveal Kibrit Zımparası on top of letter!
      setIsStrikingMatch(true); // Reveal matchstick to rub across striker!
      currentStageRef.current = 'Kibrit Sürükleme ve Yakma Aşaması';
    }
  };

  // Drag Matchstick & Check Collision with Striker Strip
  const handleMatchMouseDown = (e) => {
    setIsDraggingMatch(true);
    const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    dragStartRef.current = { x: clientX - matchPos.x, y: clientY - matchPos.y };
  };

  const handleMatchMouseMove = useCallback(
    (e) => {
      if (!isDraggingMatch) return;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

      const newX = clientX - dragStartRef.current.x;
      const newY = clientY - dragStartRef.current.y;
      setMatchPos({ x: newX, y: newY });

      // Collision Detection with Striker Strip
      if (strikerRef.current && matchstickRef.current && !matchIgnited) {
        const strikerRect = strikerRef.current.getBoundingClientRect();
        const matchRect = matchstickRef.current.getBoundingClientRect();

        const isColliding =
          matchRect.left < strikerRect.right &&
          matchRect.right > strikerRect.left &&
          matchRect.top < strikerRect.bottom &&
          matchRect.bottom > strikerRect.top;

        if (isColliding) {
          setMatchIgnited(true);
          currentStageRef.current = 'Kibrit Ateşlendi & Sayfa Yanıyor';
          sendLog('last_letter_burned', { action: 'Kibrit Zımparaya Sürtüldü ve Alev Aldı!' });

          try {
            const now = Date.now();
            localStorage.setItem('mayko_last_burned', 'true');
            localStorage.setItem('mayko_burned_at', String(now));
          } catch (err) {}
        }
      }
    },
    [isDraggingMatch, matchIgnited, sendLog]
  );

  const handleMatchMouseUp = useCallback(() => {
    setIsDraggingMatch(false);
  }, []);

  useEffect(() => {
    if (isDraggingMatch) {
      window.addEventListener('mousemove', handleMatchMouseMove);
      window.addEventListener('mouseup', handleMatchMouseUp);
      window.addEventListener('touchmove', handleMatchMouseMove);
      window.addEventListener('touchend', handleMatchMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMatchMouseMove);
      window.removeEventListener('mouseup', handleMatchMouseUp);
      window.removeEventListener('touchmove', handleMatchMouseMove);
      window.removeEventListener('touchend', handleMatchMouseUp);
    };
  }, [isDraggingMatch, handleMatchMouseMove, handleMatchMouseUp]);

  // 4. Lock Note Flow
  const handleOpenLockMode = () => {
    setLockModeActive(true);
    setLetterUnfolded(false);
    currentStageRef.current = 'Kilitli Not Yazma Alanı';
    sendLog('last_lock_clicked', { action: '"Bir notla birlikte kilitle" Butonuna Basıldı' });
  };

  // Live Note Harf Harf Keylog Engine
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

  // Generate 32-char SHA-256 simulation hash
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

  // 5. Reset / Extinguish for Tester (dev_m2troqnl9_mswunr9c)
  const handleResetTester = () => {
    setIsBurned(false);
    setMatchIgnited(false);
    setIsStrikingMatch(false);
    setShowStriker(false);
    setMatchPos({ x: 0, y: 0 });
    setLockModeActive(false);
    setLockedResult(null);
    setDrawerOpen(false);
    setMatchboxOpen(false);
    setLetterUnfolded(false);
    setNoteText('');
    allTypedRef.current = '';
    deletedSegmentsRef.current = [];
    try {
      localStorage.removeItem('mayko_last_burned');
      localStorage.removeItem('mayko_burned_at');
      localStorage.removeItem('mayko_last_locked_data');
    } catch (e) {}
    currentStageRef.current = 'Sayfa Sıfırlandı (Test Cihazı)';
    sendLog('last_reset_clicked', { action: 'Test Cihazı Söndür/Sıfırla Butonuna Bastı' });
  };

  // 6. Universal Exit Logging on /last
  useEffect(() => {
    const handleExit = () => {
      if (hasLoggedFirstScrollRef.current && !hasSentExitRef.current) {
        hasSentExitRef.current = true;
        const durationMs = Date.now() - sessionStartTimeRef.current;
        const totalSec = Math.round(durationMs / 1000);
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        const durationStr = mins > 0 ? `${mins} dakika ${secs} saniye` : `${secs} saniye`;

        sendLog('last_page_abandoned', {
          action: '/last Sayfasından Ayrıldı',
          duration: durationStr,
          stage: currentStageRef.current,
          noteText: noteText || '-',
          allTypedHistory: allTypedRef.current || noteText || '-',
          deletedText: deletedSegmentsRef.current.join(' | ') || '-'
        });
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') handleExit();
    };

    window.addEventListener('beforeunload', handleExit);
    window.addEventListener('pagehide', handleExit);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleExit);
      window.removeEventListener('pagehide', handleExit);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [noteText, sendLog]);

  const isBurningActive = matchIgnited || isBurned;
  const isDarknessTotal = isBurned && remainingMs <= 0 && !isTester;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#0a0b0e',
        backgroundImage: 'radial-gradient(ellipse at center, #15181f 0%, #0a0b0e 100%)',
        color: '#e4e7ec',
        fontFamily: "'Cardo', Georgia, serif",
        overflow: 'hidden',
        userSelect: 'none',
        zIndex: 900
      }}
    >
      {/* Background Music Loop */}
      <AmbientAudioPlayer />

      {/* User SCSS Particle Fire Engine (Active during burn & stays active on farewell screen without interruption) */}
      <ParticleFireEngine active={isBurningActive} />

      {/* Tester Reset Floating Control (Always Accessible for Tester) */}
      {isTester && (
        <button
          onClick={handleResetTester}
          style={{
            position: 'fixed',
            top: 20,
            left: 20,
            zIndex: 200000,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 9999,
            background: 'rgba(239, 68, 68, 0.25)',
            border: '1px solid rgba(239, 68, 68, 0.6)',
            color: '#fca5a5',
            fontSize: '0.82rem',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
          }}
        >
          <RotateCcw size={14} /> Söndür / Sıfırla (Test Cihazı)
        </button>
      )}

      {/* 100% Pitch Black Silent Void (After 10 Minutes pass) */}
      {isDarknessTotal ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: '#000000',
            zIndex: 150000,
            cursor: 'default'
          }}
        />
      ) : isBurned ? (
        /* Permanent 10-Minute Farewell Message Screen */
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: '#050507',
            backgroundImage: 'radial-gradient(circle at center, #0f0b0c 0%, #030304 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 24px',
            textAlign: 'center',
            zIndex: 100000,
            overflowY: 'auto',
            animation: 'fadeInSlow 2s ease-out forwards'
          }}
        >
          {/* 10-Minute Countdown Indicator */}
          <div
            style={{
              position: 'absolute',
              top: 24,
              right: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 9999,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#94a3b8',
              fontSize: '0.8rem',
              fontFamily: 'monospace',
              zIndex: 100001
            }}
          >
            <Clock size={14} style={{ color: '#ef4444' }} />
            <span>Karanlığa Gömülmeye: <strong style={{ color: '#fca5a5' }}>{formatCountdown(remainingMs)}</strong></span>
          </div>

          {/* Main Emotional Farewell Lines */}
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

          {/* System Deletion Console Summary Lines */}
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
        /* Main Page Content */
        <div
          style={{
            position: 'absolute',
            inset: 0,
            filter: isBurningActive
              ? 'drop-shadow(0 0 45px rgba(255, 90, 20, 0.95)) brightness(0.9) contrast(1.15)'
              : 'none',
            transition: 'filter 0.5s ease'
          }}
        >
          {/* Top Intro Section ("Neyse" - 100% Pixel-Identical to Home Page Typography) */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              transform: 'translateY(-50%)',
              textAlign: 'center',
              opacity: drawerOpen ? 0.15 : 0.95,
              transition: 'opacity 0.6s ease',
              pointerEvents: 'none'
            }}
          >
            <h1
              style={{
                fontFamily: "'Cardo', Georgia, serif",
                fontSize: 'clamp(4.2rem, 9.5vw, 7.5rem)',
                fontWeight: 400,
                fontStyle: 'normal',
                color: '#e4e7ec',
                letterSpacing: '0.04em',
                lineHeight: 1.1,
                textAlign: 'center',
                margin: 0,
                padding: 0,
                textRendering: 'optimizeLegibility',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale'
              }}
            >
              Neyse
            </h1>
          </div>

          {/* Standard Homepage Scroll Hint (at bottom center) */}
          {!drawerOpen && (
            <div
              style={{
                position: 'absolute',
                bottom: 28,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                color: 'rgba(228, 231, 236, 0.42)',
                transition: 'opacity 0.3s ease',
                pointerEvents: 'none'
              }}
            >
              <span style={{ fontFamily: "'Cardo', Georgia, serif", fontSize: '0.78rem', letterSpacing: '0.14em', fontStyle: 'italic' }}>kaydırın</span>
              <ChevronDown size={15} style={{ animation: 'bounceSubtle 2s infinite' }} />
            </div>
          )}

          {/* 3D Dark Wooden Drawer Container (Hidden below screen until scrolled) */}
          <div
            onClick={handleScrollOrSwipe}
            style={{
              position: 'absolute',
              bottom: drawerOpen ? '3%' : '-100%',
              left: '50%',
              transform: drawerOpen ? 'translateX(-50%) translateY(0) scale(1)' : 'translateX(-50%) translateY(120%) scale(0.9)',
              opacity: drawerOpen ? 1 : 0,
              width: '92%',
              maxWidth: 760,
              height: '78vh',
              background: 'linear-gradient(180deg, #1f1817 0%, #110d0c 100%)',
              borderRadius: '26px 26px 0 0',
              border: isBurningActive
                ? '2px solid rgba(255, 100, 30, 0.8)'
                : '2px solid rgba(130, 85, 65, 0.38)',
              borderBottom: 'none',
              boxShadow: isBurningActive
                ? '0 -25px 70px rgba(255, 60, 0, 0.7), inset 0 0 30px rgba(255, 100, 20, 0.4)'
                : '0 -25px 60px rgba(0, 0, 0, 0.9), inset 0 2px 12px rgba(255, 200, 160, 0.1)',
              transition: 'all 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '24px 18px',
              overflow: 'hidden'
            }}
          >
            {/* Metallic Wooden Drawer Lid & Handle */}
            <div
              style={{
                width: 120,
                height: 14,
                borderRadius: 7,
                background: 'linear-gradient(180deg, #4d3a34 0%, #221815 100%)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.7)',
                marginBottom: 22,
                cursor: 'pointer'
              }}
            />

            {/* Inner Wooden Compartment (Fades out when ignited) */}
            <div
              className={matchIgnited ? 'fade-out-burn' : ''}
              onAnimationEnd={() => {
                if (matchIgnited) {
                  setIsBurned(true);
                  try {
                    const now = Date.now();
                    localStorage.setItem('mayko_last_burned', 'true');
                    localStorage.setItem('mayko_burned_at', String(now));
                  } catch (e) {}
                }
              }}
              style={{
                position: 'relative',
                width: '100%',
                flex: 1,
                background: '#0d0b0a',
                borderRadius: 18,
                border: '1px solid rgba(90, 60, 45, 0.28)',
                boxShadow: 'inset 0 12px 35px rgba(0,0,0,0.95)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px 24px',
                overflow: 'visible'
              }}
            >
              {/* Distinct Separated Envelope (Left) & Matchbox (Right) Layer */}
              {!letterUnfolded && !lockModeActive && (
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 60px 0 30px'
                  }}
                >
                  {/* Envelope (Left Side) */}
                  <div
                    onClick={handleMatchboxClick}
                    style={{
                      position: 'relative',
                      width: 240,
                      height: 155,
                      background: 'linear-gradient(135deg, #e4dbc9 0%, #c2b19b 100%)',
                      borderRadius: 8,
                      boxShadow: '0 14px 40px rgba(0,0,0,0.8), inset 0 0 15px rgba(0,0,0,0.08)',
                      transform: 'rotate(-4deg)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(0,0,0,0.18)',
                      transition: 'transform 0.3s ease'
                    }}
                  >
                    {/* Pure Red Wax Seal (No text) */}
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle at 30% 30%, #dc2626 0%, #881337 100%)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.3)',
                        border: '1px solid rgba(136, 19, 55, 0.6)'
                      }}
                    />
                  </div>

                  {/* Glowing Matchbox (Right Side with Ample Clearance for Slide Animation) */}
                  <div
                    onClick={handleMatchboxClick}
                    style={{
                      position: 'relative',
                      width: 165,
                      height: 110,
                      transform: matchboxOpen ? 'rotate(4deg) translateX(15px)' : 'rotate(4deg)',
                      transition: 'all 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
                      cursor: 'pointer',
                      filter: 'drop-shadow(0 0 20px rgba(255, 120, 40, 0.55))',
                      overflow: 'visible'
                    }}
                  >
                    {/* Inner Match Tray Sliding Out */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `url('/assets/matchbox_inside.jpg')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderRadius: 6,
                        transform: matchboxOpen ? 'translateX(52px)' : 'translateX(0)',
                        transition: 'transform 0.5s ease-out',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.7)'
                      }}
                    />
                    {/* Exterior Matchbox Cover */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `url('/assets/matchbox_cover.png')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderRadius: 6,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.85)'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Unfolded Large Handwritten Letter */}
              {letterUnfolded && !lockModeActive && (
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    maxHeight: '94%',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 18,
                    padding: 14,
                    animation: 'unfoldLetter 0.6s ease-out'
                  }}
                >
                  {/* Stable Handwritten Letter Image Container */}
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      maxWidth: 620,
                      borderRadius: 10,
                      overflow: 'hidden',
                      boxShadow: isBurningActive
                        ? '0 0 50px rgba(255, 100, 20, 0.95), 0 14px 50px rgba(0,0,0,0.95)'
                        : '0 14px 50px rgba(0,0,0,0.95)',
                      border: isBurningActive
                        ? '1px solid rgba(255, 120, 30, 0.6)'
                        : '1px solid rgba(255,255,255,0.12)',
                      transition: 'box-shadow 0.5s ease'
                    }}
                  >
                    {/* Embedded Match Striker Strip (Appears ONLY when "Mektubu yak.." is clicked) */}
                    {showStriker && (
                      <div
                        ref={strikerRef}
                        style={{
                          position: 'relative',
                          width: '90%',
                          height: 38,
                          margin: '14px auto 14px auto',
                          background: 'linear-gradient(90deg, #3d2b1f 0%, #5a4030 50%, #3d2b1f 100%)',
                          borderRadius: 6,
                          border: '2px solid rgba(255, 140, 40, 0.9)',
                          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.9), 0 0 16px rgba(255, 100, 20, 0.65)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffedd5',
                          fontSize: '0.8rem',
                          letterSpacing: '0.12em',
                          fontStyle: 'italic',
                          fontWeight: 'bold',
                          animation: 'fadeInSlow 0.4s ease-out'
                        }}
                      >
                        🔥 KİBRİT ZIMPARASI (Kibriti Buraya Sürtün)
                      </div>
                    )}

                    <img
                      src="/assets/final_letter_paper.jpg"
                      alt="Bir delinin son mesajı: Ayşenur"
                      style={{ width: '100%', display: 'block' }}
                    />
                  </div>

                  {/* Action Buttons Below Letter */}
                  <div style={{ display: 'flex', gap: 14, width: '100%', maxWidth: 580, justifyContent: 'center' }}>
                    <button
                      onClick={handleOpenBurnModal}
                      style={{
                        flex: 1,
                        padding: '13px 18px',
                        borderRadius: 9999,
                        background: 'rgba(239, 68, 68, 0.18)',
                        border: '1px solid rgba(239, 68, 68, 0.55)',
                        color: '#fca5a5',
                        fontSize: '0.95rem',
                        cursor: 'pointer',
                        backdropFilter: 'blur(8px)',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8
                      }}
                    >
                      <Flame size={18} /> Mektubu yak..
                    </button>

                    <button
                      onClick={handleOpenLockMode}
                      style={{
                        flex: 1,
                        padding: '13px 18px',
                        borderRadius: 9999,
                        background: 'rgba(52, 211, 153, 0.15)',
                        border: '1px solid rgba(52, 211, 153, 0.45)',
                        color: '#6ee7b7',
                        fontSize: '0.95rem',
                        cursor: 'pointer',
                        backdropFilter: 'blur(8px)',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8
                      }}
                    >
                      <Lock size={18} /> Bir notla birlikte kilitle
                    </button>
                  </div>
                </div>
              )}

              {/* Lock Note Form */}
              {lockModeActive && !lockedResult && (
                <div
                  style={{
                    width: '100%',
                    maxWidth: 520,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    padding: 22,
                    background: 'rgba(20, 22, 28, 0.88)',
                    borderRadius: 16,
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    backdropFilter: 'blur(16px)'
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

                  <button
                    onClick={handleConfirmLockNote}
                    style={{
                      marginTop: 8,
                      padding: '13px',
                      borderRadius: 9999,
                      background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '1rem',
                      fontWeight: 500,
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
                </div>
              )}

              {/* Locked Success Screen */}
              {lockedResult && (
                <div
                  style={{
                    width: '100%',
                    maxWidth: 520,
                    padding: 26,
                    background: 'rgba(16, 185, 129, 0.08)',
                    borderRadius: 16,
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 14
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
          </div>

          {/* Draggable Matchstick & Ignited Flame */}
          {isStrikingMatch && (
            <div
              ref={matchstickRef}
              onMouseDown={handleMatchMouseDown}
              onTouchStart={handleMatchMouseDown}
              style={{
                position: 'fixed',
                bottom: 40 + matchPos.y * -1,
                left: `calc(50% + ${matchPos.x}px)`,
                transform: 'translateX(-50%)',
                width: 14,
                height: 125,
                zIndex: 99999,
                cursor: 'grab',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              {/* Red Match Tip / Burning Flame */}
              <div
                style={{
                  width: 18,
                  height: 24,
                  borderRadius: '50% 50% 30% 30%',
                  background: matchIgnited
                    ? 'radial-gradient(circle at 50% 30%, #ffffff 0%, #ffbb00 40%, #ff4400 100%)'
                    : '#b91c1c',
                  boxShadow: matchIgnited
                    ? '0 0 35px #ffbb00, 0 0 60px #ff4400, 0 -10px 25px #ffffff'
                    : 'none',
                  position: 'relative',
                  transition: 'background 0.2s ease, box-shadow 0.2s ease'
                }}
              />

              {/* Wooden Stick */}
              <div
                style={{
                  flex: 1,
                  width: 8,
                  background: '#d97706',
                  borderRadius: '0 0 4px 4px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.5)'
                }}
              />
            </div>
          )}

          {/* Warning Modal for "Mektubu yak.." */}
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
                  gap: 16
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

      <style>{`
        @keyframes unfoldLetter {
          0% { opacity: 0; transform: scaleY(0.1); }
          100% { opacity: 1; transform: scaleY(1); }
        }
        @keyframes fadeInSlow {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
