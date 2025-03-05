declare global {
    interface Window {
      SC: {
        Widget: (iframe: HTMLIFrameElement) => {
          bind: (event: string, callback: any) => void;
          unbind: (event: string) => void;
          play: () => void;
          pause: () => void;
          setVolume: (volume: number) => void;
          getDuration: (callback: (duration: number) => void) => void;
          getPosition: (callback: (position: number) => void) => void;
          seekTo: (milliseconds: number) => void;
        };
        Widget: {
          Events: {
            READY: string;
            PLAY: string;
            PAUSE: string;
            FINISH: string;
            ERROR: string;
          };
        };
      };
    }
  }

// components/SoundCloudAudioPlayer.tsx
import React, { useEffect, useRef } from 'react';

interface SoundCloudPlayerProps {
  url: string;
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onFinish?: () => void;
  onError?: (error: any) => void;
}

// Use forwardRef properly when defining the component
const SoundCloudAudioPlayer = React.forwardRef<any, SoundCloudPlayerProps>(({
  url,
  onReady,
  onPlay,
  onPause,
  onFinish,
  onError
}, ref) => {  // 👈 The ref parameter was missing
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    // Load SoundCloud Widget API if not already loaded
    if (!window.SC) {
      const script = document.createElement('script');
      script.src = 'https://w.soundcloud.com/player/api.js';
      document.body.appendChild(script);
      
      script.onload = initializeWidget;
    } else {
      initializeWidget();
    }

    function initializeWidget() {
      if (iframeRef.current) {
        widgetRef.current = window.SC.Widget(iframeRef.current);
        
        widgetRef.current.bind(window.SC.Widget.Events.READY, () => {
          console.log('SoundCloud widget ready');
          onReady?.();
        });
        
        widgetRef.current.bind(window.SC.Widget.Events.PLAY, onPlay);
        widgetRef.current.bind(window.SC.Widget.Events.PAUSE, onPause);
        widgetRef.current.bind(window.SC.Widget.Events.FINISH, onFinish);
        widgetRef.current.bind(window.SC.Widget.Events.ERROR, onError);
      }
    }

    return () => {
      if (widgetRef.current) {
        // Unbind events
        widgetRef.current.unbind(window.SC.Widget.Events.READY);
        widgetRef.current.unbind(window.SC.Widget.Events.PLAY);
        widgetRef.current.unbind(window.SC.Widget.Events.PAUSE);
        widgetRef.current.unbind(window.SC.Widget.Events.FINISH);
        widgetRef.current.unbind(window.SC.Widget.Events.ERROR);
      }
    };
  }, [url, onReady, onPlay, onPause, onFinish, onError]);

  // Method to expose player controls
  const controls = {
    play: () => widgetRef.current?.play(),
    pause: () => widgetRef.current?.pause(),
    setVolume: (volume: number) => {
      // SoundCloud volume: 0 to 100
      widgetRef.current?.setVolume(volume * 100);
    },
    getDuration: (callback: (duration: number) => void) => {
      widgetRef.current?.getDuration(callback);
    },
    getCurrentPosition: (callback: (position: number) => void) => {
      widgetRef.current?.getPosition(callback);
    },
    seekTo: (milliseconds: number) => {
      widgetRef.current?.seekTo(milliseconds);
    }
  };

  // Now ref is properly defined
  React.useImperativeHandle(ref, () => controls);

  return (
    <iframe
      ref={iframeRef}
      width="0"
      height="0"
      scrolling="no"
      frameBorder="no"
      src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false`}
      className="hidden"
    />
  );
});

export default SoundCloudAudioPlayer;