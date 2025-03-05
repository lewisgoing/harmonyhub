// components/YouTubeAudioPlayer.tsx
import React, { useEffect, useRef } from 'react';

interface YouTubePlayerProps {
  videoId: string;
  onStateChange?: (state: number) => void;
  onReady?: () => void;
  onError?: (error: any) => void;
}

// Fix: properly define the component with forwardRef
const YouTubeAudioPlayer = React.forwardRef<any, YouTubePlayerProps>(({
  videoId, 
  onStateChange,
  onReady,
  onError
}, ref) => {  // 👈 Added ref parameter here
  const playerRef = useRef<YT.Player | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Make sure YT type is available
    if (!window.YT) {
      // Add type definition for window
      window.YT = window.YT || {};
      window.YT.Player = window.YT.Player || null;
    }

    // Load YouTube API if not already loaded
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    // Initialize player when API is ready
    const onYouTubeIframeAPIReady = () => {
      if (containerRef.current) {
        playerRef.current = new window.YT.Player(containerRef.current, {
          videoId,
          height: '0',
          width: '0',
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            enablejsapi: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            rel: 0,
          },
          events: {
            onReady: () => onReady?.(),
            onStateChange: (event) => onStateChange?.(event.data),
            onError: (event) => onError?.(event.data)
          }
        });
      }
    };

    // Setup YouTube API ready callback
    if (window.YT && window.YT.Player) {
      onYouTubeIframeAPIReady();
    } else {
      window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoId, onReady, onStateChange, onError]);

  // Method to expose player controls
  const controls = {
    play: () => playerRef.current?.playVideo(),
    pause: () => playerRef.current?.pauseVideo(),
    setVolume: (volume: number) => {
      // YouTube volume: 0 to 100
      playerRef.current?.setVolume(volume * 100);
    },
    getDuration: () => playerRef.current?.getDuration() || 0,
    getCurrentTime: () => playerRef.current?.getCurrentTime() || 0,
    seekTo: (seconds: number) => playerRef.current?.seekTo(seconds, true)
  };

  // Make controls available via ref
  React.useImperativeHandle(ref, () => controls);

  return <div ref={containerRef} className="hidden" />;
});

// Add TypeScript types for YouTube API
declare global {
  interface Window {
    YT: {
      Player: any;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export default YouTubeAudioPlayer;