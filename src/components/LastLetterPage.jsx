import React, { useEffect, useRef, useCallback } from 'react';
import { postLogToApi } from '../utils/gardenEngine';

/**
 * LastLetterPage Component (/last)
 * Clean, Permanent Final Farewell Message Screen
 * - Immediately sends webhook notification on page land (0th second).
 * - Displays the final message card directly without burn animations or timers.
 * - Zero matchboxes, zero paper folding, zero darkness overlays.
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
  const currentStageRef = useRef('Final Mektubu Ekranı');

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

    const notifyEntry = async () => {
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
          : 'Ziyaretçi /last Sayfasına Giriş Yaptı'
      });
    };

    notifyEntry();

    return () => {
      isMounted = false;
    };
  }, [sendLog, deviceId]);

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
          stage: 'Final Mektubu Ekranı',
          deviceId: deviceId,
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

    window.addEventListener('beforeunload', handleLeavePage);
    return () => window.removeEventListener('beforeunload', handleLeavePage);
  }, [deviceId, detectDevice]);

  // Global Click, Keypress & Scroll Interaction Engine
  const lastClickTimeRef = useRef(0);
  const lastScrollTimeRef = useRef(0);

  useEffect(() => {
    // 1. Global Click Listener (Left Click & Context Menu Right Click)
    const handleClick = (e) => {
      const now = Date.now();
      if (now - lastClickTimeRef.current < 600) return; // Debounce rapid clicks
      lastClickTimeRef.current = now;

      const clickType = e.type === 'contextmenu' ? 'Sağ Tıklama (Context Menu)' : 'Sol Tıklama';
      const targetElement = e.target ? (e.target.tagName + (e.target.className ? `.${String(e.target.className).slice(0, 30)}` : '')) : 'Ekranda Rastgele Yer';
      const coords = `X: ${e.clientX || 0}px, Y: ${e.clientY || 0}px`;

      sendLog('last_user_click', {
        clickType,
        targetElement,
        coordinates: coords,
        action: `Ziyaretçi Ekrana Tıkladı (${clickType} - ${coords})`
      });
    };

    // 2. Global Keypress Listener
    const handleKeyDown = (e) => {
      if (!e.key) return;
      sendLog('last_user_keypress', {
        key: e.key,
        pressed_key: e.key,
        action: `Ziyaretçi Klavyede Tuşa Bastı ("${e.key}")`
      });
    };

    // 3. Global Scroll Gesture Listener
    const handleScroll = () => {
      const now = Date.now();
      if (now - lastScrollTimeRef.current < 2500) return; // Debounce scroll notifications (2.5s)
      lastScrollTimeRef.current = now;

      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      const scrollHeight = (document.documentElement.scrollHeight || 1) - (window.innerHeight || 1);
      const scrollPct = Math.round(Math.min(100, Math.max(0, (scrollTop / (scrollHeight || 1)) * 100)));

      sendLog('last_scroll_started', {
        scrollPercentage: `${scrollPct}%`,
        scrollStatus: `Ziyaretçi Sayfayı Kaydırdı (%${scrollPct})`,
        action: `Ziyaretçi Sayfayı Kaydırdı (%${scrollPct})`
      });
    };

    window.addEventListener('click', handleClick);
    window.addEventListener('contextmenu', handleClick);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('wheel', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('contextmenu', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', handleScroll);
    };
  }, [sendLog]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        minHeight: '100vh',
        backgroundColor: '#09090b',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        textAlign: 'center',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        overflowX: 'hidden'
      }}
    >
      {/* Background Subtle Gradient Glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(239, 68, 68, 0.08) 0%, rgba(0, 0, 0, 0) 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Main Content Box */}
      <div
        style={{
          position: 'relative',
          maxWidth: 680,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 1
        }}
      >
        {/* Farewell Title */}
        <h2
          style={{
            fontFamily: "'Cardo', Georgia, serif",
            fontSize: 'clamp(1.7rem, 4vw, 2.5rem)',
            fontWeight: 400,
            color: '#f3f4f6',
            lineHeight: 1.6,
            marginBottom: 20,
            letterSpacing: '0.02em'
          }}
        >
          Hayatımdan gelip geçtiğin için çok teşekkürler..
        </h2>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: "'Cardo', Georgia, serif",
            fontSize: 'clamp(1.15rem, 2.6vw, 1.45rem)',
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

        {/* Farewell Highlight */}
        <h3
          style={{
            fontFamily: "'Cardo', Georgia, serif",
            fontSize: 'clamp(2.2rem, 5vw, 3.2rem)',
            fontWeight: 400,
            color: '#ef4444',
            letterSpacing: '0.06em',
            margin: '0 0 36px 0',
            textShadow: '0 0 25px rgba(239, 68, 68, 0.4)'
          }}
        >
          Elveda
        </h3>

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
            backdropFilter: 'blur(12px)'
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
    </div>
  );
}
