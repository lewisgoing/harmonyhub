"use client";

import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Volume1, VolumeX } from 'lucide-react';
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
}

/**
 * Format time in seconds to MM:SS format
 */
const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || !isFinite(seconds)) return '00:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Player Controls Component
 */
const PlayerControls: React.FC<PlayerControlsProps> = ({
  playbackState,
  onPlayPause,
  onSeek,
  onVolumeChange,
  volume = 1,
  showVolumeControl = false
}) => {
  const { isPlaying, progress, currentTime, duration, isLoaded } = playbackState;

  /**
   * Handle play button click
   */
  const handlePlayClick = () => {
    // Call onPlayPause even if not loaded yet - this will trigger loading
    onPlayPause();
  };

  /**
   * Get appropriate volume icon based on current volume
   */
  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeX size={18} />;
    if (volume < 0.5) return <Volume1 size={18} />;
    return <Volume2 size={18} />;
  };

  return (
    <div className="space-y-4">
      {/* Playback controls */}
      <div className="flex items-center justify-between">
        <div className="w-10" /> {/* Spacer */}
        
        <Button 
          className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800 transition-colors"
          onClick={handlePlayClick}
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} fill="white" />}
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
              className="w-24"
              value={[volume]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={onVolumeChange}
            />
          </div>
        )}
        
        {!showVolumeControl && <div className="w-10" />} {/* Spacer for symmetry */}
      </div>
      
      {/* Progress bar */}
      <div className="space-y-1">
        <Slider
          value={[progress]}
          min={0}
          max={100}
          step={0.01}
          onValueChange={onSeek}
          className="cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export default PlayerControls;