"use client";
import React from 'react';
import { Separator } from '@/components/ui/separator';
import { Preset, UserPreset, PresetType, SplitEarConfig } from './types';
import Presets from './Presets';

interface SplitEarControlsProps {
  // Preset data
  builtInPresets: Record<string, Preset>;
  userPresets: Record<string, UserPreset>;
  splitEarConfig: SplitEarConfig;
  
  // Callbacks
  onLeftEarPresetSelect: (preset: Preset) => void;
  onRightEarPresetSelect: (preset: Preset) => void;
  onDeletePreset?: (presetId: string) => void;
  onSavePreset?: () => void;
  
  // Display options
  showUserPresets?: boolean;
  showDeleteButton?: boolean;
  isEQEnabled?: boolean;
  leftEarEnabled?: boolean;
  rightEarEnabled?: boolean;
}

/**
 * Split Ear Controls Component
 * Displays separate preset selections for left and right ears
 */
const SplitEarControls: React.FC<SplitEarControlsProps> = ({
  builtInPresets,
  userPresets,
  splitEarConfig,
  onLeftEarPresetSelect,
  onRightEarPresetSelect,
  onDeletePreset,
  onSavePreset,
  showUserPresets = true,
  showDeleteButton = true,
  isEQEnabled = true,
  leftEarEnabled = true,
  rightEarEnabled = true
}) => {
  return (
    <div className="space-y-6">
      {/* Left ear presets */}
      <div className={`${!isEQEnabled || !leftEarEnabled ? 'opacity-60' : ''}`}>
        <Presets 
          presets={builtInPresets}
          userPresets={userPresets}
          activePresetId={splitEarConfig.leftEarPreset}
          ear="left"
          onPresetSelect={onLeftEarPresetSelect}
          onDeletePreset={onDeletePreset}
          onSavePreset={onSavePreset}
          showUserPresets={showUserPresets}
          showDeleteButton={showDeleteButton}
          showLabel={true}
        />
      </div>
      
      <Separator className="opacity-30" />
      
      {/* Right ear presets */}
      <div className={`${!isEQEnabled || !rightEarEnabled ? 'opacity-60' : ''}`}>
        <Presets 
          presets={builtInPresets}
          userPresets={userPresets}
          activePresetId={splitEarConfig.rightEarPreset}
          ear="right"
          onPresetSelect={onRightEarPresetSelect}
          onDeletePreset={onDeletePreset}
          onSavePreset={onSavePreset}
          showUserPresets={showUserPresets}
          showDeleteButton={showDeleteButton}
          showLabel={true}
        />
      </div>
    </div>
  );
};

export default SplitEarControls;