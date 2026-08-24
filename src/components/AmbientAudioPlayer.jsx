import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Volume1, VolumeX } from 'lucide-react';

/**
 * AmbientAudioPlayer Component
 * Plays YouTube track (ID: 6fBXmhBpFGE) in continuous loop across the entire site.
 * - Starts automatically on load / first physical interaction.
 * - Always persistent at bottom-right corner.
 * - Extremely subtle, sleek, faded glassmorphism aesthetic.
 * - Volume slider provided, but NO pause button ("sesini kısabilsin durduramasın bile").
 */
export default function AmbientAudioPlayer() {
  const videoId = '6fBXmhBpFGE';
  const playerRef = useRef(null);
  const isPlayingRef = useRef(false);

  const [volume, setVolume] = useState(() => {
    try {
      const v = localStorage.getItem('mayko_ambient_vol');
      return v != null ? Number(v) : 55;
    } catch (e) {
      return 55;
    }
  });

  const [isHovered, setIsHovered] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Initialize YouTube IFrame API
  useEffect(() => {
    let isCancelled = false;

    const onYouTubeIframeAPIReady = () => {
      if (isCancelled || playerRef.current) return;

      try {
        playerRef.current = new window.YT.Player('youtube-ambient-audio-frame', {
          events: {
            onReady: (event) => {
              try {
                event.target.setVolume(volume);
                event.target.playVideo();
                isPlayingRef.current = true;
                setHasStarted(true);
              } catch (e) {}
            },
            onStateChange: (event) => {
              if (event.data === window.YT.PlayerState.ENDED) {
                try {
                  event.target.playVideo();
                } catch (e) {}
              }
              if (event.data === window.YT.PlayerState.PLAYING) {
                isPlayingRef.current = true;
                setHasStarted(true);
              }
            }
          }
        });
      } catch (e) {}
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

    // Autoplay Unlock on First User Interaction (handles iOS, Safari, Chrome audio restrictions)
    const unlockAutoplay = () => {
      if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
        try {
          playerRef.current.setVolume(volume);
          playerRef.current.playVideo();
          setHasStarted(true);
        } catch (e) {}
      }
    };

    window.addEventListener('click', unlockAutoplay, { passive: true, once: true });
    window.addEventListener('touchstart', unlockAutoplay, { passive: true, once: true });
    window.addEventListener('wheel', unlockAutoplay, { passive: true, once: true });
    window.addEventListener('keydown', unlockAutoplay, { passive: true, once: true });
    window.addEventListener('scroll', unlockAutoplay, { passive: true, once: true });

    return () => {
      isCancelled = true;
      window.removeEventListener('click', unlockAutoplay);
      window.removeEventListener('touchstart', unlockAutoplay);
      window.removeEventListener('wheel', unlockAutoplay);
      window.removeEventListener('keydown', unlockAutoplay);
      window.removeEventListener('scroll', unlockAutoplay);
    };
  }, [videoId, volume]);

  // Handle Volume Changes
  const handleVolumeChange = (e) => {
    const newVol = Number(e.target.value);
    setVolume(newVol);
    try {
      localStorage.setItem('mayko_ambient_vol', String(newVol));
    } catch (err) {}

    if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
      try {
        playerRef.current.setVolume(newVol);
        if (newVol > 0 && typeof playerRef.current.playVideo === 'function') {
          playerRef.current.playVideo();
        }
      } catch (err) {}
    }
  };

  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeX size={15} />;
    if (volume < 40) return <Volume1 size={15} />;
    return <Volume2 size={15} />;
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
        <iframe
          id="youtube-ambient-audio-frame"
          src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&playsinline=1&origin=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : 'https://maykobahce.art')}`}
          allow="autoplay; encrypted-media"
          title="Ambient Audio"
          style={{ width: 1, height: 1, border: 'none' }}
        />
      </div>

      {/* Persistent Ultra-Minimal Bottom-Right Audio Control */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: 'fixed',
          bottom: 18,
          right: 18,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          borderRadius: 9999,
          background: isHovered
            ? 'rgba(15, 17, 21, 0.85)'
            : 'rgba(15, 17, 21, 0.38)',
          border: isHovered
            ? '1px solid rgba(255, 255, 255, 0.22)'
            : '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(12px)',
          boxShadow: isHovered
            ? '0 4px 20px rgba(0, 0, 0, 0.6)'
            : '0 2px 10px rgba(0, 0, 0, 0.3)',
          opacity: isHovered ? 0.95 : 0.45,
          transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          userSelect: 'none'
        }}
      >
        {/* Animated Sound Wave Equalizer Bars */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 2,
            height: 12,
            opacity: volume > 0 && hasStarted ? 0.85 : 0.25
          }}
        >
          <span
            style={{
              width: 2,
              height: '100%',
              backgroundColor: '#fda4af',
              borderRadius: 1,
              animation: volume > 0 && hasStarted ? 'ambientEqBar 1.2s ease-in-out infinite' : 'none'
            }}
          />
          <span
            style={{
              width: 2,
              height: '65%',
              backgroundColor: '#ff4d6d',
              borderRadius: 1,
              animation: volume > 0 && hasStarted ? 'ambientEqBar 0.9s ease-in-out 0.2s infinite' : 'none'
            }}
          />
          <span
            style={{
              width: 2,
              height: '85%',
              backgroundColor: '#fda4af',
              borderRadius: 1,
              animation: volume > 0 && hasStarted ? 'ambientEqBar 1.4s ease-in-out 0.4s infinite' : 'none'
            }}
          />
        </div>

        {/* Volume Icon */}
        <div
          style={{
            color: volume > 0 ? '#f1f3f7' : '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s ease'
          }}
        >
          {getVolumeIcon()}
        </div>

        {/* Ultra-Slim Volume Range Slider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            width: isHovered ? 70 : 48,
            transition: 'width 0.3s ease'
          }}
        >
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

        <style>{`
          @keyframes ambientEqBar {
            0%, 100% { transform: scaleY(0.3); }
            50% { transform: scaleY(1); }
          }
          input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #ffffff;
            cursor: pointer;
            box-shadow: 0 0 4px rgba(255, 77, 109, 0.8);
          }
          input[type=range]::-moz-range-thumb {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #ffffff;
            cursor: pointer;
            border: none;
            box-shadow: 0 0 4px rgba(255, 77, 109, 0.8);
          }
        `}</style>
      </div>
    </>
  );
}
