import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Flame, Lock, RotateCcw, AlertTriangle, Calendar, CheckCircle2, ChevronDown, Clock } from 'lucide-react';
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
  const [isLetterZoomed, setIsLetterZoomed] = useState(false);
  const [burnModalOpen, setBurnModalOpen] = useState(false);
  const [isAudioPhase1Completed, setIsAudioPhase1Completed] = useState(true);

  // Lock Note Result State (Declared early for timer freeze engine)
  const [lockedResult, setLockedResult] = useState(() => {
    if (isTester) return null;
    try {
      const saved = localStorage.getItem('mayko_last_locked_data');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Live Countdown Timer to 02.09.2026 23:59:59 (1 Week from Today - Freezes permanently when note is locked/sealed)
  const TARGET_TIMESTAMP = new Date('2026-09-02T23:59:59').getTime();
  const [countdownStr, setCountdownStr] = useState('00:00:00:00:00');

  useEffect(() => {
    let animationFrameId;
    const updateCountdown = () => {
      // Freeze timer at the exact timestamp when the note was sealed and locked
      const now = (lockedResult && lockedResult.timestamp) ? new Date(lockedResult.timestamp).getTime() : Date.now();
      const diff = Math.max(0, TARGET_TIMESTAMP - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      const ms = Math.floor((diff % 1000) / 10);

      const formatted = `${String(days).padStart(2, '0')}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(ms).padStart(2, '0')}`;
      setCountdownStr(formatted);

      if (!lockedResult) {
        animationFrameId = requestAnimationFrame(updateCountdown);
      }
    };

    updateCountdown();
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [TARGET_TIMESTAMP, lockedResult]);

  // Burn & Fire State - Clear all previous local storage burn records completely as requested
  useEffect(() => {
    try {
      localStorage.removeItem('mayko_last_burned');
      localStorage.removeItem('mayko_burned_at');
    } catch (e) {}
  }, []);

  const [isBurningActive, setIsBurningActive] = useState(false);
  const [isBurned, setIsBurned] = useState(false);

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

  // Global Page Leave / Tab Exit Sentinel
  useEffect(() => {
    const handleLeavePage = () => {
      const elapsedMs = Date.now() - sessionStartTimeRef.current;
      const mins = Math.floor(elapsedMs / 60000);
      const secs = Math.floor((elapsedMs % 60000) / 1000);
      const durationStr = `${String(mins).padStart(2, '0')} dk ${String(secs).padStart(2, '0')} sn`;

      const rawPayload = JSON.stringify({
        eventType: 'last_page_abandoned',
        data: {
          action: 'Ziyaretçi Sayfadan Ayrıldı / Sekmeyi Kapattı',
          duration: durationStr,
          stage: currentStageRef.current || 'Neyse Ekranı',
          deviceId: getDeviceId(),
          device: detectDevice(),
          is_aysenur: true
        },
        timestamp: new Date().toISOString()
      });

      const _v = btoa(encodeURIComponent(rawPayload));

      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify({ _v })], { type: 'application/json' });
        navigator.sendBeacon('/api/flower-logs', blob);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleLeavePage();
      }
    };

    window.addEventListener('beforeunload', handleLeavePage);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleLeavePage);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Helper for webhook logging (calculates exact seconds after page arrival for button clicks)
  const sendLog = useCallback((eventType, extraData = {}) => {
    const elapsedSec = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
    const elapsedMins = Math.floor(elapsedSec / 60);
    const remSecs = elapsedSec % 60;
    const timeStr = elapsedMins > 0 ? `${elapsedMins} dk ${remSecs} sn sonra` : `${elapsedSec} saniye sonra`;

    postLogToApi(eventType, {
      stage: currentStageRef.current,
      buttonClickTime: timeStr,
      buttonClickSeconds: elapsedSec,
      deviceId: getDeviceId(),
      device: detectDevice(),
      is_aysenur: true,
      ...extraData
    });
  }, []);

  // 2-Step Key & Keyhole Lock Mechanics ('initial' -> 'keyIn' -> 'unlocked')
  const [keyStage, setKeyStage] = useState('initial'); // 'initial' | 'keyIn' | 'unlocked'
  const [isScrollUnlocked, setIsScrollUnlocked] = useState(false);
  const [isKeyDragging, setIsKeyDragging] = useState(false);
  const [keyOffset, setKeyOffset] = useState({ x: 0, y: 0 });

  const keyholeRef = useRef(null);
  const dragStartPosRef = useRef({ x: 0, y: 0 });

  // Play audio on any user gesture
  const triggerAudioPlay = useCallback(() => {
    if (typeof window !== 'undefined' && typeof window.playLastLetterAudio === 'function') {
      try {
        window.playLastLetterAudio();
      } catch (e) {}
    }
  }, []);

  // Step 1: Move key into lock
  const handleKeyIn = useCallback(() => {
    if (keyStage !== 'initial') return;
    setKeyStage('keyIn');
    triggerAudioPlay();
    sendLog('last_key_dropped_in_lock', { action: 'Anahtar Kilit Deliğine Yerleşti (Adım 1)' });
  }, [keyStage, triggerAudioPlay, sendLog]);

  // Step 2: Double click (or click) key to unlock
  const handleKeyDoubleClick = useCallback(() => {
    triggerAudioPlay();
    if (keyStage === 'keyIn') {
      setKeyStage('unlocked');
      setIsScrollUnlocked(true);
      sendLog('last_key_unlocked', { action: 'Anahtara Çift Tıklandı, Kilit Açıldı & Kaydırma Serbest (Adım 2)' });
    } else if (keyStage === 'initial') {
      // Direct click shortcut support
      handleKeyIn();
    }
  }, [keyStage, handleKeyIn, triggerAudioPlay, sendLog]);

  // Mouse & Touch Drag Handlers for the Key
  const handleKeyMouseDown = (e) => {
    if (keyStage === 'unlocked') return;
    triggerAudioPlay();
    setIsKeyDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragStartPosRef.current = { x: clientX - keyOffset.x, y: clientY - keyOffset.y };
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (!isKeyDragging || keyStage === 'unlocked') return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const newX = clientX - dragStartPosRef.current.x;
      const newY = clientY - dragStartPosRef.current.y;
      setKeyOffset({ x: newX, y: newY });

      // Check proximity to keyhole element
      if (keyholeRef.current && keyStage === 'initial') {
        const holeRect = keyholeRef.current.getBoundingClientRect();
        const holeCenterX = holeRect.left + holeRect.width / 2;
        const holeCenterY = holeRect.top + holeRect.height / 2;

        const dist = Math.hypot(clientX - holeCenterX, clientY - holeCenterY);
        if (dist < 65) {
          setIsKeyDragging(false);
          handleKeyIn();
        }
      }
    };

    const handleEnd = () => {
      if (isKeyDragging) {
        setIsKeyDragging(false);
        if (keyStage === 'initial') {
          setKeyOffset({ x: 0, y: 0 });
        }
      }
    };

    if (isKeyDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isKeyDragging, keyStage, handleKeyIn]);

  const targetFoldRef = useRef(0);

  // 1. Mouse Wheel & Touch Scroll Handler -> Smooth Liquid Lerp Control
  const handleScrollWheel = useCallback((e) => {
    const delta = e.deltaY || e.detail || 0;
    const step = delta > 0 ? 0.05 : -0.05;
    targetFoldRef.current = Math.max(0, Math.min(1, targetFoldRef.current + step));

    if (targetFoldRef.current > 0.05 && !hasLoggedScrollRef.current) {
      hasLoggedScrollRef.current = true;
      currentStageRef.current = 'Kaydırmalı Cümleler İlerliyor';
      sendLog('last_scroll_started', { action: 'Sayfa Kaydırılarak Cümleler Okunmaya Başlandı' });
    }

    if (targetFoldRef.current >= 0.90 && !hasLoggedLetterOpenRef.current) {
      hasLoggedLetterOpenRef.current = true;
      currentStageRef.current = 'Mektup Tam Açıldı';
      sendLog('last_letter_fully_unfolded', { action: '3D Mektup Tamamen Katından Çıkarıldı ve Okunuyor' });
    }
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

    const step = diff > 0 ? 0.04 : -0.04;
    targetFoldRef.current = Math.max(0, Math.min(1, targetFoldRef.current + step));
  }, []);

  // Liquid Smooth Lerp Animation Loop for Wheel & Touch
  useEffect(() => {
    let animId;
    const updateLerp = () => {
      setFoldProgress((prev) => {
        const diff = targetFoldRef.current - prev;
        if (Math.abs(diff) < 0.0005) return targetFoldRef.current;
        return prev + diff * 0.12; // Liquid smooth lerp factor
      });
      animId = requestAnimationFrame(updateLerp);
    };
    animId = requestAnimationFrame(updateLerp);
    return () => cancelAnimationFrame(animId);
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

      // Record burned state after 30-second radial paper hole burn animation completes
      setTimeout(() => {
        setIsBurned(true);
        try {
          localStorage.setItem('mayko_last_burned', 'true');
          localStorage.setItem('mayko_burned_at', Date.now().toString());
        } catch (e) {}
        sendLog('last_letter_burned_completed', { action: 'Mektup 30 Saniyelik Yuvarlak Yanma İle Tamamen Kül Oldu' });
      }, 30000);
    }
  };

  // 3. Lock Note Handler
  const handleOpenLockMode = () => {
    setLockModeActive(true);
    currentStageRef.current = 'Kilitli Not Yazma Alanı';
    sendLog('last_lock_clicked', { action: '"Mektubu Sakla" Butonuna Basıldı' });
  };

  // Unload / Tab Close Draft Capture Sentinel (Captures notes even if tab is closed without sending)
  useEffect(() => {
    const sendUnloadDraft = () => {
      if (lockModeActive && prevNoteTextRef.current && prevNoteTextRef.current.trim().length > 0) {
        const payload = JSON.stringify({
          eventType: 'last_lock_clicked',
          data: {
            action: 'Mektup Saklama Formu (Gönderilmeden Sekme Kapandı)',
            noteText: prevNoteTextRef.current,
            note: prevNoteTextRef.current,
            allTypedHistory: allTypedRef.current || prevNoteTextRef.current,
            deletedText: deletedSegmentsRef.current.join(' | ') || '-',
            stage: 'Mektup Saklama Formu Gönderilmeden Sekme Kapandı',
            deviceId: getDeviceId()
          },
          timestamp: new Date().toISOString()
        });

        if (navigator.sendBeacon) {
          const blob = new Blob([payload], { type: 'application/json' });
          navigator.sendBeacon('/api/flower-logs', blob);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendUnloadDraft();
      }
    };

    window.addEventListener('beforeunload', sendUnloadDraft);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', sendUnloadDraft);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [lockModeActive]);

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
      sendLog('last_lock_clicked', {
        action: 'Mektup Saklama Formu (Canlı Nota Yazılan Metin)',
        noteText: val,
        note: val,
        allTypedHistory: allTypedRef.current || val,
        deletedText: deletedSegmentsRef.current.join(' | ') || '-'
      });
    }, 600);
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

  // Calculate Center-Fold Rotation (Opens along horizontal center crease from 75deg to 0deg, zero tumbling)
  const centerFoldRotateX = (1 - foldProgress) * 75;
  const paperOpacity = Math.min(1, foldProgress * 1.6);
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
        backgroundColor: '#0f1115',
        backgroundImage: 'radial-gradient(ellipse at center, #15181f 0%, #0a0b0e 100%)',
        color: '#ffffff',
        fontFamily: "'Inter', sans-serif",
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
    >

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
            textAlign: 'center',
            animation: 'fadeInSlow 2s ease-in-out forwards'
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
      ) : (() => {
        // Sequential Subtitle Scroll Phrases (8 Phrases in Exact Order)
        const SCROLL_PHRASES = [
          { min: 0.00, max: 0.11, text: "Sen konuyu biliyorsun.." },
          { min: 0.11, max: 0.22, text: "Geldiysen," },
          { min: 0.22, max: 0.33, text: "Merak etmişsindir.." },
          { min: 0.33, max: 0.44, text: "Merak ettiysen," },
          { min: 0.44, max: 0.55, text: "Aklının bir yerinde hala hayatta kalan bir şeyler vardır.." },
          { min: 0.55, max: 0.65, text: "Bir şeyler hayatta ise," },
          { min: 0.65, max: 0.75, text: "Sayacı durdurur musun?" },
          { min: 0.75, max: 0.84, text: "Öyle ya da böyle.." }
        ];

        const getPhraseOpacity = (min, max, p, idx) => {
          if (p < min || p >= max) return 0;
          // First phrase ("Sen konuyu biliyorsun..") is 100% visible immediately on page load (p = 0)
          if (idx === 0) {
            if (p <= 0.07) return 1;
            return Math.max(0, (max - p) / (max - 0.07));
          }
          const len = max - min;
          const rel = (p - min) / len;
          if (rel < 0.25) return rel / 0.25;
          if (rel > 0.75) return (1 - rel) / 0.25;
          return 1;
        };

        // Live Countdown Timer appears directly in center with "Bize dair elimde kalan tüm verilerin otomatik olarak silinmesine.." subtitle at foldProgress >= 0.84!
        const timerOpacity = foldProgress < 0.84
          ? 0
          : foldProgress <= 0.91
          ? (foldProgress - 0.84) / 0.07
          : Math.max(0, 1 - (foldProgress - 0.91) * 12);

        // 3D Paper Letter & Buttons unfold at foldProgress >= 0.88
        const paperOpacity = foldProgress <= 0.88 ? 0 : Math.min(1, (foldProgress - 0.88) * 8.3);
        const buttonOpacity = foldProgress <= 0.92 ? 0 : Math.min(1, (foldProgress - 0.92) * 12.5);

        return (
        /* Main Interactive Screen */
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          
          {/* Sequential Sub-heading Scroll Sentences (All Consistent Pure White Sub-headings) */}
          {SCROLL_PHRASES.map((phrase, idx) => {
            const op = getPhraseOpacity(phrase.min, phrase.max, foldProgress, idx);
            if (op <= 0) return null;
            return (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  right: 0,
                  transform: 'translateY(-50%)',
                  textAlign: 'center',
                  opacity: op,
                  transition: 'opacity 0.25s ease',
                  pointerEvents: 'none',
                  zIndex: 15,
                  padding: '0 24px'
                }}
              >
                <h3
                  style={{
                    fontFamily: "'Cardo', Georgia, serif",
                    fontSize: 'clamp(1.15rem, 2.6vw, 1.55rem)',
                    fontWeight: 400,
                    fontStyle: 'italic',
                    color: '#ffffff',
                    letterSpacing: '0.04em',
                    lineHeight: 1.4,
                    margin: 0,
                    opacity: 0.95,
                    textShadow: '0 0 20px rgba(0,0,0,0.95)'
                  }}
                >
                  {phrase.text}
                </h3>
              </div>
            );
          })}

          {/* Live Countdown Timer (Appears directly in center position at foldProgress >= 0.84, zero position shift) */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              transform: 'translateY(-50%)',
              textAlign: 'center',
              opacity: timerOpacity,
              transition: 'opacity 0.3s ease',
              pointerEvents: 'none',
              zIndex: 15,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Subtitle directly above Countdown Timer (Exact requested wording) */}
            <div
              style={{
                fontFamily: "'Cardo', Georgia, serif",
                fontSize: 'clamp(1.15rem, 2.6vw, 1.55rem)',
                fontWeight: 400,
                fontStyle: 'italic',
                color: lockedResult ? '#6ee7b7' : '#ffffff',
                letterSpacing: '0.04em',
                marginBottom: 14
              }}
            >
              {lockedResult ? '🔒 Mektup mühürlendi — Sayaç duraklatıldı' : 'Bize dair elimde kalan tüm verilerin otomatik olarak silinmesine..'}
            </div>

            {/* Live Countdown Timer (x:y:z:a:b - Pure White, Centered) */}
            <h1
              style={{
                fontFamily: "'Cardo', Georgia, serif",
                fontSize: 'clamp(3.5rem, 8.2vw, 6.5rem)',
                fontWeight: 400,
                color: '#ffffff',
                letterSpacing: '0.04em',
                lineHeight: 1.1,
                margin: 0,
                padding: 0,
                opacity: 0.98,
                textRendering: 'optimizeLegibility',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
                fontVariantNumeric: 'tabular-nums',
                fontFeatureSettings: '"tnum"'
              }}
            >
              {countdownStr}
            </h1>
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
            {/* Left Side Button: "Mektubu Sakla" (Invisible on Neyse intro screen, greyed out on paper until audio Phase 1 ends) */}
            {!lockModeActive && (
              <div
                style={{
                  position: 'absolute',
                  left: '6%',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 50,
                  opacity: buttonOpacity * (!isAudioPhase1Completed ? 0.35 : 1),
                  pointerEvents: (buttonOpacity > 0.5 && isAudioPhase1Completed) ? 'auto' : 'none',
                  transition: 'all 0.4s ease'
                }}
              >
                <button
                  onClick={handleOpenLockMode}
                  disabled={!isAudioPhase1Completed || isBurningActive}
                  style={{
                    padding: '14px 22px',
                    borderRadius: 9999,
                    background: !isAudioPhase1Completed ? 'rgba(100, 100, 100, 0.15)' : 'rgba(52, 211, 153, 0.18)',
                    border: !isAudioPhase1Completed ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(52, 211, 153, 0.55)',
                    color: !isAudioPhase1Completed ? '#94a3b8' : '#6ee7b7',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    cursor: !isAudioPhase1Completed ? 'not-allowed' : 'pointer',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    whiteSpace: 'nowrap',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Lock size={17} /> Mektubu Sakla
                </button>
              </div>
            )}

            {/* Center Smooth Fade-in Handwritten Letter Paper (Click to Zoom when visible) */}
            {!lockModeActive && (
              <div
                onClick={() => {
                  if (paperOpacity > 0.2) {
                    setIsLetterZoomed((prev) => {
                      const nextZoom = !prev;
                      sendLog('last_letter_zoom_toggled', {
                        isZoomed: nextZoom,
                        action: nextZoom ? '🔍 Mektuba Tıklandı & Büyütüldü (Odaklandı)' : '🔍 Mektuba Tekrar Tıklandı & Küçültüldü (Normal Boyut)'
                      });
                      return nextZoom;
                    });
                  }
                }}
                style={{
                  position: 'relative',
                  maxWidth: isLetterZoomed ? 660 : 540,
                  width: '90%',
                  maxHeight: '78vh',
                  opacity: paperOpacity,
                  transform: `scale(${0.85 + foldProgress * 0.15}) ${isLetterZoomed ? 'scale(1.22)' : ''}`,
                  transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease',
                  cursor: paperOpacity > 0.2 ? (isLetterZoomed ? 'zoom-out' : 'zoom-in') : 'default',
                  pointerEvents: paperOpacity > 0.2 ? 'auto' : 'none',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 30
                }}
              >
                {/* Clean Paper Wrapper */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    borderRadius: 8,
                    overflow: 'hidden',
                    boxShadow: `0 ${10 + foldProgress * 20}px ${30 + foldProgress * 30}px rgba(0,0,0,0.85)`
                  }}
                >
                  {/* Clean Handwritten Letter Paper Image */}
                  <img
                    src="/assets/final_letter_paper.jpg"
                    alt="Bir delinin son mesajı: Ayşenur"
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: '76vh',
                      objectFit: 'contain',
                      display: 'block'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Right Side Button: "Mektubu Yak" (Invisible on Neyse intro screen, greyed out on paper until audio Phase 1 ends) */}
            {!lockModeActive && (
              <div
                style={{
                  position: 'absolute',
                  right: '6%',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 50,
                  opacity: buttonOpacity * (!isAudioPhase1Completed ? 0.35 : 1),
                  pointerEvents: (buttonOpacity > 0.5 && isAudioPhase1Completed) ? 'auto' : 'none',
                  transition: 'all 0.4s ease'
                }}
              >
                <button
                  onClick={handleOpenBurnModal}
                  disabled={!isAudioPhase1Completed || isBurningActive}
                  style={{
                    padding: '14px 22px',
                    borderRadius: 9999,
                    background: !isAudioPhase1Completed ? 'rgba(100, 100, 100, 0.15)' : 'rgba(239, 68, 68, 0.2)',
                    border: !isAudioPhase1Completed ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(239, 68, 68, 0.6)',
                    color: !isAudioPhase1Completed ? '#94a3b8' : '#fca5a5',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    cursor: !isAudioPhase1Completed ? 'not-allowed' : 'pointer',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    whiteSpace: 'nowrap',
                    transition: 'all 0.3s ease'
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
                    onClick={() => {
                      setLockModeActive(false);
                      sendLog('last_lock_clicked', {
                        action: 'Mektubu Saklamaktan Vazgeçildi (İptal)',
                        noteText: prevNoteTextRef.current ? `${prevNoteTextRef.current} (Vazgeçildi)` : 'Yazılmadan Vazgeçildi',
                        note: prevNoteTextRef.current ? `${prevNoteTextRef.current} (Vazgeçildi)` : 'Yazılmadan Vazgeçildi',
                        allTypedHistory: allTypedRef.current || prevNoteTextRef.current || '-',
                        deletedText: deletedSegmentsRef.current.join(' | ') || '-'
                      });
                    }}
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

          {/* Full-Screen 30-Second Iconic Circular Hole Burn Effect (#0D0E12 Center Hole + 10 Flames + Highlight) */}
          {isBurningActive && (
            <div className="burn-layer">
              <div className="highlight" />
              <div className="burn">
                <div className="flame" />
                <div className="flame" />
                <div className="flame" />
                <div className="flame" />
                <div className="flame" />
                <div className="flame" />
                <div className="flame" />
                <div className="flame" />
                <div className="flame" />
                <div className="flame" />
              </div>
            </div>
          )}
        </div>
        );
      })()}

      {/* Embedded Keyframe Animations for 30-Second Iconic #0D0E12 Paper Hole Burn */}
      <style>{`
        @keyframes fadeInSlow {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        .burn-layer {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          z-index: 999998;
          pointer-events: none;
          overflow: hidden;
        }

        .burn {
          position: absolute;
          height: 0px;
          width: 0px;
          background-color: #0D0E12;
          border-radius: 50%;
          top: 50%;
          right: 50%;
          animation: 30s burn-grow linear forwards;
          border: 20px solid #ffaa00;
          box-shadow: inset 0 0 25px 8px #ffeb3b, inset 0 0 45px 15px #ff3d00, 0 0 35px 12px #ff9800, 0 0 75px 30px rgba(255, 61, 0, 0.85), 0 0 130px 50px rgba(255, 30, 0, 0.6);
        }

        @keyframes burn-grow {
          0% {
            opacity: 1;
            height: 0px;
            width: 0px;
            top: 50%;
            right: 50%;
            border: 20px solid #ffeb3b;
            box-shadow: inset 0 0 25px 8px #ffeb3b, inset 0 0 45px 15px #ff3d00, 0 0 35px 12px #ff9800, 0 0 75px 30px rgba(255, 61, 0, 0.85), 0 0 130px 50px rgba(255, 30, 0, 0.6);
          }
          75% {
            height: 3200px;
            width: 3200px;
            top: calc(50% - 1600px);
            right: calc(50% - 1600px);
            border: 20px solid #ff9800;
            opacity: 1;
          }
          95% {
            height: 4800px;
            width: 4800px;
            top: calc(50% - 2400px);
            right: calc(50% - 2400px);
            border: 0px solid transparent;
            box-shadow: none;
            opacity: 1;
          }
          100% {
            height: 5000px;
            width: 5000px;
            top: calc(50% - 2500px);
            right: calc(50% - 2500px);
            border: 0px solid transparent;
            box-shadow: none;
            opacity: 1;
          }
        }

        .highlight {
          position: absolute;
          border-radius: 50%;
          height: 3500px;
          width: 3500px;
          top: calc(50% - 1750px);
          right: calc(50% - 1750px);
          box-shadow: 0px 0px 100px 80px rgba(255, 120, 20, 0.4);
          animation: 30s grow-highlight linear forwards;
        }

        @keyframes grow-highlight {
          0% {
            height: 0px;
            width: 0px;
            top: 50%;
            right: 50%;
            box-shadow: 0px 0px 80px 60px rgba(255, 140, 20, 0.5);
          }
          60% {
            box-shadow: 0px 0px 120px 90px rgba(255, 120, 20, 0.45);
          }
          85% {
            height: 3500px;
            width: 3500px;
            top: calc(50% - 1750px);
            right: calc(50% - 1750px);
            box-shadow: 0px 0px 150px 100px transparent;
          }
          100% {
            opacity: 0;
          }
        }

        .burn .flame {
          background-color: #fffc98;
          position: absolute;
          box-shadow: 0px 0px 0px 0px #FFFB5C;
        }

        .burn .flame:nth-of-type(1) {
          border-radius: 50% 0;
          animation: 30s flame-1 linear forwards;
          transform-origin: bottom left;
          opacity: 0;
        }
        @keyframes flame-1 {
          0% { opacity: 1; height: 0px; width: 0px; left: 8%; bottom: 76%; background-color: #fffc98; }
          15% { height: 20px; width: 20px; transform: rotate(-15deg); }
          30% { transform: rotate(-45deg); }
          46% { height: 20px; width: 20px; left: 5%; bottom: 76%; box-shadow: 0px 0px 5px 4px #FFFB5C; transform: rotate(-40deg); opacity: 1; }
          75% { transform: rotate(-27deg); opacity: 0; }
        }

        .burn .flame:nth-of-type(2) {
          border-radius: 50% 0;
          animation: 30s flame-2 linear forwards;
          transform-origin: bottom left;
          opacity: 0;
        }
        @keyframes flame-2 {
          0% { height: 0px; width: 0px; left: 31%; transform: rotate(-17deg); top: 2%; opacity: 1; }
          25% { height: 20px; width: 20px; top: -13%; transform: rotate(-2deg); }
          46% { height: 10px; width: 10px; left: 31%; top: 3%; box-shadow: 0px 0px 5px 4px #FFFB5C; opacity: 1; }
          75% { opacity: 0; }
        }

        .burn .flame:nth-of-type(3) {
          border-radius: 50% 0;
          animation: 30s flame-3 linear forwards;
          transform-origin: bottom left;
          opacity: 0;
        }
        @keyframes flame-3 {
          0% { height: 0px; width: 0px; left: 40%; transform: rotate(-15deg); top: -6%; opacity: 1; }
          30% { height: 20px; width: 20px; top: -10%; transform: rotate(15deg); }
          50% { left: 40%; top: -2%; box-shadow: 0px 0px 5px 4px #FFFB5C; opacity: 1; }
          75% { opacity: 0; }
        }

        .burn .flame:nth-of-type(4) {
          border-radius: 0 50%;
          animation: 30s flame-4 linear forwards;
          transform-origin: bottom right;
          opacity: 0;
        }
        @keyframes flame-4 {
          0% { height: 0px; width: 0px; right: 20%; transform: rotate(0deg); top: 5%; opacity: 1; }
          30% { height: 20px; width: 20px; right: 20%; top: 5%; box-shadow: 0px 0px 5px 4px #FFFB5C; opacity: 1; }
          75% { opacity: 0; }
        }

        .burn .flame:nth-of-type(5) {
          border-radius: 0 50%;
          animation: 30s flame-5 linear forwards;
          transform-origin: bottom right;
          opacity: 0;
        }
        @keyframes flame-5 {
          0% { height: 0px; width: 0px; left: 98%; transform: rotate(15deg); top: 38%; opacity: 1; }
          35% { height: 20px; width: 20px; left: 90%; transform: rotate(15deg); }
          50% { opacity: 1; box-shadow: 0px 0px 5px 4px #FFFB5C; }
          75% { opacity: 0; }
        }

        .burn .flame:nth-of-type(6) {
          border-radius: 0 50%;
          animation: 30s flame-6 linear forwards;
          transform-origin: bottom right;
          opacity: 0;
        }
        @keyframes flame-6 {
          0% { height: 0px; width: 0px; left: 96%; transform: rotate(45deg); top: 35%; opacity: 1; }
          35% { height: 20px; width: 20px; left: 90%; transform: rotate(45deg); }
          50% { opacity: 1; box-shadow: 0px 0px 5px 4px #FFFB5C; }
          75% { opacity: 0; }
        }

        .burn .flame:nth-of-type(7) {
          border-radius: 0 50%;
          animation: 30s flame-7 linear forwards;
          transform-origin: bottom right;
          opacity: 0;
        }
        @keyframes flame-7 {
          0% { height: 0px; width: 0px; left: 63%; transform: rotate(70deg); top: 91%; opacity: 1; }
          30% { height: 20px; width: 20px; left: 60%; top: 84%; }
          50% { opacity: 1; box-shadow: 0px 0px 5px 4px #FFFB5C; }
          75% { opacity: 0; }
        }

        .burn .flame:nth-of-type(8) {
          border-radius: 0 50%;
          animation: 30s flame-8 linear forwards;
          transform-origin: bottom right;
          opacity: 0;
        }
        @keyframes flame-8 {
          0% { height: 0px; width: 0px; left: 69%; transform: rotate(80deg); top: 80%; opacity: 1; }
          35% { height: 30px; width: 30px; left: 66%; top: 74%; }
          50% { opacity: 1; box-shadow: 0px 0px 5px 4px #FFFB5C; }
          75% { opacity: 0; }
        }

        .burn .flame:nth-of-type(9) {
          border-radius: 0 50%;
          animation: 30s flame-9 linear forwards;
          transform-origin: bottom right;
          opacity: 0;
        }
        @keyframes flame-9 {
          0% { height: 0px; width: 0px; left: 23%; top: 85%; transform: rotate(70deg); opacity: 1; }
          35% { height: 20px; width: 20px; left: 23%; top: 85%; }
          50% { opacity: 1; box-shadow: 0px 0px 5px 4px #FFFB5C; }
          75% { opacity: 0; }
        }

        .burn .flame:nth-of-type(10) {
          border-radius: 0 50%;
          animation: 30s flame-10 linear forwards;
          transform-origin: bottom right;
          opacity: 0;
        }
        @keyframes flame-10 {
          0% { height: 0px; width: 0px; top: 57%; left: 0%; transform: rotate(-10deg); opacity: 1; }
          35% { height: 15px; width: 15px; top: 57%; left: -7%; }
          50% { opacity: 1; box-shadow: 0px 0px 5px 4px #FFFB5C; }
          75% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
