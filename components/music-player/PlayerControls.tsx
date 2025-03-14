"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Play, Pause, Volume2, Volume1, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { PlaybackState } from './types';

interface PlayerControlsProps {
  playbackState: PlaybackState;
  onPlayPause: () => void;
  onSeek: (value: number[]) => void;
  onVolumeChange?: (value: number[]) => void;
  volume?: number;
  showVolumeControl?: boolean;
  sliderClassName?: string;
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
  sliderClassName,
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
    if (volume === 0) return <VolumeX size={18} />;
    if (volume < 0.5) return <Volume1 size={18} />;
    return <Volume2 size={18} />;
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="w-10" />
        
        <Button 
          className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800 transition-colors"
          onClick={onPlayPause}
        >
          {isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" />}
        </Button>
        
        {showVolumeControl && onVolumeChange && (
  <div className="flex items-center space-x-2">
    <Button 
      size="icon" 
      variant="ghost" 
      className="h-8 w-8 text-gray-500"
      onClick={() => onVolumeChange([volume === 0 ? 0.5 : 0])}
    >
      {getVolumeIcon()}
    </Button>
    <Slider 
      className="w-24 player-slider" // Dark background style
      value={[volume]}
      min={0}
      max={1}
      step={0.01}
      onValueChange={onVolumeChange}
    />
  </div>
)}
        
        {!showVolumeControl && <div className="w-10" />}
      </div>
      
      <div className="space-y-1">
      <div onPointerDown={handleSliderStart}>
  <Slider
    className={`player-slider ${sliderClassName || ''}`} // Dark background style
    defaultValue={[displayProgress]}
    value={isSeeking ? undefined : [displayProgress]}
    min={0}
    max={100}
    step={0.01}
    onValueChange={handleSliderChange}
    onValueCommit={handleSliderEnd}
  />
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