"use client";

import { useState, useEffect, useRef } from 'react';
import { PlaybackState, Song } from '../types';
import AudioEngine from '../AudioEngine';

interface UseAudioContextProps {
  song: Song;
}

interface UseAudioContextReturn {
  playbackState: PlaybackState;
  audioRef: React.RefObject<HTMLAudioElement>;
  audioEngine: AudioEngine | null;
  togglePlayPause: () => Promise<void>;
  handleSeek: (value: number[]) => void;
  setVolume: (value: number) => void;
  volume: number;
}

/**
 * Custom hook for managing audio context and playback
 */
export function useAudioContext({ song }: UseAudioContextProps): UseAudioContextReturn {
  // Audio element reference
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Audio engine reference
  const audioEngineRef = useRef<AudioEngine | null>(null);
  
  // Playback state
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    progress: 0,
    currentTime: 0,
    duration: 0,
    isLoaded: false
  });
  
  // Volume state (0-1)
  const [volume, setVolumeState] = useState(0.7);
  
  // Flag to track if audio context is initialized
  const [audioInitialized, setAudioInitialized] = useState(false);
  
  // Create audio element
  useEffect(() => {
    console.log('Setting up audio element for song:', song.audio);
    
    // Clean up previous audio engine
    if (audioEngineRef.current) {
      audioEngineRef.current.dispose();
      audioEngineRef.current = null;
    }
    
    // Create new audio element if it doesn't exist
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    
    // Ensure event listeners are properly set up
    const audio = audioRef.current;
    
    // Remove any existing listeners to avoid duplicates
    audio.removeEventListener('canplaythrough', handleCanPlayThrough);
    audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    audio.removeEventListener('error', handleError);
    audio.removeEventListener('timeupdate', handleTimeUpdate);
    audio.removeEventListener('ended', handleEnded);
    
    // Add event listeners
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('error', handleError);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    
    // Set preload attribute to auto to help with metadata loading
    audio.preload = 'auto';
    
    // Load song
    if (audio && song.audio) {
      // Reset playback state first
      setPlaybackState({
        isPlaying: false,
        progress: 0,
        currentTime: 0,
        duration: 0,
        isLoaded: false
      });
      
      // Set src and load
      audio.src = song.audio;
      audio.crossOrigin = 'anonymous';
      audio.volume = volume;
      
      // Explicitly load the audio to trigger metadata loading
      audio.load();
      
      console.log("Audio element set up with src:", audio.src);
    }
    
    // Clean up on unmount
    return () => {
      if (audio) {
        audio.removeEventListener('canplaythrough', handleCanPlayThrough);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('error', handleError);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
        
        audio.pause();
      }
      
      if (audioEngineRef.current) {
        audioEngineRef.current.dispose();
      }
    };
  }, [song.audio]);
  
  /**
   * Initialize audio engine when audio element is ready
   */
  const initializeAudioEngine = async () => {
    if (audioRef.current && !audioEngineRef.current) {
      const engine = new AudioEngine(audioRef.current);
      const success = await engine.initialize();
      
      if (success) {
        audioEngineRef.current = engine;
        setAudioInitialized(true);
        return true;
      } else {
        console.error('Failed to initialize audio engine');
        return false;
      }
    }
    
    return false;
  };
  
  /**
   * Toggle play/pause
   */
  const togglePlayPause = async () => {
    try {
      if (!audioRef.current) {
        console.error('No audio element available');
        return;
      }
      
      if (playbackState.isPlaying) {
        // Pause playback
        audioRef.current.pause();
        setPlaybackState(prev => ({ ...prev, isPlaying: false }));
      } else {
        // Initialize audio engine if needed
        if (!audioInitialized) {
          console.log("First play - initializing audio engine");
          const success = await initializeAudioEngine();
          if (!success) {
            console.error('Failed to initialize audio');
            // Don't show an alert as it might disrupt UX, just log the error
            console.warn('Failed to initialize audio. Try again or use a different browser.');
            return;
          }
        } else if (audioEngineRef.current) {
          // Update audio routing in case settings changed while paused
          await audioEngineRef.current.updateAudioRouting();
        }
        
        // Resume audio context if suspended (needed for Chrome's autoplay policy)
        if (audioEngineRef.current?.nodes.context?.state === 'suspended') {
          console.log("Audio context suspended, attempting to resume...");
          try {
            await audioEngineRef.current.nodes.context.resume();
            console.log("Audio context resumed successfully");
          } catch (resumeError) {
            console.warn("Failed to resume audio context:", resumeError);
            // Continue anyway as the play() call might trigger the resume
          }
        }
        
        // Ensure audio is loaded
        if (!playbackState.isLoaded) {
          try {
            audioRef.current.load();
            await new Promise<void>((resolve, reject) => {
              const loadTimeout = setTimeout(() => {
                reject(new Error('Audio loading timed out'));
              }, 5000);
              
              if (audioRef.current) {
                audioRef.current.oncanplaythrough = () => {
                  clearTimeout(loadTimeout);
                  setPlaybackState(prev => ({ ...prev, isLoaded: true }));
                  resolve();
                };
                
                audioRef.current.onerror = () => {
                  clearTimeout(loadTimeout);
                  reject(new Error('Audio loading failed'));
                };
              }
            });
          } catch (error) {
            console.error('Failed to load audio:', error);
            console.warn(`Failed to load audio: ${(error as Error).message}`);
            return;
          }
        }
        
        // Play audio
        try {
          console.log("Starting playback...");
          // First, try to resume the audio context
          if (audioEngineRef.current?.nodes.context) {
            await audioEngineRef.current.nodes.context.resume();
          }
          
          // Then, try to play the audio
          const playPromise = audioRef.current.play();
          await playPromise;
          setPlaybackState(prev => ({ ...prev, isPlaying: true }));
          console.log("✅ Playback started successfully");
        } catch (error) {
          console.error('❌ Playback error:', error);
          
          // Handle autoplay policy error
          if (error instanceof Error && error.name === 'NotAllowedError') {
            console.warn('Autoplay blocked by browser. Please try clicking play again.');
            alert('Browser requires a user interaction to play audio.\nPlease click the play button again.');
          } else {
            console.warn(`Playback error: ${error}`);
          }
        }
      }
    } catch (error) {
      console.error('Error in togglePlayPause:', error);
    }
  };
  
  /**
   * Handle seeking
   */
  const handleSeek = (value: number[]) => {
    if (audioRef.current && playbackState.duration > 0) {
      const newTime = (value[0] / 100) * playbackState.duration;
      audioRef.current.currentTime = newTime;
      
      // Update progress immediately for smoother UI
      setPlaybackState(prev => ({
        ...prev,
        progress: value[0],
        currentTime: newTime
      }));
    }
  };
  
  /**
   * Set volume
   */
  const setVolume = (value: number) => {
    const newVolume = Math.max(0, Math.min(1, value));
    
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    
    setVolumeState(newVolume);
  };
  
  /**
   * Event handlers
   */
  const handleCanPlayThrough = () => {
    console.log('Audio can play through');
    setPlaybackState(prev => ({ ...prev, isLoaded: true }));
  };
  
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const duration = audioRef.current.duration;
      console.log('Audio metadata loaded, duration:', duration);
      
      // Only update if we have a valid duration
      if (duration && isFinite(duration)) {
        setPlaybackState(prev => ({
          ...prev,
          duration,
          isLoaded: true // Consider it loaded once we have metadata
        }));
      }
    }
  };
  
  const handleError = (e: Event) => {
    console.error('Audio element error:', e);
    console.error('Current src:', audioRef.current?.src);
    
    // Try to get more detailed error information
    const mediaError = audioRef.current?.error;
    if (mediaError) {
      console.error('MediaError code:', mediaError.code);
      console.error('MediaError message:', mediaError.message);
    }
    
    // Let's NOT show an alert as it can be disruptive - just log to console
    // alert('Error loading audio. Please check console for details.');
    
    // Set a default duration so UI doesn't show 0:00
    setPlaybackState(prev => ({
      ...prev,
      duration: 180, // 3 minutes default
      isLoaded: true  // Consider it loaded so playback can at least be attempted
    }));
  };
  
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const currentTime = audioRef.current.currentTime;
      const progress = (currentTime / (audioRef.current.duration || 1)) * 100;
      
      setPlaybackState(prev => ({
        ...prev,
        currentTime,
        progress
      }));
    }
  };
  
  const handleEnded = () => {
    setPlaybackState(prev => ({
      ...prev,
      isPlaying: false,
      progress: 0,
      currentTime: 0
    }));
    
    // Reset to beginning
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };
  
  return {
    playbackState,
    audioRef,
    audioEngine: audioEngineRef.current,
    togglePlayPause,
    handleSeek,
    setVolume,
    volume
  };
}

export default useAudioContext;