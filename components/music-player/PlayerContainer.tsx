"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

// Custom hooks
import useAudioContext from './hooks/useAudioContext';
import useEQPresets from './hooks/useEQPresets';
import { useAuthContext } from '@/components/auth/AuthProvider';

// Firebase services
import { 
  getUserPresets, 
  saveUserPreset, 
  deleteUserPreset as deleteFirestorePreset,
  savePlaybackSettings,
  getPlaybackSettings
} from '@/lib/firestore';

// Components
import EQVisualization from './EQVisualization';
import PlayerControls from './PlayerControls';
import EQControls from './EQControls';
import Presets from './Presets';
import SplitEarControls from './SplitEarControls';
import CalibrationWizard from './CalibrationWizard';
import UserProfile from '@/components/auth/UserProfile';
import CloudStatus from '@/components/CloudStatus';
import CloudPromotion from '@/components/CloudPromotion';
import CloudSyncDialog from '@/components/CloudSyncDialog';

// Types and constants
import { SplitEarConfig, FrequencyBand, Preset, UserPreset } from './types';
import { DEMO_SONG, DEFAULT_FREQUENCY_BANDS, STORAGE_KEYS } from './constants';

/**
* Main Music Player Container Component
*/
const PlayerContainer: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuthContext();

  // EQ state
  const [isEQEnabled, setIsEQEnabled] = useState(true);
  const [isSplitEarMode, setIsSplitEarMode] = useState(false);
  const [activeTab, setActiveTab] = useState('eq');

  // Get presets from hook
  const { 
    presets, 
    userPresets, 
    saveUserPreset: saveLocalPreset, 
    deleteUserPreset: deleteLocalPreset,
    getPresetById,
    createCustomPreset
  } = useEQPresets();
  
  // User preset state from Firebase
  const [firestorePresets, setFirestorePresets] = useState<Record<string, UserPreset>>({});
  const [isLoadingPresets, setIsLoadingPresets] = useState(true);

  // Cloud sync dialog state
  const [showCloudSyncDialog, setShowCloudSyncDialog] = useState(false);
  const [pendingCloudSettings, setPendingCloudSettings] = useState<any>(null);
  const [pendingCloudPresets, setPendingCloudPresets] = useState<Record<string, UserPreset>>({});

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

  const handleFrequencyChange = (
    bandId: string,
    newFrequency: number,
    channel: 'unified' | 'left' | 'right'
  ) => {
    // Update the frequency for the specified band based on channel
    if (channel === 'unified') {
      setUnifiedBands(prev => prev.map(band => 
        band.id === bandId 
          ? { ...band, frequency: newFrequency } 
          : band
      ));
    } else if (channel === 'left') {
      setLeftEarBands(prev => prev.map(band => 
        band.id === bandId 
          ? { ...band, frequency: newFrequency } 
          : band
      ));
    } else if (channel === 'right') {
      setRightEarBands(prev => prev.map(band => 
        band.id === bandId 
          ? { ...band, frequency: newFrequency } 
          : band
      ));
    }
  };

  // Frequency response data for visualization
  const [frequencyResponseData, setFrequencyResponseData] = useState<{
    frequencies: Float32Array;
    leftMagnitudes: Float32Array;
    rightMagnitudes: Float32Array;
  } | undefined>(undefined);
  
  // Always load from localStorage first, then optionally enhance with Firebase data if signed in
  useEffect(() => {
    const loadPresets = async () => {
      setIsLoadingPresets(true);
      
      // Always load local settings first
      loadSettingsFromLocalStorage();
      
      // If user is signed in, try to load cloud settings as an enhancement
      if (user) {
        try {
          // Fetch presets from Firestore
          const userPresets = await getUserPresets(user.uid);
          
          // Load cloud settings if available
          const settings = await getPlaybackSettings(user.uid);
          
          // If we have cloud settings, show the dialog instead of a browser prompt
          if (settings && Object.keys(userPresets).length > 0) {
            setPendingCloudSettings(settings);
            setPendingCloudPresets(userPresets);
            setShowCloudSyncDialog(true);
          } else {
            // If we only have presets but no settings, just merge the presets
            setFirestorePresets(userPresets);
          }
        } catch (error) {
          console.error('Failed to load user presets from Firestore:', error);
          // No need to show error toast - local settings are already loaded
        }
      }
      
      setIsLoadingPresets(false);
    };
    
    loadPresets();
  }, [user]);

  // Handler functions for cloud sync dialog
  const handleApplyCloudSettings = () => {
    if (pendingCloudSettings) {
      // Apply settings from Firestore
      setIsEQEnabled(pendingCloudSettings.isEQEnabled ?? true);
      setIsSplitEarMode(pendingCloudSettings.isSplitEarMode ?? false);
      
      if (pendingCloudSettings.splitEarConfig) {
        setSplitEarConfig(pendingCloudSettings.splitEarConfig);
        
        // Load left ear preset
        const leftPreset = getPresetById(pendingCloudSettings.splitEarConfig.leftEarPreset);
        if (leftPreset) {
          setLeftEarBands([...leftPreset.bands]);
        }
        
        // Load right ear preset
        const rightPreset = getPresetById(pendingCloudSettings.splitEarConfig.rightEarPreset);
        if (rightPreset) {
          setRightEarBands([...rightPreset.bands]);
        }
      }
      
      // Set last preset
      if (pendingCloudSettings.lastPresetId) {
        const preset = getPresetById(pendingCloudSettings.lastPresetId);
        if (preset) {
          setUnifiedPresetId(preset.id);
          setUnifiedBands([...preset.bands]);
        }
      }
      
      // Set the firestore presets
      setFirestorePresets(pendingCloudPresets);
      
      toast({
        title: "Cloud settings loaded",
        description: "Your settings have been loaded from the cloud.",
      });
    }
    
    // Close the dialog
    setShowCloudSyncDialog(false);
    setPendingCloudSettings(null);
    setPendingCloudPresets({});
  };

  const handleKeepLocalSettings = () => {
    // Just merge the presets but don't apply the settings
    setFirestorePresets(pendingCloudPresets);
    
    // Close the dialog
    setShowCloudSyncDialog(false);
    setPendingCloudSettings(null);
    setPendingCloudPresets({});
  };

  // Load from localStorage (for non-authenticated users or as fallback)
  const loadSettingsFromLocalStorage = () => {
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
      console.error('Failed to load settings from localStorage:', error);
    }
  };

  // Save settings when they change
  useEffect(() => {
    const saveSettings = async () => {
      try {
        // Always save to localStorage
        localStorage.setItem(STORAGE_KEYS.LAST_PRESET, unifiedPresetId);
        
        const settings = {
          isEQEnabled,
          isSplitEarMode,
          splitEarConfig,
          lastPresetId: unifiedPresetId,
          volume
        };
        
        localStorage.setItem(STORAGE_KEYS.PLAYBACK_SETTINGS, JSON.stringify(settings));
        
        // If user is logged in, also save to Firestore (quietly in background)
        if (user) {
          await savePlaybackSettings(settings, user.uid).catch(err => {
            console.error('Error saving to cloud, but local storage succeeded:', err);
            // No need to notify user since local storage worked
          });
        }
      } catch (error) {
        console.error('Failed to save settings:', error);
        toast({
          title: "Error saving settings",
          description: "Your settings could not be saved. Please try again later.",
          variant: "destructive",
        });
      }
    };
    
    // Debounce save to avoid too many writes
    const timeoutId = setTimeout(() => {
      saveSettings();
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [isEQEnabled, isSplitEarMode, splitEarConfig, unifiedPresetId, volume, user]);

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
          ? { ...band, gain: newGain !== undefined ? newGain : band.gain, Q: newQ !== undefined ? newQ : band.Q } 
          : band
      ));
    } else if (channel === 'left') {
      setLeftEarBands(prev => prev.map(band => 
        band.id === bandId 
          ? { ...band, gain: newGain !== undefined ? newGain : band.gain, Q: newQ !== undefined ? newQ : band.Q } 
          : band
      ));
    } else if (channel === 'right') {
      setRightEarBands(prev => prev.map(band => 
        band.id === bandId 
          ? { ...band, gain: newGain !== undefined ? newGain : band.gain, Q: newQ !== undefined ? newQ : band.Q } 
          : band
      ));
    }
  };

  /**
   * Handle calibration completion
   */
  const handleCalibrationComplete = async (preset: UserPreset) => {
    try {
      // Always save locally first
      saveLocalPreset(preset);
      
      // Apply the preset
      handleUnifiedPresetSelect(preset);
      
      // If user is logged in, also save to Firestore
      if (user) {
        try {
          await saveUserPreset(preset, user.uid);
          
          // Update local Firestore presets
          setFirestorePresets(prev => ({
            ...prev,
            [preset.id]: preset
          }));
          
          toast({
            title: "Calibration Complete",
            description: `Your custom preset "${preset.name}" has been created, applied, and saved to the cloud.`,
          });
        } catch (error) {
          console.error('Failed to save preset to cloud:', error);
          toast({
            title: "Calibration Complete",
            description: `Your custom preset "${preset.name}" has been created and applied locally, but could not be saved to the cloud. Sign in to enable cloud backup.`,
          });
        }
      } else {
        toast({
          title: "Calibration Complete",
          description: `Your custom preset "${preset.name}" has been created and applied. Sign in to save it to the cloud and access on other devices.`,
        });
      }
    } catch (error) {
      console.error('Failed to save preset locally:', error);
      toast({
        title: "Error saving preset",
        description: "There was an error saving your preset. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Close the calibration dialog
      setIsCalibrationOpen(false);
    }
  };

  /**
   * Handle preset deletion
   */
  const handleDeletePreset = async (presetId: string) => {
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
    
    try {
      // Always delete locally
      deleteLocalPreset(presetId);
      
      // If user is logged in, delete from Firestore
      if (user) {
        await deleteFirestorePreset(presetId);
        
        // Update local Firestore presets
        setFirestorePresets(prev => {
          const newPresets = { ...prev };
          delete newPresets[presetId];
          return newPresets;
        });
      }
      
      // Show toast
      toast({
        title: "Preset Deleted",
        description: "Custom preset has been removed.",
      });
    } catch (error) {
      console.error('Failed to delete preset:', error);
      toast({
        title: "Error deleting preset",
        description: "There was an error deleting your preset. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Combine local and Firestore presets for display
  const combinedUserPresets = user ? firestorePresets : userPresets;

  return (
    <Card className="w-[400px] overflow-hidden bg-white rounded-xl shadow-lg">
      {/* Hidden audio element */}
      <audio ref={audioRef} />
      
      {/* Album cover and track info */}
      <CardHeader className="p-0 relative bg-gradient-to-b from-neutral-800 to-black h-56 flex flex-col justify-end">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        
        {/* User profile button in top right */}
        <div className="absolute top-4 right-4 z-10">
          <UserProfile />
        </div>
        
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
            onFrequencyChange={handleFrequencyChange}
            height={140}
            allowXDragging={true}
            allowYDragging={true}
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
              {/* Cloud status indicator */}
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium">Presets</h3>
                <CloudStatus />
              </div>
              
              {/* Cloud promotion for non-logged in users */}
              {!user && Object.keys(combinedUserPresets).length > 0 && (
                <CloudPromotion trigger="presets" />
              )}
              
              {isLoadingPresets ? (
                <div className="py-2">
                  <p className="text-sm text-center text-muted-foreground">
                    Loading presets...
                  </p>
                </div>
              ) : isSplitEarMode ? (
                <SplitEarControls 
                  builtInPresets={presets}
                  userPresets={combinedUserPresets}
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
                  userPresets={combinedUserPresets}
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
      
      {/* Cloud Sync Dialog */}
      <CloudSyncDialog 
        open={showCloudSyncDialog}
        onOpenChange={setShowCloudSyncDialog}
        onApplyCloudSettings={handleApplyCloudSettings}
        onKeepLocalSettings={handleKeepLocalSettings}
        numPresets={Object.keys(pendingCloudPresets).length}
      />
    </Card>
  );
};

export default PlayerContainer;