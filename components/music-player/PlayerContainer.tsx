"use client";



import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

// Custom hooks
import useAudioContext from './hooks/useAudioContext';
import useEQPresets from './hooks/useEQPresets';

// Components
import EQVisualization from './EQVisualization';
import PlayerControls from './PlayerControls';
import EQControls from './EQControls';
import Presets from './Presets';
import SplitEarControls from './SplitEarControls';
import CalibrationWizard from './CalibrationWizard';

// Types and constants
import { SplitEarConfig, FrequencyBand, Preset, UserPreset } from './types';
import { DEMO_SONG, DEFAULT_FREQUENCY_BANDS, STORAGE_KEYS } from './constants';

/**
* Main Music Player Container Component
*/
const PlayerContainer: React.FC = () => {
const { toast } = useToast();

// EQ state
const [isEQEnabled, setIsEQEnabled] = useState(true);
const [isSplitEarMode, setIsSplitEarMode] = useState(false);
const [activeTab, setActiveTab] = useState('eq');


// Get presets from hook
const { 
  presets, 
  userPresets, 
  saveUserPreset, 
  deleteUserPreset,
  getPresetById,
  createCustomPreset
} = useEQPresets();

// Preset state
const [unifiedPresetId, setUnifiedPresetId] = useState('flat');
const [splitEarConfig, setSplitEarConfig] = useState<SplitEarConfig>({
  leftEarPreset: 'flat',
  rightEarPreset: 'flat',
  balance: 0.5
});

// Frequency bands for EQ
const [unifiedBands, setUnifiedBands] = useState<FrequencyBand[]>([...DEFAULT_FREQUENCY_BANDS]);
const [leftEarBands, setLeftEarBands] = useState<FrequencyBand[]>([...DEFAULT_FREQUENCY_BANDS]);
const [rightEarBands, setRightEarBands] = useState<FrequencyBand[]>([...DEFAULT_FREQUENCY_BANDS]);

// Calibration state
const [isCalibrationOpen, setIsCalibrationOpen] = useState(false);

// Audio context state
const { 
  playbackState, 
  audioRef, 
  audioEngine, 
  togglePlayPause, 
  handleSeek,
  setVolume,
  volume 
} = useAudioContext({ song: DEMO_SONG });

// Ensure audio is loaded on component mount
useEffect(() => {
  // Force preloading the audio
  if (audioRef.current) {
    audioRef.current.preload = 'auto';
    audioRef.current.load();
    
    // Try to get duration directly
    const checkDuration = () => {
      const duration = audioRef.current?.duration;
      if (duration && isFinite(duration) && duration > 0) {
        console.log('Directly detected duration:', duration);
      }
    };
    
    // Check after a short delay
    setTimeout(checkDuration, 1000);
  }
}, [audioRef]);


// Frequency response data for visualization
const [frequencyResponseData, setFrequencyResponseData] = useState<{
  frequencies: Float32Array;
  leftMagnitudes: Float32Array;
  rightMagnitudes: Float32Array;
} | undefined>(undefined);

// Load saved settings from localStorage
useEffect(() => {
  try {
    // Load last preset
    const lastPresetId = localStorage.getItem(STORAGE_KEYS.LAST_PRESET);
    if (lastPresetId) {
      const preset = getPresetById(lastPresetId);
      if (preset) {
        setUnifiedPresetId(preset.id);
        setUnifiedBands([...preset.bands]);
      }
    }
    
    // Load playback settings
    const playbackSettingsJSON = localStorage.getItem(STORAGE_KEYS.PLAYBACK_SETTINGS);
    if (playbackSettingsJSON) {
      const settings = JSON.parse(playbackSettingsJSON);
      setIsEQEnabled(settings.isEQEnabled ?? true);
      setIsSplitEarMode(settings.isSplitEarMode ?? false);
      
      if (settings.splitEarConfig) {
        setSplitEarConfig(settings.splitEarConfig);
        
        // Load left ear preset
        const leftPreset = getPresetById(settings.splitEarConfig.leftEarPreset);
        if (leftPreset) {
          setLeftEarBands([...leftPreset.bands]);
        }
        
        // Load right ear preset
        const rightPreset = getPresetById(settings.splitEarConfig.rightEarPreset);
        if (rightPreset) {
          setRightEarBands([...rightPreset.bands]);
        }
      }
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}, []);

// Save settings to localStorage when they change
useEffect(() => {
  try {
    // Save last preset
    localStorage.setItem(STORAGE_KEYS.LAST_PRESET, unifiedPresetId);
    
    // Save playback settings
    const settings = {
      isEQEnabled,
      isSplitEarMode,
      splitEarConfig
    };
    localStorage.setItem(STORAGE_KEYS.PLAYBACK_SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}, [isEQEnabled, isSplitEarMode, splitEarConfig, unifiedPresetId]);

// Update audio engine when EQ settings change
useEffect(() => {
  if (!audioEngine) return;
  
  // Update EQ enabled state
  audioEngine.setEQEnabled(isEQEnabled);
  
  // Update split ear mode
  audioEngine.setSplitEarMode(isSplitEarMode);
  
  // Update EQ bands
  audioEngine.setUnifiedBands(unifiedBands);
  audioEngine.setLeftEarBands(leftEarBands);
  audioEngine.setRightEarBands(rightEarBands);
  
  // Update balance
  audioEngine.setBalance(splitEarConfig.balance);
  
  // Update frequency response data for visualization
  const responseData = audioEngine.getFrequencyResponse();
  setFrequencyResponseData(responseData);
}, [
  audioEngine, 
  isEQEnabled, 
  isSplitEarMode, 
  unifiedBands, 
  leftEarBands, 
  rightEarBands, 
  splitEarConfig.balance
]);

/**
 * Toggle EQ on/off
 */
const handleEQToggle = () => {
  setIsEQEnabled(!isEQEnabled);
};

/**
 * Toggle split ear mode
 */
const handleSplitEarToggle = () => {
  setIsSplitEarMode(!isSplitEarMode);
};

/**
 * Update balance
 */
const handleBalanceChange = (value: number[]) => {
  setSplitEarConfig(prev => ({
    ...prev,
    balance: value[0]
  }));
};

/**
 * Reset EQ to flat
 */
const handleResetEQ = () => {
  const flatPreset = presets.flat;
  
  if (isSplitEarMode) {
    // Reset both ears to flat
    handleLeftEarPresetSelect(flatPreset);
    handleRightEarPresetSelect(flatPreset);
    
    // Reset balance to center
    setSplitEarConfig(prev => ({
      ...prev,
      balance: 0.5
    }));
  } else {
    // Reset unified preset to flat
    handleUnifiedPresetSelect(flatPreset);
  }
  
  toast({
    title: "EQ Reset",
    description: "EQ settings have been reset to flat",
  });
};

/**
 * Apply unified preset
 */
const handleUnifiedPresetSelect = (preset: Preset) => {
  setUnifiedPresetId(preset.id);
  setUnifiedBands([...preset.bands]);
  
  if (audioEngine) {
    audioEngine.applyUnifiedPreset(preset);
    
    // Update frequency response data
    const responseData = audioEngine.getFrequencyResponse();
    setFrequencyResponseData(responseData);
  }
};

/**
 * Apply left ear preset
 */
const handleLeftEarPresetSelect = (preset: Preset) => {
  setSplitEarConfig(prev => ({
    ...prev,
    leftEarPreset: preset.id
  }));
  setLeftEarBands([...preset.bands]);
  
  if (audioEngine) {
    audioEngine.applyLeftEarPreset(preset);
    
    // Update frequency response data
    const responseData = audioEngine.getFrequencyResponse();
    setFrequencyResponseData(responseData);
  }
};

/**
 * Apply right ear preset
 */
const handleRightEarPresetSelect = (preset: Preset) => {
  setSplitEarConfig(prev => ({
    ...prev,
    rightEarPreset: preset.id
  }));
  setRightEarBands([...preset.bands]);
  
  if (audioEngine) {
    audioEngine.applyRightEarPreset(preset);
    
    // Update frequency response data
    const responseData = audioEngine.getFrequencyResponse();
    setFrequencyResponseData(responseData);
  }
};

/**
 * Update a single frequency band
 */
const handleBandChange = (
  bandId: string,
  newGain: number,
  newQ?: number,
  channel: 'unified' | 'left' | 'right' = 'unified'
) => {
  // Handle different channels
  if (channel === 'unified') {
    setUnifiedBands(prev => prev.map(band => 
      band.id === bandId 
        ? { ...band, gain: newGain, ...(newQ ? { Q: newQ } : {}) } 
        : band
    ));
  } else if (channel === 'left') {
    setLeftEarBands(prev => prev.map(band => 
      band.id === bandId 
        ? { ...band, gain: newGain, ...(newQ ? { Q: newQ } : {}) } 
        : band
    ));
  } else if (channel === 'right') {
    setRightEarBands(prev => prev.map(band => 
      band.id === bandId 
        ? { ...band, gain: newGain, ...(newQ ? { Q: newQ } : {}) } 
        : band
    ));
  }
};

/**
 * Handle calibration completion
 */
const handleCalibrationComplete = (preset: UserPreset) => {
  // Save the preset
  saveUserPreset(preset);
  
  // Apply the preset
  handleUnifiedPresetSelect(preset);
  
  // Close the calibration dialog
  setIsCalibrationOpen(false);
  
  // Show success toast
  toast({
    title: "Calibration Complete",
    description: `Your custom preset "${preset.name}" has been created and applied.`,
  });
};

/**
 * Handle preset deletion
 */
const handleDeletePreset = (presetId: string) => {
  // Check if the preset is currently active
  const isActiveUnified = presetId === unifiedPresetId;
  const isActiveLeft = presetId === splitEarConfig.leftEarPreset;
  const isActiveRight = presetId === splitEarConfig.rightEarPreset;
  
  // If active, switch to flat preset first
  if (isActiveUnified) {
    handleUnifiedPresetSelect(presets.flat);
  }
  
  if (isActiveLeft) {
    handleLeftEarPresetSelect(presets.flat);
  }
  
  if (isActiveRight) {
    handleRightEarPresetSelect(presets.flat);
  }
  
  // Delete the preset
  deleteUserPreset(presetId);
  
  // Show toast
  toast({
    title: "Preset Deleted",
    description: "Custom preset has been removed.",
  });
};

return (
  <Card className="w-[400px] overflow-hidden bg-white rounded-xl shadow-lg">
    {/* Hidden audio element */}
    <audio ref={audioRef} />
    
    {/* Album cover and track info */}
    <CardHeader className="p-0 relative bg-gradient-to-b from-neutral-800 to-black h-56 flex flex-col justify-end">
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
      
      {/* Album cover */}
      <div className="absolute top-4 left-4 w-36 h-36 rounded-md overflow-hidden shadow-lg">
        <img 
          src={DEMO_SONG.cover} 
          alt="Album cover" 
          className="w-full h-full object-cover" 
        />
      </div>
      
      {/* Track info */}
      <div className="relative p-4 text-white">
        <h2 className="text-lg font-bold">{DEMO_SONG.name}</h2>
        <p className="text-sm text-white/80">{DEMO_SONG.author}</p>
      </div>
    </CardHeader>
    
    <CardContent className="p-4">
      <div className="space-y-4">
        {/* Playback controls */}
        <PlayerControls 
          playbackState={playbackState}
          onPlayPause={togglePlayPause}
          onSeek={handleSeek}
          onVolumeChange={values => setVolume(values[0])}
          volume={volume}
          showVolumeControl={true}
        />
        
        {/* EQ visualization */}
        <EQVisualization 
          isEQEnabled={isEQEnabled}
          isSplitEarMode={isSplitEarMode}
          unifiedBands={unifiedBands}
          leftEarBands={leftEarBands}
          rightEarBands={rightEarBands}
          frequencyResponseData={frequencyResponseData}
          onBandChange={handleBandChange}
          height={140}
        />
        
        {/* EQ controls */}
        <EQControls 
          isEQEnabled={isEQEnabled}
          isSplitEarMode={isSplitEarMode}
          splitEarConfig={splitEarConfig}
          onEQToggle={handleEQToggle}
          onSplitEarToggle={handleSplitEarToggle}
          onBalanceChange={handleBalanceChange}
          onResetEQ={handleResetEQ}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          showCalibration={true}
          onStartCalibration={() => setIsCalibrationOpen(true)}
        />
        
        {/* Presets */}
        {activeTab === 'eq' && (
          <div className="mt-4 pt-2 border-t border-gray-100">
            {isSplitEarMode ? (
              <SplitEarControls 
                builtInPresets={presets}
                userPresets={userPresets}
                splitEarConfig={splitEarConfig}
                onLeftEarPresetSelect={handleLeftEarPresetSelect}
                onRightEarPresetSelect={handleRightEarPresetSelect}
                onDeletePreset={handleDeletePreset}
                showUserPresets={true}
                showDeleteButton={true}
                isEQEnabled={isEQEnabled}
              />
            ) : (
              <Presets 
                presets={presets}
                userPresets={userPresets}
                activePresetId={unifiedPresetId}
                onPresetSelect={handleUnifiedPresetSelect}
                onDeletePreset={handleDeletePreset}
                showUserPresets={true}
                showDeleteButton={true}
                className={isEQEnabled ? '' : 'opacity-60'}
              />
            )}
          </div>
        )}
      </div>
    </CardContent>
    
    {/* Calibration Dialog */}
    <Dialog open={isCalibrationOpen} onOpenChange={setIsCalibrationOpen}>
      <DialogContent className="max-w-xl p-0">
        <CalibrationWizard 
          onComplete={handleCalibrationComplete}
          onCancel={() => setIsCalibrationOpen(false)}
        />
      </DialogContent>
    </Dialog>
  </Card>
);
};

export default PlayerContainer;