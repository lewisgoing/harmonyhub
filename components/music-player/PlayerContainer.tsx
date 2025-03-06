"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Music, 
  ExternalLink, 
  Save, 
  PlusCircle, 
  Settings,
  X,
  Headphones,
  Trash2
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Custom hooks
import useAudioContext from './hooks/useAudioContext';
import { useEQPresets } from './hooks/useEQPresets';
import { useAuthContext } from '@/components/auth/AuthProvider';

// Firebase services
import { 
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
import ExternalAudioInput from '@/components/ExternalAudioInput';

// Types and constants
import { SplitEarConfig, FrequencyBand, Preset, UserPreset, Song } from './types';
import { DEMO_SONG, DEFAULT_FREQUENCY_BANDS, STORAGE_KEYS } from './constants';

// Utils for player controls
import { createAudioElementControls } from '@/utils/playerControls';
import { useToast } from '../ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

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
  const [showSavePresetDialog, setShowSavePresetDialog] = useState(false);
  const [newPresetName, setNewPresetName] = useState('My Custom Preset');
  
  // Left/Right ear individual EQ enabled state
  const [leftEQEnabled, setLeftEQEnabled] = useState(true);
  const [rightEQEnabled, setRightEQEnabled] = useState(true);

  // Get presets from hook
  const { 
    presets, 
    userPresets, 
    saveUserPreset, 
    deleteUserPreset,
    getPresetById,
    createCustomPreset,
    isLoading: isLoadingPresets
  } = useEQPresets();

  // Preset state
  const [unifiedPresetId, setUnifiedPresetId] = useState('flat');
  const [splitEarConfig, setSplitEarConfig] = useState<SplitEarConfig>({
    leftEarPreset: 'flat',
    rightEarPreset: 'flat',
    balance: 0.5
  });

  
  const [maxQValue, setMaxQValue] = useState<10 | 20 | 30>(20); 
  const [activePresetTab, setActivePresetTab] = useState<string>("standard");
  // Frequency bands for EQ
  const [unifiedBands, setUnifiedBands] = useState<FrequencyBand[]>([...DEFAULT_FREQUENCY_BANDS]);
  const [leftEarBands, setLeftEarBands] = useState<FrequencyBand[]>([...DEFAULT_FREQUENCY_BANDS]);
  const [rightEarBands, setRightEarBands] = useState<FrequencyBand[]>([...DEFAULT_FREQUENCY_BANDS]);
    // Calibration state
  const [isCalibrationOpen, setIsCalibrationOpen] = useState(false);
  const [newPresetDescription, setNewPresetDescription] = useState('Custom user preset');
  
  // External audio state
  const [isUrlInputOpen, setIsUrlInputOpen] = useState(false);
  const [currentSong, setCurrentSong] = useState<Song>(DEMO_SONG);

  const [activeSaveSource, setActiveSaveSource] = useState<'left' | 'right' | 'unified' | null>(null);

  const handleSaveLeftEarEQ = () => {
    setActiveSaveSource('left');
    setNewPresetName(`Left Ear EQ ${new Date().toLocaleDateString()}`);
    setNewPresetDescription(`Custom left ear EQ settings`);
    setShowSavePresetDialog(true);
  };
  
  const handleSaveRightEarEQ = () => {
    setActiveSaveSource('right');
    setNewPresetName(`Right Ear EQ ${new Date().toLocaleDateString()}`);
    setNewPresetDescription(`Custom right ear EQ settings`);
    setShowSavePresetDialog(true);
  };
  
  // Modify the original method

  
  // Audio context state
  const { 
    playbackState, 
    audioRef, 
    audioEngine, 
    togglePlayPause, 
    handleSeek,
    setVolume,
    volume 
  } = useAudioContext({ song: currentSong });

  // Player controls
  const playerControlsRef = useRef(null);

  // Initialize default player controls
  useEffect(() => {
    if (audioRef.current && !playerControlsRef.current) {
      playerControlsRef.current = createAudioElementControls(audioRef.current);
    }
  }, [audioRef.current]);

  // Ensure audio is loaded on component mount
  useEffect(() => {
    // Force preloading the audio
    if (audioRef.current) {
      audioRef.current.preload = 'auto';
      audioRef.current.load();
    }
  }, [audioRef]);

  // Frequency response data for visualization
  const [frequencyResponseData, setFrequencyResponseData] = useState<{
    frequencies: Float32Array;
    leftMagnitudes: Float32Array;
    rightMagnitudes: Float32Array;
  } | undefined>(undefined);

  useEffect(() => {
    const loadSettings = async () => {
      // Only load state of EQ enable/disable and split mode from localStorage
      try {
        const playbackSettingsJSON = localStorage.getItem(STORAGE_KEYS.PLAYBACK_SETTINGS);
        if (playbackSettingsJSON) {
          const settings = JSON.parse(playbackSettingsJSON);
          setIsEQEnabled(settings.isEQEnabled ?? true);
          setIsSplitEarMode(settings.isSplitEarMode ?? false);
          
          // Load individual ear EQ states
          if (settings.leftEQEnabled !== undefined) {
            setLeftEQEnabled(settings.leftEQEnabled);
          }
          
          if (settings.rightEQEnabled !== undefined) {
            setRightEQEnabled(settings.rightEQEnabled);
          }
          
          // Load volume
          if (settings.volume !== undefined) {
            setVolume(settings.volume);
          }
        }
      } catch (error) {
        console.error('Failed to load settings from localStorage:', error);
      }
      
      // If user is signed in, only load minimal cloud settings
      if (user) {
        try {
          const settings = await getPlaybackSettings(user.uid);
          if (settings) {
            setIsEQEnabled(settings.isEQEnabled ?? true);
            setIsSplitEarMode(settings.isSplitEarMode ?? false);
            
            // Set volume if available
            if (settings.volume !== undefined) {
              setVolume(settings.volume);
            }
          }
        } catch (error) {
          console.error('Failed to load user settings from Firestore:', error);
        }
      }
    };
    
    loadSettings();
  }, [user]);
  
  // Always load from localStorage first, then optionally enhance with Firebase data if signed in
  // useEffect(() => {
  //   const loadSettings = async () => {
  //     // Always load local settings first
  //     loadSettingsFromLocalStorage();
      
  //     // If user is signed in, try to load cloud settings
  //     if (user) {
  //       try {
  //         // Load cloud settings if available
  //         const settings = await getPlaybackSettings(user.uid);
          
  //         if (settings) {
  //           // Apply settings from Firestore
  //           setIsEQEnabled(settings.isEQEnabled ?? true);
  //           setIsSplitEarMode(settings.isSplitEarMode ?? false);
            
  //           if (settings.splitEarConfig) {
  //             setSplitEarConfig(settings.splitEarConfig);
              
  //             // Load left ear preset
  //             const leftPreset = getPresetById(settings.splitEarConfig.leftEarPreset);
  //             if (leftPreset) {
  //               setLeftEarBands([...leftPreset.bands]);
  //             }
              
  //             // Load right ear preset
  //             const rightPreset = getPresetById(settings.splitEarConfig.rightEarPreset);
  //             if (rightPreset) {
  //               setRightEarBands([...rightPreset.bands]);
  //             }
  //           }
            
  //           // Set last preset
  //           if (settings.lastPresetId) {
  //             const preset = getPresetById(settings.lastPresetId);
  //             if (preset) {
  //               setUnifiedPresetId(preset.id);
  //               setUnifiedBands([...preset.bands]);
  //             }
  //           }
            
  //           // Set volume if available
  //           if (settings.volume !== undefined) {
  //             setVolume(settings.volume);
  //           }
            
  //           toast({
  //             title: "Settings loaded",
  //             description: "Your settings have been loaded from the cloud.",
  //           });
  //         }
  //       } catch (error) {
  //         console.error('Failed to load user settings from Firestore:', error);
  //         // No need to show error toast - local settings are already loaded
  //       }
  //     }
  //   };
    
  //   loadSettings();
  // }, [user]);

  useEffect(() => {
    if (audioEngine) {
      const flatPreset = presets.flat;
      audioEngine.applyUnifiedPreset(flatPreset);
      audioEngine.applyLeftEarPreset(flatPreset);
      audioEngine.applyRightEarPreset(flatPreset);
    }
  }, [audioEngine]);

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
        
        // Load individual ear EQ states
        if (settings.leftEQEnabled !== undefined) {
          setLeftEQEnabled(settings.leftEQEnabled);
        }
        
        if (settings.rightEQEnabled !== undefined) {
          setRightEQEnabled(settings.rightEQEnabled);
        }
        
        // Load volume
        if (settings.volume !== undefined) {
          setVolume(settings.volume);
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
          volume,
          leftEQEnabled,
          rightEQEnabled
        };
        
        localStorage.setItem(STORAGE_KEYS.PLAYBACK_SETTINGS, JSON.stringify(settings));
        
        // If user is logged in, also save to Firestore (quietly in background)
        if (user) {
          await savePlaybackSettings(settings, user.uid).catch(err => {
            console.error('Error saving to cloud, but local storage succeeded:', err);
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
  }, [
    isEQEnabled, 
    isSplitEarMode, 
    splitEarConfig, 
    unifiedPresetId, 
    volume, 
    leftEQEnabled, 
    rightEQEnabled, 
    user
  ]);

  // Update audio engine when EQ settings change
  useEffect(() => {
    if (audioEngine) {
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
      
      // Update individual ear EQ states if in split mode
      if (isSplitEarMode) {
        audioEngine.setLeftEarEnabled(leftEQEnabled);
        audioEngine.setRightEarEnabled(rightEQEnabled);
      }
      
      // Force calculation of frequency response data for visualization
      const responseData = audioEngine.getFrequencyResponse();
      setFrequencyResponseData(responseData);
    }
  }, [
    audioEngine, 
    isEQEnabled, 
    isSplitEarMode, 
    unifiedBands, 
    leftEarBands, 
    rightEarBands, 
    splitEarConfig.balance,
    leftEQEnabled,
    rightEQEnabled
  ]);

  useEffect(() => {
    if (audioEngine && !frequencyResponseData) {
      // Initial calculation of frequency response
      const responseData = audioEngine.getFrequencyResponse();
      setFrequencyResponseData(responseData);
    }
  }, [audioEngine]);

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
      
      // Reset individual ear EQ states
      setLeftEQEnabled(true);
      setRightEQEnabled(true);
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
      // Apply the preset with a slight delay to batch multiple changes together
      requestAnimationFrame(() => {
        audioEngine.applyUnifiedPreset(preset);
        
        // Update frequency response data with a slight delay
        setTimeout(() => {
          const responseData = audioEngine.getFrequencyResponse();
          setFrequencyResponseData(responseData);
        }, 100); // Small delay to allow audio ramps to complete
      });
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
/**
 * Update a single frequency band
 */
/**
 * Update a single frequency band
 */
const handleBandChange = (
  bandId: string,
  newGain?: number,
  newQ?: number,
  channel: 'unified' | 'left' | 'right' = 'unified'
) => {
  // Prevent changes to disabled ears
  if ((channel === 'left' && !leftEQEnabled) || 
      (channel === 'right' && !rightEQEnabled) ||
      !isEQEnabled) {
    return;
  }
  
  // Handle different channels...
  if (channel === 'unified') {
    setUnifiedBands(prev => prev.map(band => 
      band.id === bandId 
        ? { ...band, 
            gain: newGain !== undefined ? newGain : band.gain, 
            Q: newQ !== undefined ? newQ : band.Q 
          } 
        : band
    ));
  } else if (channel === 'left') {
    setLeftEarBands(prev => prev.map(band => 
      band.id === bandId 
        ? { ...band, 
            gain: newGain !== undefined ? newGain : band.gain, 
            Q: newQ !== undefined ? newQ : band.Q 
          } 
        : band
    ));
  } else if (channel === 'right') {
    setRightEarBands(prev => prev.map(band => 
      band.id === bandId 
        ? { ...band, 
            gain: newGain !== undefined ? newGain : band.gain, 
            Q: newQ !== undefined ? newQ : band.Q 
          } 
        : band
    ));
  }
};
  /**
   * Handle frequency change for a band
   */
  const handleFrequencyChange = (
    bandId: string,
    newFrequency: number,
    channel: 'unified' | 'left' | 'right'
  ) => {
    // Prevent changes to disabled ears
    if ((channel === 'left' && !leftEQEnabled) || 
        (channel === 'right' && !rightEQEnabled) ||
        !isEQEnabled) {
      return;
    }
    // Handle different channels
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

  /**
   * Handle saving the current EQ settings as a new custom preset
   */
  const handleSaveCurrentEQ = () => {
    setActiveSaveSource('unified');
    setNewPresetName(`Custom EQ ${new Date().toLocaleDateString()}`);
    setNewPresetDescription(`Custom unified EQ settings`);
    setShowSavePresetDialog(true);
  };
  
  /**
   * Create a new preset from current EQ settings
   */
  const saveCurrentPresetAsNew = async () => {
    try {
      // Determine which ear's bands to save based on the active save source
      const bandsToSave = activeSaveSource === 'right' && isSplitEarMode ? 
        [...rightEarBands] : 
        activeSaveSource === 'left' && isSplitEarMode ?
        [...leftEarBands] :
        [...unifiedBands];
      
      // Create the new preset
      const newPreset = createCustomPreset(
        newPresetName, 
        bandsToSave,
        undefined, // tinnitusFreq (leave undefined unless from calibration)
        newPresetDescription // Use the description from the input
      );
      
      // Close the dialog
      setShowSavePresetDialog(false);
      
      // Reset the active save source
      setActiveSaveSource(null);
      
      // Apply the new preset to the appropriate channel
      if (activeSaveSource === 'right' && isSplitEarMode) {
        handleRightEarPresetSelect(newPreset);
      } else if (activeSaveSource === 'left' && isSplitEarMode) {
        handleLeftEarPresetSelect(newPreset);
      } else {
        handleUnifiedPresetSelect(newPreset);
      }
      
      toast({
        title: "Preset Saved",
        description: `Your custom preset "${newPresetName}" has been created and applied.`,
      });
    } catch (error) {
      console.error('Failed to save custom preset:', error);
      toast({
        title: "Error Saving Preset",
        description: "Failed to create your custom preset. Please try again.",
        variant: "destructive",
      });
    }
  };
  /**
   * Handle calibration completion
   */

  const handleCalibrationComplete = async (preset: UserPreset) => {
    try {
      // Always save locally first
      await saveUserPreset(preset);
      
      // Apply the preset to unified mode (regardless of current mode)
      // This ensures calibration always applies to a new unified preset
      if (isSplitEarMode) {
        // Temporarily switch to unified mode to apply the calibrated preset
        setIsSplitEarMode(false);
      }
      
      // Apply the preset to unified mode
      handleUnifiedPresetSelect(preset);
      
      // Set active tab to "eq" so we see the EQ controls
      setActiveTab('eq');
      
      toast({
        title: "Calibration Complete",
        description: `Your personalized tinnitus relief preset has been created and applied. It's designed specifically for your ${preset.tinnitusCenterFreq && preset.tinnitusCenterFreq >= 1000 ? 
          `${(preset.tinnitusCenterFreq/1000).toFixed(1)}kHz` : 
          `${preset.tinnitusCenterFreq?.toFixed(0)}Hz`} tinnitus frequency.`,
      });
      
      // Add a slight delay before focusing the relevant preset tab
      // This gives time for the UI to update
      setTimeout(() => {
        // Find and click the tinnitus tab if it exists
        const tinnitusTab = document.querySelector('[value="tinnitus"]') as HTMLElement;
        if (tinnitusTab) {
          tinnitusTab.click();
        }
      }, 100);
      
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
      // Delete preset
      await deleteUserPreset(presetId);
      
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
  
  /**
   * Handle toggling left ear EQ
   */
  const handleLeftEQToggle = () => {
    setLeftEQEnabled(!leftEQEnabled);
    
    if (audioEngine) {
      audioEngine.setLeftEarEnabled(!leftEQEnabled);
    }
  };
  
  /**
   * Handle toggling right ear EQ
   */
  const handleRightEQToggle = () => {
    setRightEQEnabled(!rightEQEnabled);
    
    if (audioEngine) {
      audioEngine.setRightEarEnabled(!rightEQEnabled);
    }
  };

  /**
   * Handle external audio selection
   */
  const handleExternalAudioSelected = async (audioData: {
    name: string;
    author: string;
    cover: string;
    audio: string;
    sourceType: 'youtube' | 'soundcloud' | 'direct';
    sourceUrl: string;
  }) => {
    try {
      // For direct audio URLs, we'll set the current song
      if (audioData.sourceType === 'direct') {
        // Set the current song for the standard audio element
        setCurrentSong({
          name: audioData.name,
          author: audioData.author,
          cover: audioData.cover || "/placeholder.svg",
          audio: audioData.audio
        });
        
        toast({
          title: "Audio loaded",
          description: `Now playing: ${audioData.name}`,
        });
      } else {
        // For YouTube/SoundCloud, we'll show an error message
        toast({
          title: "Sorry!",
          description: "External streaming sources are currently disabled due to technical issues. Please use direct audio URLs or the default song.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading external audio:', error);
      
      toast({
        title: "Error loading audio",
        description: error instanceof Error ? error.message : "Failed to load audio source",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-[400px] overflow-hidden bg-white rounded-xl shadow-lg">
      {/* Hidden audio element */}
      <audio ref={audioRef} />
      
      {/* Album cover and track info */}
      <CardHeader className="p-0 relative bg-gradient-to-b from-slate-800 to-slate-900 h-56 flex flex-col justify-end">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        
        {/* User profile button in top right */}
        <div className="absolute top-4 right-4 z-10">
          <UserProfile />
        </div>
        
        {/* External audio button in top left */}

        {/* External audio button in top left */}
<div className="absolute top-4 left-4 z-10">
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="rounded-full bg-black/30 text-white hover:bg-white/80"
          onClick={() => toast({
            title: "Coming Soon!",
            description: "Custom audio source support is coming in our next update.",
          })}
        >
          <Music size={16} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Custom audio sources (Coming Soon)</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</div>
        {/* <div className="absolute top-4 left-4 z-10">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="rounded-full bg-black/30 text-white hover:bg-black/50"
                  onClick={() => setIsUrlInputOpen(true)}
                >
                  <Music size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Open audio source</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
         */}
        {/* Album cover */}
        <div className="absolute top-4 left-4 w-36 h-36 rounded-lg overflow-hidden shadow-lg mt-10">
          <img 
            src={currentSong.cover} 
            alt="Album cover" 
            className="w-full h-full object-cover" 
          />
        </div>
        
        {/* Track info */}
        <div className="relative p-4 text-white">
          <h2 className="text-lg font-bold">{currentSong.name}</h2>
          <p className="text-sm text-white/80">{currentSong.author}</p>
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
          
          {/* Add save preset button next to visualization */}
          <div className="relative">
            {/* EQ visualization */}
            <EQVisualization 
  isEQEnabled={isEQEnabled}
  isSplitEarMode={isSplitEarMode}
  unifiedBands={unifiedBands}
  leftEarBands={leftEarBands}
  rightEarBands={rightEarBands}
  leftEarEnabled={leftEQEnabled} // Pass the state here
  rightEarEnabled={rightEQEnabled} // Pass the state here
  frequencyResponseData={frequencyResponseData}
  onBandChange={handleBandChange}
  onFrequencyChange={handleFrequencyChange}
  height={140}
  minGain={-24}
  maxGain={24}
  allowXDragging={true}
  allowYDragging={true}
/>
            
            {/* Save preset button */}
            <TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button 
        size="icon" 
        variant="ghost" 
        className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/20 text-white hover:bg-black/30"
        onClick={handleSaveCurrentEQ}
      >
        <Save size={14} />
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Save current EQ as preset</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
          </div>
          <div className="relative right-1 text-xs text-gray-500 bg-white/80 px-2 z-10">
        Double-click point to adjust Q
      </div>
          {/* EQ controls */}
          <EQControls 
            isEQEnabled={isEQEnabled}
            isSplitEarMode={isSplitEarMode}
            splitEarConfig={splitEarConfig}
            leftEarEnabled={leftEQEnabled}
            rightEarEnabled={rightEQEnabled}
            onEQToggle={handleEQToggle}
            onSplitEarToggle={handleSplitEarToggle}
            onLeftEarToggle={handleLeftEQToggle}
            onRightEarToggle={handleRightEQToggle}
            onBalanceChange={handleBalanceChange}
            onResetEQ={handleResetEQ}
            activeTab={activeTab}
            maxQValue={maxQValue}
            onMaxQValueChange={setMaxQValue}
            onTabChange={setActiveTab}
            showCalibration={true}
            onStartCalibration={() => setIsCalibrationOpen(true)}
            onSavePreset={handleSaveCurrentEQ}
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
    {!user && Object.keys(userPresets).length > 0 && (
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
        userPresets={userPresets}
        splitEarConfig={splitEarConfig}
        onLeftEarPresetSelect={handleLeftEarPresetSelect}
        onRightEarPresetSelect={handleRightEarPresetSelect}
        onDeletePreset={handleDeletePreset}
        onSaveLeftEarPreset={handleSaveLeftEarEQ}
        onSaveRightEarPreset={handleSaveRightEarEQ}
        showUserPresets={true}
        showDeleteButton={true}
        isEQEnabled={isEQEnabled}
        leftEarEnabled={leftEQEnabled}
        rightEarEnabled={rightEQEnabled}
      />
    ) : (
      <div>
<Tabs defaultValue="standard">
  <TabsList className="grid grid-cols-3 mb-3">
    <TabsTrigger value="standard" className="text-xs">Standard</TabsTrigger>
    <TabsTrigger value="tinnitus" className="text-xs flex items-center gap-1">
      <Headphones className="h-3 w-3" />
      Tinnitus
    </TabsTrigger>
    <TabsTrigger value="custom" className="text-xs">Custom</TabsTrigger>
  </TabsList>
          
          <TabsContent value="standard">
            <div className="grid grid-cols-2 gap-2">
              {Object.values(presets).map((preset) => {
                const isActive = unifiedPresetId === preset.id;
                const style = preset.color;
                
                return (
                  <TooltipProvider key={preset.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          className="text-sm font-medium rounded-md shadow-sm transition-colors w-full h-auto py-2 justify-start"
                          style={{
                            backgroundColor: isActive ? style.active.bg : style.inactive.bg,
                            color: isActive ? style.active.text : style.inactive.text,
                            border: "none",
                          }}
                          onClick={() => handleUnifiedPresetSelect(preset)}
                        >
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{preset.name}</span>
                            <span className="text-xs opacity-70">
                              {preset.description.slice(0, 18)}{preset.description.length > 18 ? '...' : ''}
                            </span>
                          </div>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{preset.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </TabsContent>
          
          <TabsContent value="tinnitus">
            <div className="grid grid-cols-2 gap-2">
              {Object.values(userPresets)
                .filter(preset => preset.isCalibrated)
                .map((preset) => {
                  const isActive = unifiedPresetId === preset.id;
                  const style = preset.color;
                  
                  return (
                    <TooltipProvider key={preset.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            className="text-sm font-medium rounded-md shadow-sm transition-colors w-full h-auto py-2 justify-start"
                            style={{
                              backgroundColor: isActive ? style.active.bg : style.inactive.bg,
                              color: isActive ? style.active.text : style.inactive.text,
                              border: "none",
                            }}
                            onClick={() => handleUnifiedPresetSelect(preset)}
                          >
                            <div className="flex flex-col items-start">
                              <span className="font-medium">{preset.name}</span>
                              {preset.tinnitusCenterFreq && (
                                <span className="text-xs opacity-70">
                                  {preset.tinnitusCenterFreq >= 1000 ? 
                                    `${(preset.tinnitusCenterFreq/1000).toFixed(1)}kHz` : 
                                    `${preset.tinnitusCenterFreq.toFixed(0)}Hz`}
                                </span>
                              )}
                            </div>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <div className="space-y-1 max-w-xs">
                            <p className="font-medium">{preset.name}</p>
                            <p className="text-xs">{preset.description}</p>
                            {preset.tinnitusCenterFreq && (
                              <p className="text-xs">
                                Calibrated for tinnitus at {preset.tinnitusCenterFreq.toFixed(0)}Hz
                              </p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                      
                      {/* Delete button */}
                      <div className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-full bg-white shadow border border-gray-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePreset(preset.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </TooltipProvider>
                  );
                })}
              
              {Object.values(userPresets).filter(preset => preset.isCalibrated).length === 0 && (
                <div className="col-span-2 p-4 text-center text-muted-foreground bg-purple-50 rounded-md">
                  <Headphones className="h-5 w-5 mx-auto mb-2 text-purple-500" />
                  <p className="text-sm text-purple-700">No tinnitus presets yet</p>
                  <p className="text-xs mt-1 text-purple-600">
                    Use the calibration wizard to create a personalized tinnitus preset
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3 text-purple-700 border-purple-300 hover:bg-purple-100"
                    onClick={() => setIsCalibrationOpen(true)}
                  >
                    <Headphones className="h-3 w-3 mr-1" />
                    Start Calibration
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="custom">
            <div className="grid grid-cols-2 gap-2">
              {Object.values(userPresets)
                .filter(preset => !preset.isCalibrated)
                .map((preset) => {
                  const isActive = unifiedPresetId === preset.id;
                  const style = preset.color;
                  
                  return (
                    <div key={preset.id} className="relative group">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              className="text-sm font-medium rounded-md shadow-sm transition-colors w-full h-auto py-2 justify-start"
                              style={{
                                backgroundColor: isActive ? style.active.bg : style.inactive.bg,
                                color: isActive ? style.active.text : style.inactive.text,
                                border: "none",
                              }}
                              onClick={() => handleUnifiedPresetSelect(preset)}
                            >
                              <div className="flex flex-col items-start">
                                <span className="font-medium">{preset.name}</span>
                                <span className="text-xs opacity-70">
                                  {new Date(preset.dateCreated).toLocaleDateString()}
                                </span>
                              </div>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <div className="space-y-1 max-w-xs">
                              <p className="font-medium">{preset.name}</p>
                              <p className="text-xs">{preset.description}</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      {/* Delete button */}
                      <div className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-full bg-white shadow border border-gray-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePreset(preset.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              
              {Object.values(userPresets).filter(preset => !preset.isCalibrated).length === 0 && (
                <div className="col-span-2 p-4 text-center text-muted-foreground bg-gray-50 rounded-md">
                  <Save className="h-5 w-5 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No custom presets yet</p>
                  <p className="text-xs mt-1">
                    Adjust the EQ and save your settings as a custom preset
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="mt-3"
                    onClick={handleSaveCurrentEQ}
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Save Current EQ
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
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
      
      {/* External Audio Input Dialog */}
      {/* <ExternalAudioInput
        open={isUrlInputOpen}
        onOpenChange={setIsUrlInputOpen}
        onAudioSelected={handleExternalAudioSelected}
      /> */}
      
      {/* Save Preset Dialog */}
      <Dialog open={showSavePresetDialog} onOpenChange={setShowSavePresetDialog}>
  <DialogContent className="sm:max-w-md">
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-4 pb-2">
        <div className="p-3 rounded-full bg-blue-50 text-blue-600">
          <Save size={24} />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-lg font-semibold">Save Current EQ</h3>
          <p className="text-sm text-muted-foreground">
            Save your current EQ settings as a custom preset
          </p>
        </div>
      </div>
      
      <div className="space-y-3">
        <Label htmlFor="preset-name">Preset Name</Label>
        <Input
          id="preset-name"
          value={newPresetName}
          onChange={(e) => setNewPresetName(e.target.value)}
          className="w-full"
          autoFocus
        />
        
        <Label htmlFor="preset-description">Description</Label>
        <Input
          id="preset-description"
          value={newPresetDescription}
          onChange={(e) => setNewPresetDescription(e.target.value)}
          className="w-full"
          placeholder="Enter a description for this preset"
        />
        
        {!user && (
          <Alert className="bg-amber-50 text-amber-800 border-amber-200">
            <AlertDescription className="text-xs">
              Sign in to sync your presets across devices
            </AlertDescription>
          </Alert>
        )}
      </div>
      
      <div className="flex gap-2 justify-end">
        <Button 
          variant="outline" 
          onClick={() => setShowSavePresetDialog(false)}
        >
          Cancel
        </Button>
        <Button
          onClick={saveCurrentPresetAsNew}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Save Preset
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
    </Card>
  );
};

export default PlayerContainer;