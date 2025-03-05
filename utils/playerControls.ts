// utils/playerControls.ts
export interface UnifiedPlayerControls {
    play: () => void;
    pause: () => void;
    seekTo: (position: number) => void; // Position in seconds
    setVolume: (volume: number) => void; // 0-1
    getCurrentPosition: () => Promise<number>; // Position in seconds
    getDuration: () => Promise<number>; // Duration in seconds
  }
  
  export function createYouTubeControls(player: any): UnifiedPlayerControls {
    return {
      play: () => player?.playVideo(),
      pause: () => player?.pauseVideo(),
      seekTo: (seconds) => player?.seekTo(seconds, true),
      setVolume: (volume) => player?.setVolume(volume * 100),
      getCurrentPosition: async () => player?.getCurrentTime() || 0,
      getDuration: async () => player?.getDuration() || 0
    };
  }
  
  export function createSoundCloudControls(widget: any): UnifiedPlayerControls {
    return {
      play: () => widget?.play(),
      pause: () => widget?.pause(),
      seekTo: (seconds) => widget?.seekTo(seconds * 1000),
      setVolume: (volume) => widget?.setVolume(volume * 100),
      getCurrentPosition: async () => {
        return new Promise((resolve) => {
          widget?.getPosition((position: number) => resolve(position / 1000));
        });
      },
      getDuration: async () => {
        return new Promise((resolve) => {
          widget?.getDuration((duration: number) => resolve(duration / 1000));
        });
      }
    };
  }
  
  export function createAudioElementControls(audio: HTMLAudioElement): UnifiedPlayerControls {
    return {
      play: () => audio.play(),
      pause: () => audio.pause(),
      seekTo: (seconds) => {
        audio.currentTime = seconds;
      },
      setVolume: (volume) => {
        audio.volume = volume;
      },
      getCurrentPosition: async () => audio.currentTime,
      getDuration: async () => audio.duration || 0
    };
  }