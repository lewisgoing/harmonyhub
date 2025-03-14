"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { useIsMobile } from '@/hooks/use-mobile';
import { Switch } from '../ui/switch';
import TinnitusGuide from '../TinnitusGuide';


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

  const [modeTransition, setModeTransition] = useState(false);

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

  

  const [maxQValue, setMaxQValue] = useState<10 | 20 | 30>(10); 
  const [activePresetTab, setActivePresetTab] = useState<string>("standard");
  // Frequency bands for EQ
  const [unifiedBands, setUnifiedBands] = useState<FrequencyBand[]>([...DEFAULT_FREQUENCY_BANDS]);
  const [leftEarBands, setLeftEarBands] = useState<FrequencyBand[]>([...DEFAULT_FREQUENCY_BANDS]);
  const [rightEarBands, setRightEarBands] = useState<FrequencyBand[]>([...DEFAULT_FREQUENCY_BANDS]);
    // Calibration state
  const [isCalibrationOpen, setIsCalibrationOpen] = useState(false);
  const [newPresetDescription, setNewPresetDescription] = useState('Custom user preset');
  
  const [maxGainRange, setMaxGainRange] = useState<12 | 24 | 36 | 48>(48);

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

  // Add this at the top of your component after the useState declarations
const isMobile = useIsMobile(); // This comes from your existing hooks/use-mobile.tsx
  
  const handleSaveRightEarEQ = () => {
    setActiveSaveSource('right');
    setNewPresetName(`Right Ear EQ ${new Date().toLocaleDateString()}`);
    setNewPresetDescription(`Custom right ear EQ settings`);
    setShowSavePresetDialog(true);
  };
  
  // Modify the original method

  const handleFrequencyResponseUpdate = (responseData: any) => {
    if (responseData) {
      console.log("Updating frequency response data from callback");
      setFrequencyResponseData(responseData);
    }
  };

  

  // Add this component to your PlayerContainer.tsx
const TinnitusHelpButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-xs flex items-center gap-1 bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
      >
        <Headphones className="h-3 w-3" />
        Tinnitus Help
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tinnitus Relief Tips</DialogTitle>
            <DialogDescription>
              Quick guidance for using EQ to help with tinnitus
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-3 bg-purple-50 rounded-md space-y-2">
              <h3 className="font-medium text-sm">What might help:</h3>
              <ul className="text-sm space-y-1.5 list-disc pl-4">
                <li>Try using a <strong>notch filter</strong> at your tinnitus frequency</li>
                <li>Use the <strong>Calibration Wizard</strong> to find your exact frequency</li>
                <li>Boost lower frequencies slightly for masking</li>
                <li>Try <strong>Split Ear Mode</strong> if your tinnitus is stronger in one ear</li>
              </ul>
            </div>
            
            <div className="p-3 bg-blue-50 rounded-md">
              <h3 className="font-medium text-sm">Recommended Presets:</h3>
              <p className="text-sm mt-1">Start with <strong>Notch Filter</strong> or <strong>Gentle Relief</strong> presets, then customize to your hearing.</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsOpen(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

  
  // Audio context state
  const { 
    playbackState, 
    audioRef, 
    audioEngine, 
    togglePlayPause, 
    handleSeek,
    setVolume,
    volume 
  } = useAudioContext({ 
    song: currentSong,
    onFrequencyResponseUpdate: handleFrequencyResponseUpdate 
  });
  

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
    if (audioEngine && !frequencyResponseData) {
      console.log("Initial frequency response calculation");
      const responseData = audioEngine.getFrequencyResponse();
      setFrequencyResponseData(responseData);
    }
  }, [audioEngine]);

  useEffect(() => {
    if (audioEngine && playbackState.isPlaying) {
      // Force update frequency response data when playback starts
      refreshVisualization();
    }
  }, [audioEngine, playbackState.isPlaying]);

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

  const ensureAudioContextReady = async () => {
    if (audioEngine) {
      await audioEngine.ensureAudioContextReady();
      
      // Force an update of the frequency response data
      const responseData = audioEngine.getFrequencyResponse();
      setFrequencyResponseData(responseData);
      
      // Request another update after a short delay to ensure UI is consistent
      setTimeout(() => {
        if (audioEngine) {
          const newResponseData = audioEngine.refreshFrequencyResponse();
          if (newResponseData) {
            setFrequencyResponseData(newResponseData);
          }
        }
      }, 200);
    }
  };
  const handlePlayPause = async () => {
    // First ensure audio context is ready
    await ensureAudioContextReady();
    
    // Then toggle playback
    togglePlayPause();
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


  // In the togglePlayPause function or useEffect that runs after audio initialization
useEffect(() => {
  if (audioEngine) {
    // Request a new frequency response after audio context is initialized or play is pressed
    const updateFrequencyResponse = () => {
      const responseData = audioEngine.getFrequencyResponse();
      setFrequencyResponseData(responseData);
    };
    
    // Add event listener to audio element for play events
    const handlePlay = () => {
      // Use requestAnimationFrame to ensure we're in the next render cycle
      requestAnimationFrame(updateFrequencyResponse);
    };
    
    // Add listener to audio element
    if (audioRef.current) {
      audioRef.current.addEventListener('play', handlePlay);
    }
    
    // Also request an immediate update
    updateFrequencyResponse();
    
    return () => {
      // Clean up listener
      if (audioRef.current) {
        audioRef.current.removeEventListener('play', handlePlay);
      }
    };
  }
}, [audioEngine, audioRef]);

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
  
  const refreshVisualization = useCallback(() => {
    if (audioEngine) {
      console.log("Manually refreshing visualization");
      const responseData = audioEngine.refreshFrequencyResponse();
      if (responseData) {
        setFrequencyResponseData(responseData);
      }
    }
  }, [audioEngine]);

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
  if (audioEngine) {
    const responseData = audioEngine.refreshFrequencyResponse();
    if (responseData) {
      setFrequencyResponseData(responseData);
    }
  }

  refreshVisualization();
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
      
      // Visual feedback - using a more noticeable toast
      toast({
        title: "✓ Calibration Complete",
        description: (
          <div className="space-y-1">
            <p className="font-medium">
              Your tinnitus relief preset has been created!
            </p>
            <p className="text-sm">
              Frequency: {preset.tinnitusCenterFreq && preset.tinnitusCenterFreq >= 1000 ? 
              `${(preset.tinnitusCenterFreq/1000).toFixed(1)}kHz` : 
              `${preset.tinnitusCenterFreq?.toFixed(0)}Hz`}
            </p>
            <p className="text-xs mt-1">
              Your preset is now active and has been saved in the "Tinnitus" tab.
            </p>
          </div>
        ),
        variant: "default",
        className: "bg-purple-100 border-purple-300",
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
    <Card className="w-full max-w-full sm:max-w-3xl md:max-w-5xl lg:max-w-6xl overflow-hidden bg-white rounded-xl shadow-lg">
      {/* Hidden audio element */}
      <audio ref={audioRef} />
      
{/* Mobile view */}
<div className="md:hidden">
  <div className="flex flex-col space-y-4 p-4">
    {/* Album info and player controls */}
    <div className="flex items-center space-x-4">
      <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
        <img 
          src={currentSong.cover} 
          alt="Album cover" 
          className="w-full h-full object-cover" 
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium truncate">{currentSong.name}</h3>
        <p className="text-xs text-gray-500 truncate">{currentSong.author}</p>
        
        {/* Mobile EQ toggle and mode switcher */}
        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center space-x-1">
            <Switch 
              checked={isEQEnabled} 
              onCheckedChange={handleEQToggle} 
              id="eq-toggle-mobile"
              className="scale-75"
            />
            <label htmlFor="eq-toggle-mobile" className="text-xs">
              EQ {isEQEnabled ? "On" : "Off"}
            </label>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSplitEarToggle}
            className="text-xs h-7 px-2"
          >
            {isSplitEarMode ? "Unified" : "Split Ear"} 
          </Button>
        </div>
      </div>
    </div>
    
    {/* Mobile player controls */}
    <PlayerControls 
      playbackState={playbackState}
      onPlayPause={handlePlayPause}
      onSeek={handleSeek}
      onVolumeChange={values => setVolume(values[0])}
      volume={volume}
      showVolumeControl={true}
      sliderClassName="player-slider-mobile"
    />
    
    {/* Mobile EQ visualization */}
    <div className="relative mb-4 mt-2">
      <EQVisualization 
        isEQEnabled={isEQEnabled}
        isSplitEarMode={isSplitEarMode}
        unifiedBands={unifiedBands}
        leftEarBands={leftEarBands}
        rightEarBands={rightEarBands}
        leftEarEnabled={leftEQEnabled}
        rightEarEnabled={rightEQEnabled}
        frequencyResponseData={frequencyResponseData}
        onBandChange={handleBandChange}
        onFrequencyChange={handleFrequencyChange}
        height={160} // Shorter for mobile
        minGain={-24}
        maxGain={24}
        allowXDragging={true}
        allowYDragging={true}
      />
    </div>
    
    {/* Mobile calibration button */}
    <div className="grid grid-cols-2 gap-2">
      <Button 
        variant="default" 
        className="bg-blue-600 hover:bg-blue-700 text-white"
        onClick={() => setIsCalibrationOpen(true)}
      >
        <Headphones className="h-4 w-4 mr-2" />
        Calibration
      </Button>
      <TinnitusHelpButton />
    </div>
    
    {/* Simplified tab system for mobile */}
    <Tabs defaultValue="presets" className="mt-2">
      <TabsList className="grid grid-cols-2 w-full">
        <TabsTrigger value="presets">Presets</TabsTrigger>
        <TabsTrigger value="eqcontrols">Controls</TabsTrigger>
      </TabsList>
      
      <TabsContent value="presets" className="pt-4">
        {isSplitEarMode ? (
          <SplitEarControls 
            builtInPresets={presets}
            userPresets={userPresets}
            splitEarConfig={splitEarConfig}
            onLeftEarPresetSelect={handleLeftEarPresetSelect}
            onRightEarPresetSelect={handleRightEarPresetSelect}
            onDeletePreset={handleDeletePreset}
            onSaveLeftEarPreset={handleSaveLeftEarEQ}
            onSaveRightEarPreset={handleSaveRightEarEQ}
            isEQEnabled={isEQEnabled}
            leftEarEnabled={leftEQEnabled}
            rightEarEnabled={rightEQEnabled}
          />
        ) : (
          <Presets 
            presets={presets}
            userPresets={userPresets}
            activePresetId={unifiedPresetId}
            onPresetSelect={handleUnifiedPresetSelect}
            onDeletePreset={handleDeletePreset}
            onSavePreset={handleSaveCurrentEQ}
            showUserPresets={true}
          />
        )}
      </TabsContent>
      
      <TabsContent value="eqcontrols" className="pt-4">
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
          maxQValue={maxQValue}
          onMaxQValueChange={setMaxQValue}
          maxGainRange={maxGainRange}
          onMaxGainRangeChange={setMaxGainRange}
          onSavePreset={handleSaveCurrentEQ}
          showCalibration={false}
        />
      </TabsContent>
    </Tabs>
  </div>
</div>
  
      {/* Desktop view - side-by-side layout */}
      <div className="hidden md:flex min-650px]">
        {/* Left column - Player and controls */}
        <div className="w-2/5 lg:w-1/3 bg-slate-800 text-white flex flex-col">
          {/* User profile in top right */}
          <div className="p-4 flex justify-end">
            <UserProfile />
          </div>
          
          {/* Album cover and info */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
            {/* Album artwork */}
            <div className="w-full max-w-xs aspect-square rounded-lg overflow-hidden shadow-lg">
              <img 
                src={currentSong.cover} 
                alt="Album cover" 
                className="w-full h-full object-cover" 
              />
            </div>
            
            {/* Track info */}
            <div className="text-center w-full">
              <h2 className="text-2xl font-bold">{currentSong.name}</h2>
              <p className="text-lg text-white/80">{currentSong.author}</p>
            </div>
            
            {/* Player controls */}
{/* Player controls with improved sliders */}
<div className="w-full max-w-sm">
  <PlayerControls 
    playbackState={playbackState}
    onPlayPause={handlePlayPause}
    onSeek={handleSeek}
    onVolumeChange={values => setVolume(values[0])}
    volume={volume}
    showVolumeControl={true}
    sliderClassName="player-slider"
  />
</div>


<div className="md:hidden">
  <PlayerControls 
    playbackState={playbackState}
    onPlayPause={handlePlayPause}
    onSeek={handleSeek}
    onVolumeChange={values => setVolume(values[0])}
    volume={volume}
    showVolumeControl={true}
  />
</div>
            
            {/* Calibration button - ONLY ONE INSTANCE */}
            <Button 
        variant="default" 
        className="mt-6 bg-blue-600 hover:bg-blue-700 text-white w-full"
        onClick={() => setIsCalibrationOpen(true)}
      >
        <Headphones className="h-4 w-4 mr-2" />
        Calibrate for Tinnitus
      </Button>

      <TinnitusGuide />
          </div>
          
          {/* App info */}
          <div className="p-4 text-xs text-white/60 text-center">
            <p>Customize your listening experience with Hearing Heroes</p>
          </div>
        </div>
        
        {/* Right column - EQ visualization and controls */}
        <div className="w-3/5 lg:w-2/3">
        <div className="p-6 space-y-6">
            {/* EQ visualization - larger for desktop */}
            <div className='relative'>
                            <EQVisualization 
                isEQEnabled={isEQEnabled}
                isSplitEarMode={isSplitEarMode}
                unifiedBands={unifiedBands}
                leftEarBands={leftEarBands}
                rightEarBands={rightEarBands}
                leftEarEnabled={leftEQEnabled}
                rightEarEnabled={rightEQEnabled}
                frequencyResponseData={frequencyResponseData}
                onBandChange={handleBandChange}
                onFrequencyChange={handleFrequencyChange}
                height={200} // Taller for desktop
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
                      className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/20 text-white hover:bg-black/30"
                      onClick={handleSaveCurrentEQ}
                    >
                      <Save size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Save current EQ as preset</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="text-xs text-gray-500 bg-white/80 px-2 py-1 rounded-sm mb-4">
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
              showCalibration={false} // No calibration button here for desktop
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
                    <Tabs defaultValue="standard" className="w-full">
                      <TabsList className="grid grid-cols-3 mb-3">
                        <TabsTrigger value="standard" className="text-xs">Standard</TabsTrigger>
                        <TabsTrigger value="tinnitus" className="text-xs flex items-center gap-1">
                          <Headphones className="h-3 w-3" />
                          Tinnitus
                        </TabsTrigger>
                        <TabsTrigger value="custom" className="text-xs">Custom</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="standard">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2">
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
                                      <div className="flex flex-col items-start overflow-hidden">
                                      <span className="font-medium line-clamp-1">{preset.name}</span>
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
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {Object.values(userPresets)
                            .filter(preset => preset.isCalibrated)
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
                          
                          {Object.values(userPresets).filter(preset => preset.isCalibrated).length === 0 && (
                            <div className="col-span-full p-4 text-center text-muted-foreground bg-purple-50 rounded-md">
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
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2">
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
                                          <span className="font-medium line-clamp-1 w-full">{preset.name}</span>
                                          <span className="text-xs opacity-70 line-clamp-1 w-full">
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
                            <div className="col-span-full p-4 text-center text-muted-foreground bg-gray-50 rounded-md">
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
        </div>
      </div>
      
      {/* Calibration Dialog */}
      <Dialog open={isCalibrationOpen} onOpenChange={setIsCalibrationOpen}>
        <DialogContent className="max-w-xl p-0">
          <CalibrationWizard 
            onComplete={handleCalibrationComplete}
            onCancel={() => setIsCalibrationOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
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