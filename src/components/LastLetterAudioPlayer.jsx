import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Volume1, VolumeX } from 'lucide-react';

/**
 * LastLetterAudioPlayer Component
 * Specialized YouTube Audio Engine for /last page:
 * - YouTube Video ID: NBQbekrHnsY
 * - Autoplays immediately on page entry at volume 25%.
 * - Phase 1: Starts at 2:05 (125s), plays until 2:48 (168s) where it smooth-fades out to 0% & pauses.
 * - Triggers onPhase1Complete callback at 2:48 (168s) or after 43s safety timer to unlock action buttons.
 * - Stops audio when isLocked is true.
 * - Phase 2 (When mektup yakma accepted): Starts at 2:49 (169s) with 2s smooth fade-in, plays through until end of song (no loop).
 */
export default function LastLetterAudioPlayer({ isBurningActive, isLocked, onPhase1Complete }) {
  const videoId = 'NBQbekrHnsY';
  const playerRef = useRef(null);
  const fadeIntervalRef = useRef(null);
  const timeCheckIntervalRef = useRef(null);
  const isPhase1EndedRef = useRef(false);
  const isPhase2StartedRef = useRef(false);

  const [volume, setVolume] = useState(25);
  const [isHovered, setIsHovered] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Silky Smooth Volume Fader
  const fadeVolume = (targetVol, durationMs, onComplete) => {
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    if (!playerRef.current || typeof playerRef.current.getVolume !== 'function') {
      if (onComplete) onComplete();
      return;
    }

    const startVol = playerRef.current.getVolume();
    const steps = Math.max(10, Math.floor(durationMs / 50));
    let stepCount = 0;

    fadeIntervalRef.current = setInterval(() => {
      stepCount++;
      const progress = stepCount / steps;
      const easeFactor = targetVol < startVol
        ? Math.pow(1 - progress, 2)
        : Math.sin((progress * Math.PI) / 2);

      const currentVol = targetVol < startVol
        ? Math.round(startVol * easeFactor)
        : Math.round(startVol + (targetVol - startVol) * easeFactor);

      const clampedVol = Math.max(0, Math.min(100, currentVol));

      try {
        if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
          playerRef.current.setVolume(clampedVol);
          setVolume(clampedVol);
        }
      } catch (e) {}

      if (stepCount >= steps) {
        clearInterval(fadeIntervalRef.current);
        if (onComplete) onComplete();
      }
    }, 50);
  };

  // 1. Guaranteed 43-Second Fallback Safety Timer (125s -> 168s = 43s duration)
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (!isPhase1EndedRef.current) {
        isPhase1EndedRef.current = true;
        if (onPhase1Complete) onPhase1Complete();
      }
    }, 43000);

    return () => clearTimeout(safetyTimer);
  }, [onPhase1Complete]);

  // 2. YouTube IFrame API Initialization
  useEffect(() => {
    let isCancelled = false;

    const startAudioEngine = (eventTarget) => {
      try {
        if (typeof eventTarget.unMute === 'function') eventTarget.unMute();
        eventTarget.setVolume(25);
        eventTarget.seekTo(125, true); // 2:05
        eventTarget.playVideo();
        setHasStarted(true);
      } catch (e) {}
    };

    const onYouTubeIframeAPIReady = () => {
      if (isCancelled || playerRef.current) return;

      playerRef.current = new window.YT.Player('youtube-last-letter-frame', {
        height: '1',
        width: '1',
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          loop: 0,
          playlist: videoId,
          controls: 0,
          showinfo: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          disablekb: 1,
          fs: 0,
          start: 125, // 2:05
          origin: window.location.origin
        },
        events: {
          onReady: (event) => {
            startAudioEngine(event.target);
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              try {
                if (typeof event.target.unMute === 'function') event.target.unMute();
                event.target.setVolume(25);
              } catch (e) {}
              setHasStarted(true);
            }
          }
        }
      });
    };

    if (!window.YT || !window.YT.Player) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
    } else {
      onYouTubeIframeAPIReady();
    }

    // Universal Autoplay Unlock (Mouse Move, Pointer, Touch, Scroll, Key, Hover)
    const unlockAutoplay = () => {
      if (playerRef.current && typeof playerRef.current.playVideo === 'function' && !isPhase1EndedRef.current) {
        try {
          if (typeof playerRef.current.unMute === 'function') playerRef.current.unMute();
          playerRef.current.setVolume(25);
          playerRef.current.playVideo();
          setHasStarted(true);
        } catch (e) {}
      }
    };

    const events = ['mousemove', 'pointermove', 'mouseover', 'touchstart', 'touchend', 'scroll', 'wheel', 'keydown', 'click'];
    events.forEach(evt => window.addEventListener(evt, unlockAutoplay, { passive: true }));

    // Autoplay Retry Loop (Triggers every 200ms on entry until playback succeeds)
    const retryInterval = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.playVideo === 'function' && !isPhase1EndedRef.current) {
        try {
          if (typeof playerRef.current.unMute === 'function') playerRef.current.unMute();
          playerRef.current.setVolume(25);
          playerRef.current.playVideo();
        } catch (e) {}
      }
    }, 200);

    return () => {
      isCancelled = true;
      clearInterval(retryInterval);
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      if (timeCheckIntervalRef.current) clearInterval(timeCheckIntervalRef.current);
      events.forEach(evt => window.removeEventListener(evt, unlockAutoplay));
    };
  }, [videoId]);

  // 3. Monitor playback time for 2:48 (168s) smooth fade-out pause & button unlock
  useEffect(() => {
    timeCheckIntervalRef.current = setInterval(() => {
      if (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function') return;

      try {
        const currTime = playerRef.current.getCurrentTime();

        // Phase 1 Smooth Fade-out & Pause at 2:48 (168s)
        if (!isPhase1EndedRef.current && !isPhase2StartedRef.current) {
          if (currTime >= 163 && currTime < 168 && !playerRef.current.isFadingOut) {
            playerRef.current.isFadingOut = true;
            fadeVolume(0, 4800, () => {
              isPhase1EndedRef.current = true;
              try {
                playerRef.current.pauseVideo();
                playerRef.current.setVolume(0);
              } catch (e) {}
              if (onPhase1Complete) onPhase1Complete();
            });
          } else if (currTime >= 168) {
            isPhase1EndedRef.current = true;
            try {
              playerRef.current.pauseVideo();
              playerRef.current.setVolume(0);
            } catch (e) {}
            if (onPhase1Complete) onPhase1Complete();
          }
        }
      } catch (e) {}
    }, 200);

    return () => {
      if (timeCheckIntervalRef.current) clearInterval(timeCheckIntervalRef.current);
    };
  }, [onPhase1Complete]);

  // 4. Handle Phase 2 (When mektup yakma is accepted -> Start from 2:49 / 169s with 2s fade-in)
  useEffect(() => {
    if (isBurningActive && !isPhase2StartedRef.current) {
      isPhase2StartedRef.current = true;
      if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
        try {
          if (typeof playerRef.current.unMute === 'function') playerRef.current.unMute();
          playerRef.current.seekTo(169, true); // 2:49 (169. saniye)
          playerRef.current.setVolume(0);
          playerRef.current.playVideo();
          fadeVolume(25, 2000);
        } catch (e) {}
      }
    }
  }, [isBurningActive]);

  // 5. Handle Note Lock (Stops music when note is locked)
  useEffect(() => {
    if (isLocked && playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
      try {
        fadeVolume(0, 1200, () => {
          try {
            playerRef.current.pauseVideo();
          } catch (e) {}
        });
      } catch (e) {}
    }
  }, [isLocked]);

  // Volume slider manual change
  const handleVolumeChange = (e) => {
    const newVol = Number(e.target.value);
    setVolume(newVol);
    if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
      try {
        playerRef.current.setVolume(newVol);
      } catch (err) {}
    }
  };

  return (
    <>
      {/* Hidden YouTube Iframe Player with direct allow="autoplay" */}
      <div
        style={{
          position: 'fixed',
          bottom: -100,
          right: -100,
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: 'none'
        }}
      >
        <div id="youtube-last-letter-frame" />
      </div>

      {/* Persistent Bottom-Right Sound Bar */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: 'fixed',
          bottom: 18,
          right: 18,
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          borderRadius: 9999,
          background: isHovered ? 'rgba(15, 17, 21, 0.85)' : 'rgba(15, 17, 21, 0.38)',
          border: isHovered ? '1px solid rgba(255, 255, 255, 0.22)' : '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(12px)',
          boxShadow: isHovered ? '0 4px 20px rgba(0, 0, 0, 0.6)' : '0 2px 10px rgba(0, 0, 0, 0.3)',
          opacity: isHovered ? 0.95 : 0.45,
          transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 12, opacity: volume > 0 && hasStarted ? 0.85 : 0.25 }}>
          <span style={{ width: 2, height: '100%', backgroundColor: '#fda4af', borderRadius: 1, animation: volume > 0 && hasStarted ? 'ambientEqBar 1.2s ease-in-out infinite' : 'none' }} />
          <span style={{ width: 2, height: '65%', backgroundColor: '#ff4d6d', borderRadius: 1, animation: volume > 0 && hasStarted ? 'ambientEqBar 0.9s ease-in-out 0.2s infinite' : 'none' }} />
          <span style={{ width: 2, height: '85%', backgroundColor: '#fda4af', borderRadius: 1, animation: volume > 0 && hasStarted ? 'ambientEqBar 1.4s ease-in-out 0.4s infinite' : 'none' }} />
        </div>

        <div style={{ color: volume > 0 ? '#f1f3f7' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {volume === 0 ? <VolumeX size={15} /> : volume < 40 ? <Volume1 size={15} /> : <Volume2 size={15} />}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', width: isHovered ? 70 : 48, transition: 'width 0.3s ease' }}>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={handleVolumeChange}
            style={{
              width: '100%',
              height: 3,
              appearance: 'none',
              WebkitAppearance: 'none',
              background: `linear-gradient(to right, #ff4d6d 0%, #ff4d6d ${volume}%, rgba(255,255,255,0.18) ${volume}%, rgba(255,255,255,0.18) 100%)`,
              borderRadius: 2,
              outline: 'none',
              cursor: 'pointer'
            }}
          />
        </div>
      </div>
    </>
  );
}
