"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Music, ExternalLink } from 'lucide-react';
// Removed the problematic import for useToast

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
import ExternalAudioInput from '@/components/ExternalAudioInput';
import YouTubeAudioPlayer from '@/components/YoutubeAudioPlayer';
import SoundCloudAudioPlayer from '@/components/SoundCloudAudioPlayer';

// Types and constants
import { SplitEarConfig, FrequencyBand, Preset, UserPreset, Song } from './types';
import { DEMO_SONG, DEFAULT_FREQUENCY_BANDS, STORAGE_KEYS } from './constants';

// Utils for player controls
import { 
  UnifiedPlayerControls, 
  createYouTubeControls, 
  createSoundCloudControls, 
  createAudioElementControls 
} from '@/utils/playerControls';
import { useToast } from '../ui/use-toast';

// Helper to extract YouTube video ID
const getYoutubeVideoId = (url: string): string | null => {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
};

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
  
  // External audio state
  const [isUrlInputOpen, setIsUrlInputOpen] = useState(false);
  const [currentSong, setCurrentSong] = useState<Song>(DEMO_SONG);
  
  // External player states and refs
  const [currentExternalSource, setCurrentExternalSource] = useState<{
    type: 'youtube' | 'soundcloud' | 'direct' | null;
    id?: string;
    url?: string;
    isPlaying: boolean;
  }>({
    type: null,
    isPlaying: false
  });
  
  const youtubePlayerRef = useRef<any>(null);
  const soundcloudPlayerRef = useRef<any>(null);
  
  // Unified player controls
  const [playerControls, setPlayerControls] = useState<UnifiedPlayerControls | null>(null);
  
  // Loading state for external audio
  const [isExternalAudioLoading, setIsExternalAudioLoading] = useState(false);

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

  // Initialize default player controls
  useEffect(() => {
    if (audioRef.current) {
      setPlayerControls(createAudioElementControls(audioRef.current));
    }
  }, [audioRef]);

  // Update player controls when sources change
  useEffect(() => {
    if (currentExternalSource.type === 'youtube' && youtubePlayerRef.current) {
      setPlayerControls(createYouTubeControls(youtubePlayerRef.current));
    } 
    else if (currentExternalSource.type === 'soundcloud' && soundcloudPlayerRef.current) {
      setPlayerControls(createSoundCloudControls(soundcloudPlayerRef.current));
    }
    else if (audioRef.current) {
      setPlayerControls(createAudioElementControls(audioRef.current));
    }
  }, [currentExternalSource.type, youtubePlayerRef.current, soundcloudPlayerRef.current, audioRef.current]);

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
    setIsExternalAudioLoading(true);
    
    // Show loading toast
    const { dismiss } = toast({
      title: "Loading audio...",
      description: `Preparing ${audioData.name}`,
      duration: 10000, // 10 seconds
    });
    
    try {
      // Stop the current playback if any
      if (playbackState.isPlaying) {
        await togglePlayPause();
      }
      
      // Reset any existing external sources
      setCurrentExternalSource({
        type: null,
        isPlaying: false
      });
      
      if (audioData.sourceType === 'youtube') {
        const videoId = getYoutubeVideoId(audioData.sourceUrl);
        if (!videoId) {
          throw new Error('Invalid YouTube URL');
        }
        
        // Set current song display info
        setCurrentSong({
          name: audioData.name,
          author: audioData.author,
          cover: audioData.cover,
          audio: '' // We don't use this directly for YouTube
        });
        
        // Setup YouTube player
        setCurrentExternalSource({
          type: 'youtube',
          id: videoId,
          isPlaying: false
        });
        
        // YouTube player will be initialized in the useEffect
      } 
      else if (audioData.sourceType === 'soundcloud') {
        // Set current song display info
        setCurrentSong({
          name: audioData.name,
          author: audioData.author,
          cover: audioData.cover || "https://static.soundcloud.com/media/soundcloud-square-logo.png",
          audio: '' // We don't use this directly for SoundCloud
        });
        
        // Setup SoundCloud player
        setCurrentExternalSource({
          type: 'soundcloud',
          url: audioData.sourceUrl,
          isPlaying: false
        });
        
        // SoundCloud player will be initialized in the useEffect
      }
      else if (audioData.sourceType === 'direct') {
        // Set the current song for the standard audio element
        setCurrentSong({
          name: audioData.name,
          author: audioData.author,
          cover: audioData.cover || "/placeholder.svg",
          audio: audioData.audio
        });
        
        // For direct audio URLs, we'll wait for the audio to load then play
        const handleAudioLoaded = () => {
          setIsExternalAudioLoading(false);
          dismiss(); // Dismiss the loading toast
          
          // Play the audio
          setTimeout(() => {
            togglePlayPause();
          }, 500);
          
          // Remove the listener
          if (audioRef.current) {
            audioRef.current.removeEventListener('canplaythrough', handleAudioLoaded);
          }
        };
        
        // Add listener for when audio is loaded
        if (audioRef.current) {
          audioRef.current.addEventListener('canplaythrough', handleAudioLoaded);
          audioRef.current.addEventListener('error', () => {
            setIsExternalAudioLoading(false);
            dismiss();
            toast({
              title: "Error loading audio",
              description: "The audio source couldn't be played. Try a different source.",
              variant: "destructive",
            });
          });
        }
      }
    } catch (error) {
      console.error('Error loading external audio:', error);
      setIsExternalAudioLoading(false);
      dismiss(); // Dismiss the loading toast
      
      toast({
        title: "Error loading audio",
        description: error instanceof Error ? error.message : "Failed to load audio source",
        variant: "destructive",
      });
    }
  };
  
  /**
   * Handle play/pause for any audio source
   */
  const handlePlayPause = async () => {
    if (currentExternalSource.type === 'youtube' || currentExternalSource.type === 'soundcloud') {
      // For external sources, use the player controls
      if (currentExternalSource.isPlaying) {
        playerControls?.pause();
      } else {
        playerControls?.play();
      }
      
      // Update the playing state
      setCurrentExternalSource(prev => ({
        ...prev,
        isPlaying: !prev.isPlaying
      }));
    } else {
      // Use the standard audio element
      await togglePlayPause();
    }
  };
  
  /**
   * Handle seeking for any audio source
   */
  const handleSeekControl = async (value: number[]) => {
    if (currentExternalSource.type) {
      // For external sources
      const position = value[0];
      const duration = await playerControls?.getDuration() || 100;
      const seekTime = (position / 100) * duration;
      
      playerControls?.seekTo(seekTime);
    } else {
      // Standard audio element
      handleSeek(value);
    }
  };
  
  /**
   * Handle volume change for any audio source
   */
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    
    // Update volume for all possible players
    setVolume(newVolume);
    playerControls?.setVolume(newVolume);
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
        
        {/* External audio button in top left */}
        <div className="absolute top-4 left-4 z-10">
          <Button 
            variant="ghost" 
            size="icon"
            className="rounded-full bg-black/40 text-white hover:bg-black/60"
            onClick={() => setIsUrlInputOpen(true)}
          >
            <ExternalLink size={16} />
          </Button>
        </div>
        
        {/* Album cover */}
        <div className="absolute top-4 left-4 w-36 h-36 rounded-md overflow-hidden shadow-lg mt-10">
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
          
          {/* Show source tag for external audio */}
          {currentExternalSource.type && (
            <div className="flex mt-1">
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                {currentExternalSource.type === 'youtube' && 'YouTube'}
                {currentExternalSource.type === 'soundcloud' && 'SoundCloud'}
                {currentExternalSource.type === 'direct' && 'External Audio'}
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Playback controls */}
          <PlayerControls 
            playbackState={
              currentExternalSource.type 
                ? { 
                    ...playbackState, 
                    isPlaying: currentExternalSource.isPlaying 
                  } 
                : playbackState
            }
            onPlayPause={handlePlayPause}
            onSeek={handleSeekControl}
            onVolumeChange={values => handleVolumeChange([values[0]])}
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
      
      {/* External players (hidden) */}
      {currentExternalSource.type === 'youtube' && currentExternalSource.id && (
        <YouTubeAudioPlayer
          ref={youtubePlayerRef}
          videoId={currentExternalSource.id}
          onStateChange={(state) => {
            // YouTube state: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
            if (state === 0) { // Ended
              setCurrentExternalSource(prev => ({...prev, isPlaying: false}));
            } else if (state === 1) { // Playing
              setIsExternalAudioLoading(false);
              setCurrentExternalSource(prev => ({...prev, isPlaying: true}));
            } else if (state === 2) { // Paused
              setCurrentExternalSource(prev => ({...prev, isPlaying: false}));
            }
          }}
          onReady={() => {
            setIsExternalAudioLoading(false);
            // Close any loading toasts
            // toast.dismiss(); // This is giving an error - needs to be fixed
          }}
          onError={() => {
            setIsExternalAudioLoading(false);
            toast({
              title: "YouTube Error",
              description: "Could not play the YouTube video. Try a different video.",
              variant: "destructive",
            });
          }}
        />
      )}
      
      {currentExternalSource.type === 'soundcloud' && currentExternalSource.url && (
        <SoundCloudAudioPlayer
          ref={soundcloudPlayerRef}
          url={currentExternalSource.url}
          onReady={() => {
            setIsExternalAudioLoading(false);
            // Close any loading toasts
            // toast.dismiss(); // This is giving an error - needs to be fixed
          }}
          onPlay={() => {
            setCurrentExternalSource(prev => ({...prev, isPlaying: true}));
          }}
          onPause={() => {
            setCurrentExternalSource(prev => ({...prev, isPlaying: false}));
          }}
          onFinish={() => {
            setCurrentExternalSource(prev => ({...prev, isPlaying: false}));
          }}
          onError={() => {
            setIsExternalAudioLoading(false);
            toast({
              title: "SoundCloud Error",
              description: "Could not play the SoundCloud track. Try a different track.",
              variant: "destructive",
            });
          }}
        />
      )}
      
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
      <ExternalAudioInput
        open={isUrlInputOpen}
        onOpenChange={setIsUrlInputOpen}
        onAudioSelected={handleExternalAudioSelected}
      />
      
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