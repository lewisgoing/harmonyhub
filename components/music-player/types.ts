/**
 * Core types for the Music Player application
 */

// Preset types focused on tinnitus relief
export type PresetType = 
  | "flat" 
  | "notchFilter" 
  | "speechClarity" 
  | "gentleRelief" 
  | "masking" 
  | "custom";

// Channel configuration
export type ChannelMode = "stereo" | "mono";
export type SoloMode = "none" | "left" | "right";

// Frequency bands for equalization
export interface FrequencyBand {
  id: string;
  frequency: number;
  gain: number;
  Q: number;
}

// EQ settings
export interface EQSettings {
  bands: FrequencyBand[];
  enabled: boolean;
}

// Player modes
export interface PlayerModes {
  splitEarMode: boolean;
  channelMode: ChannelMode;
  soloMode: SoloMode;
}

// Preset definition
export interface Preset {
  id: PresetType | string;
  name: string;
  description: string;
  color: {
    active: { bg: string; text: string; };
    inactive: { bg: string; text: string; };
  };
  bands: FrequencyBand[];
}

// Custom user preset with additional metadata
export interface UserPreset extends Preset {
  dateCreated: string;
  tinnitusCenterFreq?: number;
}

// Split ear configuration
export interface SplitEarConfig {
  leftEarPreset: PresetType | string;
  rightEarPreset: PresetType | string;
  balance: number; // 0 = full left, 1 = full right, 0.5 = center
}

// Song metadata
export interface Song {
  name: string;
  author: string;
  cover: string;
  audio: string;
}

// Audio playback state
export interface PlaybackState {
  isPlaying: boolean;
  progress: number;
  currentTime: number;
  duration: number;
  isLoaded: boolean;
}

// Audio engine nodes references
export interface AudioNodes {
  context: AudioContext | null;
  source: MediaElementAudioSourceNode | null;
  filters: BiquadFilterNode[];
  leftFilters: BiquadFilterNode[];
  rightFilters: BiquadFilterNode[];
  splitter: ChannelSplitterNode | null;
  merger: ChannelMergerNode | null;
  leftGain: GainNode | null;
  rightGain: GainNode | null;
}

// Calibration state
export interface CalibrationState {
  active: boolean;
  step: number;
  frequency: number;
  gain: number;
  detectedFrequencies: number[];
  presetName: string;
}