"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Play, Pause, Volume2, Volume1, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { PlaybackState } from './types';
import { cn } from "@/lib/utils";

interface PlayerControlsProps {
  playbackState: PlaybackState;
  onPlayPause: () => void;
  onSeek: (value: number[]) => void;
  onVolumeChange?: (value: number[]) => void;
  volume?: number;
  showVolumeControl?: boolean;
}

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || !isFinite(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const PlayerControls: React.FC<PlayerControlsProps> = ({
  playbackState,
  onPlayPause,
  onSeek,
  onVolumeChange,
  volume = 1,
  showVolumeControl = false,
}) => {
  const { isPlaying, progress, currentTime, duration, isLoaded } = playbackState;
  
  // Use a ref to track the last seen progress to avoid excessive re-renders
  const progressRef = useRef(progress);
  // Only use state for displayed values, not for controlling the slider
  const [displayProgress, setDisplayProgress] = useState(progress);
  const [isSeeking, setIsSeeking] = useState(false);
  
  // Throttle updates to avoid too many re-renders
  useEffect(() => {
    // Skip updates while user is seeking
    if (isSeeking) return;
    
    // Only update if progress has changed significantly (0.5%)
    if (Math.abs(progressRef.current - progress) > 0.5) {
      progressRef.current = progress;
      // Use requestAnimationFrame to batch updates and prevent too many renders
      requestAnimationFrame(() => {
        setDisplayProgress(progress);
      });
    }
  }, [progress, isSeeking]);
  
  // Custom handlers for the slider
  const handleSliderStart = () => {
    setIsSeeking(true);
  };
  
  const handleSliderEnd = (value: number[]) => {
    // Update our ref
    progressRef.current = value[0];
    // Update display
    setDisplayProgress(value[0]);
    // Trigger actual seek
    onSeek(value);
    // Reset seeking state
    setIsSeeking(false);
  };
  
  // We completely bypass slider's controlled behavior while seeking
  const handleSliderChange = (value: number[]) => {
    if (isSeeking) {
      setDisplayProgress(value[0]);
    }
  };

  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeX size={18} fill="white" />;
    if (volume < 0.5) return <Volume1 size={18} fill="white" />;
    return <Volume2 size={18} fill="white" />;
  };

  // Apply direct classNames to override the default slider styles
  const progressSliderClass = cn(
    "w-full",
    "player-slider"
  );
  
  const volumeSliderClass = cn(
    "w-24",
    "volume-slider"
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="w-10" />
        
        <Button 
          className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:bg-gray-200 transition-colors player-controls-play-button"
          onClick={onPlayPause}
        >
          {isPlaying ? <Pause size={24} fill="black" stroke="black" /> : <Play size={24} fill="black" stroke="black" />}
        </Button>
        
        {showVolumeControl && onVolumeChange && (
          <div className="flex items-center space-x-2">
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8"
              onClick={() => onVolumeChange([volume === 0 ? 0.5 : 0])}
            >
              {getVolumeIcon()}
            </Button>
            <div className="inline-block relative">
              <style jsx>{`
                /* Direct styling via JSX */
                :global(.volume-slider [data-orientation="horizontal"]) {
                  background-color: #374151 !important;
                  height: 4px !important;
                }
                :global(.volume-slider [data-orientation="horizontal"] > div) {
                  background-color: white !important;
                }
                :global(.volume-slider [role="slider"]) {
                  background-color: white !important;
                  border-color: white !important;
                  height: 12px !important;
                  width: 12px !important;
                }
              `}</style>
              <Slider 
                className={volumeSliderClass}
                value={[volume]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={onVolumeChange}
              />
            </div>
          </div>
        )}
        
        {!showVolumeControl && <div className="w-10" />}
      </div>
      
      <div className="space-y-1">
        <div onPointerDown={handleSliderStart}>
          <div className="inline-block relative w-full">
            <style jsx>{`
              /* Direct styling via JSX */
              :global(.player-slider [data-orientation="horizontal"]) {
                background-color: #374151 !important;
                height: 4px !important;
              }
              :global(.player-slider [data-orientation="horizontal"] > div) {
                background-color: white !important;
              }
              :global(.player-slider [role="slider"]) {
                background-color: white !important;
                border-color: white !important;
                height: 16px !important;
                width: 16px !important;
              }
            `}</style>
            <Slider
              className={progressSliderClass}
              defaultValue={[displayProgress]}
              value={isSeeking ? undefined : [displayProgress]}
              min={0}
              max={100}
              step={0.01}
              onValueChange={handleSliderChange}
              onValueCommit={handleSliderEnd}
            />
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-300">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export default PlayerControls;