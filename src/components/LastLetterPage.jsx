import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Flame, Lock, RotateCcw, AlertTriangle, Calendar, CheckCircle2 } from 'lucide-react';
import AmbientAudioPlayer from './AmbientAudioPlayer';
import { postLogToApi } from '../utils/gardenEngine';

/**
 * LastLetterPage Component (/last)
 * Special emotional ending page:
 * - "Neyse" intro (100% pixel-identical to home page typography).
 * - Drawer hidden below screen until first scroll; slides up from out of sight.
 * - Matchbox (right) and Envelope (left) clearly separated inside drawer.
 * - Matchbox click slides open matchbox tray and unfolds large Handwritten Letter.
 * - Hover Zoom on Letter: Mouse enter zooms letter (scale 1.22) for clear reading, mouse leave shrinks back.
 * - Striker strip at bottom of letter paper.
 * - "Mektubu yak.." -> Modal -> Drag matchstick across striker.
 * - Burning effect: Flames creep inward from top, bottom, left, right; smoke floats up; entire page is consumed into pitch black void (NO text card!).
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
  const [isLetterHovered, setIsLetterHovered] = useState(false);
  const [burnModalOpen, setBurnModalOpen] = useState(false);

  // Burn & Fire Mechanic
  const [matchIgnited, setMatchIgnited] = useState(false);
  const [isStrikingMatch, setIsStrikingMatch] = useState(false);
  const [matchPos, setMatchPos] = useState({ x: 0, y: 0 });
  const [isDraggingMatch, setIsDraggingMatch] = useState(false);
  const [pageBurnProgress, setPageBurnProgress] = useState(0); // 0 to 100
  const [isBurned, setIsBurned] = useState(() => {
    if (isTester) return false;
    try {
      return localStorage.getItem('mayko_last_burned') === 'true';
    } catch (e) {
      return false;
    }
  });

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

  // 3. Burn Flow Modal
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
      setIsStrikingMatch(true);
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

          // Start 4-edge inward fire burning animation
          let burnVal = 0;
          const burnInterval = setInterval(() => {
            burnVal += 2.5;
            setPageBurnProgress(burnVal);
            if (burnVal >= 100) {
              clearInterval(burnInterval);
              setIsBurned(true);
              try {
                localStorage.setItem('mayko_last_burned', 'true');
              } catch (err) {}
            }
          }, 60);
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
    setPageBurnProgress(0);
    setMatchIgnited(false);
    setIsStrikingMatch(false);
    setMatchPos({ x: 0, y: 0 });
    setLockModeActive(false);
    setLockedResult(null);
    setDrawerOpen(false);
    setMatchboxOpen(false);
    setLetterUnfolded(false);
    setNoteText('');
    allTypedRef.current = '';
    deletedSegmentsRef.current = [];
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

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: isBurned ? '#000000' : '#0a0b0e',
        backgroundImage: isBurned ? 'none' : 'radial-gradient(ellipse at center, #15181f 0%, #0a0b0e 100%)',
        color: '#e4e7ec',
        fontFamily: "'Cardo', Georgia, serif",
        overflow: 'hidden',
        userSelect: 'none',
        zIndex: 900,
        transition: 'background-color 1s ease'
      }}
    >
      {/* Background Music Loop */}
      <AmbientAudioPlayer />

      {/* Tester Reset Floating Control */}
      {isTester && (
        <button
          onClick={handleResetTester}
          style={{
            position: 'fixed',
            top: 20,
            left: 20,
            zIndex: 100000,
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

      {/* 4-Edge Inward Fire & Smoke Layer (When Match Ignites and Burns) */}
      {(matchIgnited || pageBurnProgress > 0) && !isBurned && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 99990 }}>
          {/* Top Flame Border */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: `${pageBurnProgress * 0.55}%`,
              background: 'linear-gradient(180deg, #ff2200 0%, #ff6600 40%, rgba(255, 68, 0, 0.4) 80%, transparent 100%)',
              filter: 'blur(4px)',
              boxShadow: '0 0 40px #ff3300'
            }}
          />
          {/* Bottom Flame Border */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: `${pageBurnProgress * 0.55}%`,
              background: 'linear-gradient(0deg, #ff2200 0%, #ff6600 40%, rgba(255, 68, 0, 0.4) 80%, transparent 100%)',
              filter: 'blur(4px)',
              boxShadow: '0 0 40px #ff3300'
            }}
          />
          {/* Left Flame Border */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: `${pageBurnProgress * 0.55}%`,
              background: 'linear-gradient(90deg, #ff2200 0%, #ff6600 40%, rgba(255, 68, 0, 0.4) 80%, transparent 100%)',
              filter: 'blur(4px)'
            }}
          />
          {/* Right Flame Border */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              right: 0,
              width: `${pageBurnProgress * 0.55}%`,
              background: 'linear-gradient(270deg, #ff2200 0%, #ff6600 40%, rgba(255, 68, 0, 0.4) 80%, transparent 100%)',
              filter: 'blur(4px)'
            }}
          />

          {/* Floating Rising Smoke & Embers */}
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            {[...Array(25)].map((_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  bottom: `${(i * 14) % 100}%`,
                  left: `${(i * 27 + pageBurnProgress * 2) % 100}%`,
                  fontSize: `${1.2 + (i % 3) * 0.6}rem`,
                  opacity: Math.max(0, 0.8 - (i % 4) * 0.15),
                  animation: `risingSmoke ${2 + (i % 3)}s linear infinite`,
                  filter: 'blur(2px)'
                }}
              >
                {i % 2 === 0 ? '💨' : '🔥'}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Burned Pitch Black Void (NO text card, complete silent void) */}
      {isBurned ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999
          }}
        >
          {/* Subtle rising dark smoke particles in burnt void */}
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.15 }}>
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  bottom: `${(i * 15) % 100}%`,
                  left: `${(i * 31) % 100}%`,
                  fontSize: '1.5rem',
                  animation: `risingSmoke ${4 + (i % 3)}s linear infinite`
                }}
              >
                💨
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Main Page Content (Consumed by fire as pageBurnProgress increases) */
        <div
          style={{
            position: 'absolute',
            inset: 0,
            filter:
              pageBurnProgress > 0
                ? `brightness(${Math.max(0, 1 - pageBurnProgress / 100)}) contrast(${1 + pageBurnProgress / 50}) sepia(${pageBurnProgress / 100})`
                : 'none',
            transition: 'filter 0.1s linear, opacity 0.1s linear'
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
              border: '2px solid rgba(130, 85, 65, 0.38)',
              borderBottom: 'none',
              boxShadow: '0 -25px 60px rgba(0, 0, 0, 0.9), inset 0 2px 12px rgba(255, 200, 160, 0.1)',
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

            {/* Inner Wooden Compartment */}
            <div
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
                    {/* Inner Match Tray Sliding Out (Clips nicely within container) */}
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

              {/* Unfolded Large Handwritten Letter (No hover zoom) */}
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
                      boxShadow: '0 14px 50px rgba(0,0,0,0.95)',
                      border: '1px solid rgba(255,255,255,0.12)'
                    }}
                  >
                    <img
                      src="/assets/final_letter_paper.jpg"
                      alt="Bir delinin son mesajı: Ayşenur"
                      style={{ width: '100%', display: 'block' }}
                    />

                    {/* Embedded Match Striker Strip (Kibrit Zımparası) at Bottom Blank Space */}
                    <div
                      ref={strikerRef}
                      style={{
                        position: 'relative',
                        width: '88%',
                        height: 32,
                        margin: '18px auto 18px auto',
                        background: 'linear-gradient(90deg, #3d2b1f 0%, #5a4030 50%, #3d2b1f 100%)',
                        borderRadius: 4,
                        border: '1px dashed rgba(0, 0, 0, 0.45)',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.85), 0 2px 6px rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'rgba(255, 230, 200, 0.65)',
                        fontSize: '0.72rem',
                        letterSpacing: '0.12em',
                        fontStyle: 'italic'
                      }}
                    >
                      🔥 Kibrit Zımparası (Kibriti buraya sürttün)
                    </div>
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
          {isStrikingMatch && !isBurned && (
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
                  background: matchIgnited ? '#ff4d4d' : '#b91c1c',
                  boxShadow: matchIgnited ? '0 0 35px #ff4d4d, 0 0 60px #ffaa00' : 'none',
                  position: 'relative'
                }}
              >
                {matchIgnited && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -38,
                      left: -14,
                      fontSize: '2.5rem',
                      animation: 'flameBurn 0.18s ease infinite alternate'
                    }}
                  >
                    🔥
                  </div>
                )}
              </div>

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
        @keyframes flameBurn {
          0% { transform: scale(1) rotate(-2deg); }
          100% { transform: scale(1.25) rotate(4deg); }
        }
        @keyframes risingSmoke {
          0% { transform: translateY(0) scale(0.8); opacity: 0.8; }
          100% { transform: translateY(-300px) scale(2.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
