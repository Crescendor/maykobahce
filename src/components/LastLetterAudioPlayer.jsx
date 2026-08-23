import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Volume1, VolumeX } from 'lucide-react';

/**
 * LastLetterAudioPlayer Component
 * Specialized YouTube Audio Engine for /last page:
 * - YouTube Video ID: NBQbekrHnsY
 * - Autoplays on entry at volume 25%.
 * - Phase 1: Starts at 2:05 (125s) with 2.5s fade-in, plays until 2:48 (168s) where it fades out to 0% & pauses.
 * - Phase 2 (When mektup yakma accepted): Starts at 2:49 (169s) with 2s fade-in, plays through until end of song (no repeat/loop).
 */
export default function LastLetterAudioPlayer({ isBurningActive }) {
  const videoId = 'NBQbekrHnsY';
  const playerRef = useRef(null);
  const fadeIntervalRef = useRef(null);
  const timeCheckIntervalRef = useRef(null);
  const isPhase1EndedRef = useRef(false);
  const isPhase2StartedRef = useRef(false);

  const [volume, setVolume] = useState(25);
  const [isHovered, setIsHovered] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Helper for smooth volume fading
  const fadeVolume = (targetVol, durationMs, onComplete) => {
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    if (!playerRef.current || typeof playerRef.current.getVolume !== 'function') return;

    const startVol = playerRef.current.getVolume();
    const steps = 20;
    const stepTime = durationMs / steps;
    const volChange = (targetVol - startVol) / steps;
    let currentStep = 0;

    fadeIntervalRef.current = setInterval(() => {
      currentStep++;
      const nextVol = Math.max(0, Math.min(100, Math.round(startVol + volChange * currentStep)));
      try {
        if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
          playerRef.current.setVolume(nextVol);
          setVolume(nextVol);
        }
      } catch (e) {}

      if (currentStep >= steps) {
        clearInterval(fadeIntervalRef.current);
        if (onComplete) onComplete();
      }
    }, stepTime);
  };

  // Initialize YouTube Player
  useEffect(() => {
    let isCancelled = false;

    const onYouTubeIframeAPIReady = () => {
      if (isCancelled || playerRef.current) return;

      playerRef.current = new window.YT.Player('youtube-last-letter-frame', {
        height: '1',
        width: '1',
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          showinfo: 0,
          rel: 0,
          loop: 0,
          modestbranding: 1,
          playsinline: 1,
          start: 125, // 2:05
          origin: window.location.origin
        },
        events: {
          onReady: (event) => {
            try {
              event.target.setVolume(0);
              event.target.seekTo(125, true);
              event.target.playVideo();
              fadeVolume(25, 2500);
              setHasStarted(true);
            } catch (e) {}
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
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

    // Autoplay unlock for browser policies
    const unlockAutoplay = () => {
      if (playerRef.current && typeof playerRef.current.playVideo === 'function' && !isPhase1EndedRef.current) {
        try {
          playerRef.current.seekTo(125, true);
          playerRef.current.playVideo();
          fadeVolume(25, 2500);
          setHasStarted(true);
        } catch (e) {}
      }
    };

    window.addEventListener('click', unlockAutoplay, { passive: true, once: true });
    window.addEventListener('touchstart', unlockAutoplay, { passive: true, once: true });
    window.addEventListener('wheel', unlockAutoplay, { passive: true, once: true });

    return () => {
      isCancelled = true;
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      if (timeCheckIntervalRef.current) clearInterval(timeCheckIntervalRef.current);
      window.removeEventListener('click', unlockAutoplay);
      window.removeEventListener('touchstart', unlockAutoplay);
      window.removeEventListener('wheel', unlockAutoplay);
    };
  }, []);

  // Monitor playback time for 2:48 fade-out pause
  useEffect(() => {
    timeCheckIntervalRef.current = setInterval(() => {
      if (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function') return;

      try {
        const currTime = playerRef.current.getCurrentTime();

        // Phase 1 Fade-out & Pause at 2:48 (168s)
        if (!isPhase1EndedRef.current && !isPhase2StartedRef.current) {
          if (currTime >= 165 && currTime < 168) {
            fadeVolume(0, 3000);
          } else if (currTime >= 168) {
            isPhase1EndedRef.current = true;
            playerRef.current.pauseVideo();
            playerRef.current.setVolume(0);
          }
        }
      } catch (e) {}
    }, 400);

    return () => {
      if (timeCheckIntervalRef.current) clearInterval(timeCheckIntervalRef.current);
    };
  }, []);

  // Handle Phase 2 (When isBurningActive turns true)
  useEffect(() => {
    if (isBurningActive && !isPhase2StartedRef.current) {
      isPhase2StartedRef.current = true;
      if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
        try {
          playerRef.current.seekTo(169, true); // 2:49
          playerRef.current.setVolume(0);
          playerRef.current.playVideo();
          fadeVolume(25, 2000);
        } catch (e) {}
      }
    }
  }, [isBurningActive]);

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
      {/* Hidden YouTube Iframe Player */}
      <div
        style={{
          position: 'fixed',
          bottom: -100,
          right: -100,
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: 'none',
          zIndex: -1
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
