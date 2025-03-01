"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, X, Headphones, Volume2, Volume1, VolumeX, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const playerData = {
  song: {
    name: "They Say It's Wonderful",
    author: "John Coltrane and Johnny Hartman",
    cover: "https://i.scdn.co/image/ab67616d0000b2731d1cc2e40d533d7bcebf5dae",
    // Use a direct accessible mp3 URL that should be more reliable
    audio: "https://storage.googleapis.com/media-session/elephants-dream/the-wires.mp3",
  },
};

// Define preset types
type PresetType = "flat" | "bassBoost" | "vocalEnhancer" | "trebleBoost";
type ChannelMode = "stereo" | "mono";
type SoloMode = "none" | "left" | "right";

// EQ settings for presets
const presetValues: Record<PresetType, number[]> = {
  flat: [0, 0, 0],
  bassBoost: [20, -3, -10], // Extremely strong bass, reduced mids and treble
  vocalEnhancer: [-10, 15, 5], // Very pronounced vocals with reduced bass
  trebleBoost: [-15, -5, 20], // Extremely bright sound, heavily reduced bass
};

export function MusicPlayer() {
  // EQ and audio routing state
  const [isEQEnabled, setIsEQEnabled] = useState(true);
  const [isSplitEarMode, setIsSplitEarMode] = useState(false);
  // Track if split mode has been initialized
  const [splitModeInitialized, setSplitModeInitialized] = useState(false);
  
  // Unified mode state
  const [unifiedPreset, setUnifiedPreset] = useState<PresetType>("flat");
  
  // Split mode state (maintained independently)
  const [leftEarPreset, setLeftEarPreset] = useState<PresetType>("flat");
  const [rightEarPreset, setRightEarPreset] = useState<PresetType>("flat");
  
  const [balance, setBalance] = useState(0.5); // 0 = full left, 1 = full right, 0.5 = center
  const [channelMode, setChannelMode] = useState<ChannelMode>("stereo");
  const [soloMode, setSoloMode] = useState<SoloMode>("none");

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioInitialized, setAudioInitialized] = useState(false);

  // Update audio routing when EQ is toggled
  useEffect(() => {
    if (audioInitialized) {
      console.log("EQ state changed to:", isEQEnabled ? "enabled" : "disabled");
      // When EQ state changes, directly update the gain values on existing filters
      // rather than completely rebuilding the audio chain
      if (isSplitEarMode) {
        // Apply gain directly to left and right filters
        if (leftFiltersRef.current.length > 0) {
          const values = presetValues[leftEarPreset];
          leftFiltersRef.current.forEach((filter, index) => {
            if (filter && index < values.length) {
              filter.gain.value = isEQEnabled ? values[index] : 0;
              console.log(`Left filter ${index} gain set to:`, filter.gain.value);
            }
          });
        }
        
        if (rightFiltersRef.current.length > 0) {
          const values = presetValues[rightEarPreset];
          rightFiltersRef.current.forEach((filter, index) => {
            if (filter && index < values.length) {
              filter.gain.value = isEQEnabled ? values[index] : 0;
              console.log(`Right filter ${index} gain set to:`, filter.gain.value);
            }
          });
        }
      } else {
        // Apply gain directly to unified filters
        if (filtersRef.current.length > 0) {
          const values = presetValues[unifiedPreset];
          filtersRef.current.forEach((filter, index) => {
            if (filter && index < values.length) {
              filter.gain.value = isEQEnabled ? values[index] : 0;
              console.log(`Unified filter ${index} gain set to:`, filter.gain.value);
            }
          });
        }
      }
    }
  }, [isEQEnabled]);

  // Monitor mode changes to ensure proper audio routing
  useEffect(() => {
    if (audioInitialized) {
      console.log("Mode changed to:", isSplitEarMode ? "split" : "unified");
      updateAudioRouting();
    }
  }, [isSplitEarMode]);

  // Canvas ref for frequency response
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Audio refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Audio nodes
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const splitterRef = useRef<ChannelSplitterNode | null>(null);
  const mergerRef = useRef<ChannelMergerNode | null>(null);
  const leftFiltersRef = useRef<BiquadFilterNode[]>([]);
  const rightFiltersRef = useRef<BiquadFilterNode[]>([]);
  const leftGainRef = useRef<GainNode | null>(null);
  const rightGainRef = useRef<GainNode | null>(null);

  // Only load the audio file in the initial setup, don't create audio context yet
  useEffect(() => {
    if (audioRef.current) {
      // Set the source
      audioRef.current.src = playerData.song.audio;
      audioRef.current.crossOrigin = "anonymous";
      
      // Add event listeners
      const canPlayHandler = () => {
        console.log("Audio can play through");
        setIsAudioLoaded(true);
      };
      
      const metadataHandler = () => {
        console.log("Audio metadata loaded, duration:", audioRef.current?.duration);
        setDuration(audioRef.current?.duration || 0);
      };
      
      const errorHandler = (e) => {
        console.error("Audio element error:", e);
        alert("Error loading audio. Please check console for details.");
      };
      
      audioRef.current.addEventListener('canplaythrough', canPlayHandler);
      audioRef.current.addEventListener('loadedmetadata', metadataHandler);
      audioRef.current.addEventListener('error', errorHandler);
      
      // Preload audio
      audioRef.current.load();
      
      // Cleanup function
      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('canplaythrough', canPlayHandler);
          audioRef.current.removeEventListener('loadedmetadata', metadataHandler);
          audioRef.current.removeEventListener('error', errorHandler);
        }
        
        // Cleanup audio context
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(e => console.error("Error closing audio context:", e));
        }
      };
    }
  }, []);

  // Handle time updates
  useEffect(() => {
    const audio = audioRef.current;
    
    const updateTimeHandler = () => {
      if (audio) {
        setCurrentTime(audio.currentTime);
        const currentProgress = (audio.currentTime / (audio.duration || 1)) * 100;
        setProgress(currentProgress);
      }
    };

    audio?.addEventListener('timeupdate', updateTimeHandler);
    
    return () => {
      audio?.removeEventListener('timeupdate', updateTimeHandler);
    };
  }, []);

  // Handle seeking
  const handleSeek = (value: number[]) => {
    if (audioRef.current && duration > 0) {
      const newTime = (value[0] / 100) * duration;
      audioRef.current.currentTime = newTime;
      setProgress(value[0]);
    }
  };

  // Initialize audio context - only call this when user interacts
  const initializeAudioContext = async () => {
    try {
      console.log("Initializing audio context...");
      
      // Close any existing context
      if (audioContextRef.current) {
        try {
          await audioContextRef.current.close();
          audioContextRef.current = null;
        } catch (e) {
          console.error("Error closing previous context:", e);
        }
      }
      
      // Clear node references
      sourceRef.current = null;
      filtersRef.current = [];
      leftFiltersRef.current = [];
      rightFiltersRef.current = [];
      splitterRef.current = null;
      mergerRef.current = null;
      leftGainRef.current = null;
      rightGainRef.current = null;
      
      // Create a new audio context
      if (!audioRef.current) {
        console.error("No audio element available");
        return false;
      }
      
      // Create audio context
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      console.log("Audio context created, state:", ctx.state);
      
      // Resume the context (needed for some browsers)
      if (ctx.state === 'suspended') {
        await ctx.resume();
        console.log("Audio context resumed, new state:", ctx.state);
      }
      
      audioContextRef.current = ctx;
      
      // Create source node
      sourceRef.current = ctx.createMediaElementSource(audioRef.current);
      console.log("Media element source created");
      
      // Basic setup - just connect source to destination initially
      sourceRef.current.connect(ctx.destination);
      
      setAudioInitialized(true);
      console.log("Audio context initialized successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize audio context:", error);
      return false;
    }
  };

  // Reconfigure audio routing based on all current settings
  const updateAudioRouting = async () => {
    try {
      // Skip if we don't have a context or source yet
      if (!audioContextRef.current || !sourceRef.current) {
        console.log("Cannot update audio routing - missing context or source");
        return false;
      }
      
      const context = audioContextRef.current;
      const mediaSource = sourceRef.current;
      
      // First disconnect everything
      try {
        mediaSource.disconnect();
      } catch (e) {
        console.warn("Error disconnecting source:", e);
      }
      
      console.log("Updating audio routing, mode:", isSplitEarMode ? "split" : "unified", "EQ enabled:", isEQEnabled);
      
      // Important: We'll still set up the same routing regardless of EQ being enabled/disabled
      // The difference is whether the filter gain values are applied (in applyEQPreset function)
      // This ensures easier toggling of EQ on/off without reconnecting everything
      
      // Define frequency bands
      const freqs = [100, 1000, 5000];
      
      if (isSplitEarMode) {
        // SPLIT EAR MODE SETUP
        console.log("Setting up split ear mode");
        
        // Create splitter
        const splitter = context.createChannelSplitter(2);
        splitterRef.current = splitter;
        
        // Create merger
        const merger = context.createChannelMerger(2);
        mergerRef.current = merger;
        
        // Create gain nodes
        const leftGain = context.createGain();
        const rightGain = context.createGain();
        leftGainRef.current = leftGain;
        rightGainRef.current = rightGain;
        
        // Create left filters
        const leftFilters = freqs.map(freq => {
          const filter = context.createBiquadFilter();
          filter.type = "peaking";
          filter.frequency.value = freq;
          filter.gain.value = 0;
          filter.Q.value = 1.0;
          return filter;
        });
        leftFiltersRef.current = leftFilters;
        
        // Create right filters
        const rightFilters = freqs.map(freq => {
          const filter = context.createBiquadFilter();
          filter.type = "peaking";
          filter.frequency.value = freq;
          filter.gain.value = 0;
          filter.Q.value = 1.0;
          return filter;
        });
        rightFiltersRef.current = rightFilters;
        
        // Apply balance
        leftGain.gain.value = balance <= 0.5 ? 1 : 1 - (balance - 0.5) * 2;
        rightGain.gain.value = balance >= 0.5 ? 1 : balance * 2;
        
        // Connect everything in sequence
        mediaSource.connect(splitter);
        
        // Left channel
        splitter.connect(leftFilters[0], 0);
        leftFilters[0].connect(leftFilters[1]);
        leftFilters[1].connect(leftFilters[2]);
        leftFilters[2].connect(leftGain);
        leftGain.connect(merger, 0, 0);
        
        // Right channel
        splitter.connect(rightFilters[0], 1);
        rightFilters[0].connect(rightFilters[1]);
        rightFilters[1].connect(rightFilters[2]);
        rightFilters[2].connect(rightGain);
        rightGain.connect(merger, 0, 1);
        
        // Connect merger to destination
        merger.connect(context.destination);
        
        // Apply presets to left and right if EQ is enabled
        if (isEQEnabled) {
          applyEQPreset(leftEarPreset, leftFilters);
          applyEQPreset(rightEarPreset, rightFilters);
        }
        
        console.log("Split ear mode setup complete");
      } else {
        // UNIFIED MODE SETUP
        console.log("Setting up unified mode");
        
        // Create filters
        const filters = freqs.map(freq => {
          const filter = context.createBiquadFilter();
          filter.type = "peaking";
          filter.frequency.value = freq;
          filter.gain.value = 0;
          filter.Q.value = 1.0;
          return filter;
        });
        filtersRef.current = filters;
        
        // Create splitter for balance control
        const splitter = context.createChannelSplitter(2);
        splitterRef.current = splitter;
        
        // Create merger
        const merger = context.createChannelMerger(2);
        mergerRef.current = merger;
        
        // Create gain nodes for balance
        const leftGain = context.createGain();
        const rightGain = context.createGain();
        leftGainRef.current = leftGain;
        rightGainRef.current = rightGain;
        
        // Apply balance
        leftGain.gain.value = balance <= 0.5 ? 1 : 1 - (balance - 0.5) * 2;
        rightGain.gain.value = balance >= 0.5 ? 1 : balance * 2;
        
        // Connect nodes: Source -> Filters -> Splitter -> Gains -> Merger -> Destination
        mediaSource.connect(filters[0]);
        filters[0].connect(filters[1]);
        filters[1].connect(filters[2]);
        
        // Split for balance control
        filters[2].connect(splitter);
        splitter.connect(leftGain, 0);
        splitter.connect(rightGain, 1);
        leftGain.connect(merger, 0, 0);
        rightGain.connect(merger, 0, 1);
        merger.connect(context.destination);
        
        // Apply unified preset if EQ is enabled
        if (isEQEnabled) {
          applyEQPreset(unifiedPreset, filters);
        }
        
        console.log("Unified mode setup complete");
      }
      
      // Update the visualization
      updateFrequencyResponse();
      
      return true;
    } catch (error) {
      console.error("Error in updateAudioRouting:", error);
      return false;
    }
  };

  // Apply EQ preset to a set of filters
  const applyEQPreset = (preset: PresetType, filters: BiquadFilterNode[]) => {
    if (!audioContextRef.current || filters.length === 0) return;
    
    console.log(`Applying preset ${preset} to filters`, isEQEnabled ? "EQ is ON" : "EQ is OFF");
    
    const values = presetValues[preset];
    
    // Apply values immediately
    filters.forEach((filter, index) => {
      if (filter && typeof filter.gain !== 'undefined' && index < values.length) {
        // When EQ is disabled, set actual filter gain to 0 (no effect)
        filter.gain.value = isEQEnabled ? values[index] : 0;
        console.log(`Filter ${index} gain set to:`, filter.gain.value);
      }
    });
  };

  // Toggle play/pause - fixed version with proper initialization
  const togglePlayPause = async () => {
    try {
      if (!audioRef.current) {
        console.error("No audio element available");
        return;
      }
      
      console.log("Toggle play/pause, current state:", isPlaying ? "playing" : "paused");
      
      if (isPlaying) {
        // Pause playback
        audioRef.current.pause();
        setIsPlaying(false);
        console.log("Audio paused");
      } else {
        // Initialize audio context if needed (only on first play)
        if (!audioInitialized) {
          console.log("First play - initializing audio context");
          const success = await initializeAudioContext();
          if (!success) {
            console.error("Failed to initialize audio");
            alert("Failed to initialize audio. Please try again or use a different browser.");
            return;
          }
          
          // Now that we have an audio context, set up audio routing
          await updateAudioRouting();
        } else if (audioContextRef.current?.state === 'suspended') {
          // Resume audio context if suspended
          console.log("Audio context suspended, resuming...");
          await audioContextRef.current.resume();
        }
        
        // Ensure audio is loaded
        if (!isAudioLoaded) {
          console.log("Audio not loaded, waiting...");
          try {
            audioRef.current.load();
            await new Promise<void>((resolve, reject) => {
              const loadTimeout = setTimeout(() => {
                reject(new Error("Audio loading timed out"));
              }, 5000);
              
              audioRef.current!.oncanplaythrough = () => {
                clearTimeout(loadTimeout);
                setIsAudioLoaded(true);
                resolve();
              };
              
              audioRef.current!.onerror = () => {
                clearTimeout(loadTimeout);
                reject(new Error("Audio loading failed"));
              };
            });
          } catch (error) {
            console.error("Failed to load audio:", error);
            alert("Failed to load audio: " + error.message);
            return;
          }
        }
        
        // Play audio
        try {
          console.log("Starting playback...");
          const playPromise = audioRef.current.play();
          await playPromise;
          setIsPlaying(true);
          console.log("✅ Playback started successfully");
        } catch (error) {
          console.error("❌ Playback error:", error);
          
          // Handle autoplay policy error
          if (error instanceof Error && error.name === 'NotAllowedError') {
            alert("Autoplay blocked by browser. Please try clicking play again.");
          } else {
            alert("Playback error: " + error);
          }
        }
      }
    } catch (error) {
      console.error("Error in togglePlayPause:", error);
    }
  };

  // Toggle between unified and split ear modes with immediate effect
  const toggleEarMode = async () => {
    // Get current values
    const newSplitMode = !isSplitEarMode;
    console.log(`Switching to ${newSplitMode ? 'split' : 'unified'} mode`);
    
    try {
      // IMPORTANT: Disconnect everything before state changes
      if (audioContextRef.current && sourceRef.current) {
        console.log("Disconnecting audio for mode switch");
        sourceRef.current.disconnect();
      }
    } catch (e) {
      console.warn("Error disconnecting source:", e);
    }
    
    // First time split mode initialization
    if (newSplitMode && !splitModeInitialized) {
      console.log("First time in split mode, initializing with flat presets");
      setSplitModeInitialized(true);
      setLeftEarPreset("flat");
      setRightEarPreset("flat");
    }
    
    // Update the mode state
    setIsSplitEarMode(newSplitMode);
    
    // Immediately rebuild the audio graph
    // This needs to happen after the state is updated but we can't wait for React's normal cycle
    // So we force it with a minimal timeout
    
    // Use queueMicrotask to ensure this runs as soon as possible
    queueMicrotask(async () => {
      if (!audioInitialized || !audioContextRef.current) {
        console.log("Audio not initialized, can't rebuild yet");
        return;
      }
      
      const context = audioContextRef.current;
      const mediaSource = sourceRef.current;
      
      if (!mediaSource) {
        console.log("No media source available");
        return;
      }
      
      console.log("Rebuilding audio routing for immediate mode switch");
      
      // Define frequency bands
      const freqs = [100, 1000, 5000];
      
      if (newSplitMode) {
        // SPLIT EAR MODE IMMEDIATE SETUP
        console.log("Setting up split ear mode immediately");
        
        // Create splitter
        const splitter = context.createChannelSplitter(2);
        splitterRef.current = splitter;
        
        // Create merger
        const merger = context.createChannelMerger(2);
        mergerRef.current = merger;
        
        // Create gain nodes
        const leftGain = context.createGain();
        const rightGain = context.createGain();
        leftGainRef.current = leftGain;
        rightGainRef.current = rightGain;
        
        // Apply balance
        leftGain.gain.value = balance <= 0.5 ? 1 : 1 - (balance - 0.5) * 2;
        rightGain.gain.value = balance >= 0.5 ? 1 : balance * 2;
        
        // Determine the presets to use - if first time, use flat
        const leftPreset = splitModeInitialized ? leftEarPreset : "flat";
        const rightPreset = splitModeInitialized ? rightEarPreset : "flat";
        
        console.log("Using split presets:", leftPreset, rightPreset);
        
        // Create left filters with preset values directly applied
        const leftFilterValues = presetValues[leftPreset];
        const leftFilters = freqs.map((freq, index) => {
          const filter = context.createBiquadFilter();
          filter.type = "peaking";
          filter.frequency.value = freq;
          // Apply preset value or 0 if EQ is disabled
          filter.gain.value = isEQEnabled ? leftFilterValues[index] : 0;
          filter.Q.value = 1.0;
          console.log(`Left filter ${index} created with gain:`, filter.gain.value);
          return filter;
        });
        leftFiltersRef.current = leftFilters;
        
        // Create right filters with preset values directly applied
        const rightFilterValues = presetValues[rightPreset];
        const rightFilters = freqs.map((freq, index) => {
          const filter = context.createBiquadFilter();
          filter.type = "peaking";
          filter.frequency.value = freq;
          // Apply preset value or 0 if EQ is disabled
          filter.gain.value = isEQEnabled ? rightFilterValues[index] : 0;
          filter.Q.value = 1.0;
          console.log(`Right filter ${index} created with gain:`, filter.gain.value);
          return filter;
        });
        rightFiltersRef.current = rightFilters;
        
        // Connect everything in sequence
        try {
          mediaSource.connect(splitter);
          
          // Left channel
          splitter.connect(leftFilters[0], 0);
          leftFilters[0].connect(leftFilters[1]);
          leftFilters[1].connect(leftFilters[2]);
          leftFilters[2].connect(leftGain);
          leftGain.connect(merger, 0, 0);
          
          // Right channel
          splitter.connect(rightFilters[0], 1);
          rightFilters[0].connect(rightFilters[1]);
          rightFilters[1].connect(rightFilters[2]);
          rightFilters[2].connect(rightGain);
          rightGain.connect(merger, 0, 1);
          
          // Connect merger to destination
          merger.connect(context.destination);
          console.log("Split ear mode setup complete with immediate preset application");
        } catch (e) {
          console.error("Error connecting split mode audio nodes:", e);
        }
      } else {
        // UNIFIED MODE IMMEDIATE SETUP
        console.log("Setting up unified mode immediately");
        
        // Use current unified preset
        const unifiedFilterValues = presetValues[unifiedPreset];
        console.log("Using unified preset:", unifiedPreset);
        
        // Create filters with preset values directly applied
        const filters = freqs.map((freq, index) => {
          const filter = context.createBiquadFilter();
          filter.type = "peaking";
          filter.frequency.value = freq;
          // Apply preset value or 0 if EQ is disabled
          filter.gain.value = isEQEnabled ? unifiedFilterValues[index] : 0;
          filter.Q.value = 1.0;
          console.log(`Unified filter ${index} created with gain:`, filter.gain.value);
          return filter;
        });
        filtersRef.current = filters;
        
        // Create splitter for balance control
        const splitter = context.createChannelSplitter(2);
        splitterRef.current = splitter;
        
        // Create merger
        const merger = context.createChannelMerger(2);
        mergerRef.current = merger;
        
        // Create gain nodes for balance
        const leftGain = context.createGain();
        const rightGain = context.createGain();
        leftGainRef.current = leftGain;
        rightGainRef.current = rightGain;
        
        // Apply balance
        leftGain.gain.value = balance <= 0.5 ? 1 : 1 - (balance - 0.5) * 2;
        rightGain.gain.value = balance >= 0.5 ? 1 : balance * 2;
        
        try {
          // Connect nodes: Source -> Filters -> Splitter -> Gains -> Merger -> Destination
          mediaSource.connect(filters[0]);
          filters[0].connect(filters[1]);
          filters[1].connect(filters[2]);
          
          // Split for balance control
          filters[2].connect(splitter);
          splitter.connect(leftGain, 0);
          splitter.connect(rightGain, 1);
          leftGain.connect(merger, 0, 0);
          rightGain.connect(merger, 0, 1);
          merger.connect(context.destination);
          console.log("Unified mode setup complete with immediate preset application");
        } catch (e) {
          console.error("Error connecting unified mode audio nodes:", e);
        }
      }
    });
  };

  // Toggle EQ on/off
  const toggleEQ = async () => {
    setIsEQEnabled(prev => !prev);
    
    // No need to explicitly call updateAudioRouting here, 
    // as the useEffect watching isEQEnabled will handle it
    // We're keeping the preset values but just disabling their application
  };

  // Reset EQ to flat
  const resetEQ = async () => {
    console.log("Resetting EQ to flat");
    
    if (isSplitEarMode) {
      // Reset both channels in split mode
      setLeftEarPreset("flat");
      setRightEarPreset("flat");
      
      // Immediately apply flat EQ to both channels
      if (audioInitialized) {
        const flatValues = presetValues["flat"];
        
        if (leftFiltersRef.current.length > 0) {
          leftFiltersRef.current.forEach((filter, index) => {
            if (filter && index < flatValues.length) {
              filter.gain.value = isEQEnabled ? flatValues[index] : 0;
              console.log(`Left filter ${index} reset to:`, filter.gain.value);
            }
          });
        }
        
        if (rightFiltersRef.current.length > 0) {
          rightFiltersRef.current.forEach((filter, index) => {
            if (filter && index < flatValues.length) {
              filter.gain.value = isEQEnabled ? flatValues[index] : 0;
              console.log(`Right filter ${index} reset to:`, filter.gain.value);
            }
          });
        }
      }
    } else {
      // Reset unified EQ
      setUnifiedPreset("flat");
      
      // Immediately apply flat EQ to unified channel
      if (audioInitialized && filtersRef.current.length > 0) {
        const flatValues = presetValues["flat"];
        filtersRef.current.forEach((filter, index) => {
          if (filter && index < flatValues.length) {
            filter.gain.value = isEQEnabled ? flatValues[index] : 0;
            console.log(`Unified filter ${index} reset to:`, filter.gain.value);
          }
        });
      }
    }
  };

  // Update balance
  const updateBalance = async (newBalance: number[]) => {
    setBalance(newBalance[0]);
    
    // Update routing with a slight delay to ensure state is updated
    setTimeout(async () => {
      if (audioInitialized) {
        await updateAudioRouting();
      }
    }, 0);
  };

  // Apply preset to unified mode
  const applyUnifiedPreset = async (preset: PresetType) => {
    console.log("Setting unified preset to:", preset);
    setUnifiedPreset(preset);
    
    // Immediately apply to filters if in unified mode and audio is initialized
    if (!isSplitEarMode && audioInitialized && filtersRef.current.length > 0) {
      console.log("Immediately applying unified preset");
      const values = presetValues[preset];
      filtersRef.current.forEach((filter, index) => {
        if (filter && index < values.length) {
          filter.gain.value = isEQEnabled ? values[index] : 0;
          console.log(`Unified filter ${index} gain set to:`, filter.gain.value);
        }
      });
    }
  };

  // Apply preset to left ear only
  const applyLeftEarPreset = async (preset: PresetType) => {
    console.log("Setting left ear preset to:", preset);
    setLeftEarPreset(preset);
    
    // Immediately apply to filters if in split mode and audio is initialized
    if (isSplitEarMode && audioInitialized && leftFiltersRef.current.length > 0) {
      console.log("Immediately applying left ear preset");
      const values = presetValues[preset];
      leftFiltersRef.current.forEach((filter, index) => {
        if (filter && index < values.length) {
          filter.gain.value = isEQEnabled ? values[index] : 0;
          console.log(`Left filter ${index} gain set to:`, filter.gain.value);
        }
      });
    }
  };

  // Apply preset to right ear only
  const applyRightEarPreset = async (preset: PresetType) => {
    console.log("Setting right ear preset to:", preset);
    setRightEarPreset(preset);
    
    // Immediately apply to filters if in split mode and audio is initialized
    if (isSplitEarMode && audioInitialized && rightFiltersRef.current.length > 0) {
      console.log("Immediately applying right ear preset");
      const values = presetValues[preset];
      rightFiltersRef.current.forEach((filter, index) => {
        if (filter && index < values.length) {
          filter.gain.value = isEQEnabled ? values[index] : 0;
          console.log(`Right filter ${index} gain set to:`, filter.gain.value);
        }
      });
    }
  };

  // Calculate and update the frequency response curve
  const updateFrequencyResponse = () => {
    if (!canvasRef.current) {
      console.log("Cannot update visualization - canvas not available");
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    console.log("Updating frequency response visualization", 
      isSplitEarMode ? "Split mode" : "Unified mode", 
      "Presets:", isSplitEarMode ? 
        `Left: ${leftEarPreset}, Right: ${rightEarPreset}` : 
        `Unified: ${unifiedPreset}`,
      "EQ enabled:", isEQEnabled ? "yes" : "no");
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw 3D effect grid
    const gridColor = '#e9ecef';
    const gridLines = 12;
    const gridSpacingH = canvas.width / gridLines;
    const gridSpacingV = canvas.height / gridLines;
    
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= gridLines; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * gridSpacingV);
      ctx.lineTo(canvas.width, i * gridSpacingV);
      ctx.stroke();
    }
    
    // Vertical grid lines
    for (let i = 0; i <= gridLines; i++) {
      ctx.beginPath();
      ctx.moveTo(i * gridSpacingH, 0);
      ctx.lineTo(i * gridSpacingH, canvas.height);
      ctx.stroke();
    }
    
    // Draw zero line with a different color
    ctx.strokeStyle = '#ced4da';
    ctx.lineWidth = 2;
    const zeroDbY = canvas.height / 2;
    ctx.beginPath();
    ctx.moveTo(0, zeroDbY);
    ctx.lineTo(canvas.width, zeroDbY);
    ctx.stroke();
    
    // Add frequency labels
    ctx.fillStyle = '#6c757d';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'center';
    
    const freqLabels = ['20Hz', '100Hz', '1kHz', '5kHz', '20kHz'];
    const freqPositions = [0.05, 0.25, 0.5, 0.75, 0.95];
    
    freqLabels.forEach((label, i) => {
      const x = canvas.width * freqPositions[i];
      ctx.fillText(label, x, canvas.height - 5);
    });
    
    // Add dB labels
    ctx.textAlign = 'left';
    ctx.fillText('+15dB', 5, 15);
    ctx.fillText('0dB', 5, canvas.height / 2 - 5);
    ctx.fillText('-15dB', 5, canvas.height - 15);
    
    // Draw EQ curve(s)
    const drawEQCurve = (filters, color) => {
      // Filters might be empty before audio is initialized, but we still want to show visualization
      
      // Determine which preset is active based on the current mode
      let activePreset: PresetType;
      if (isSplitEarMode) {
        // Handle the case where filters array might be empty (before audio initialization)
        activePreset = filters === leftFiltersRef.current ? leftEarPreset : 
                      filters === rightFiltersRef.current ? rightEarPreset : 
                      "flat"; // Default if can't determine
      } else {
        activePreset = unifiedPreset;
      }
      
      // Get preset values for visualization (not necessarily the current filter gain values)
      const presetGains = presetValues[activePreset];
      
      // Set up curve style
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      
      // If EQ is disabled, reduce opacity
      if (!isEQEnabled) {
        ctx.globalAlpha = 0.4; // 40% opacity when disabled
      } else {
        ctx.globalAlpha = 1.0; // Full opacity when enabled
      }
      
      // Draw curve
      ctx.beginPath();
      
      // Start at left edge (lowest frequency)
      ctx.moveTo(0, zeroDbY - (presetGains[0] / 15) * (canvas.height / 2) * 0.7);
      
      // Calculate control points for smooth curve
      const points = [];
      
      // Add first frequency point
      const x1 = canvas.width * 0.25; // Low frequency (100Hz)
      const y1 = zeroDbY - (presetGains[0] / 15) * (canvas.height / 2) * 0.7;
      points.push({x: x1, y: y1});
      
      // Add mid frequency point
      const x2 = canvas.width * 0.5; // Mid frequency (1kHz)
      const y2 = zeroDbY - (presetGains[1] / 15) * (canvas.height / 2) * 0.7;
      points.push({x: x2, y: y2});
      
      // Add high frequency point
      const x3 = canvas.width * 0.75; // High frequency (5kHz)
      const y3 = zeroDbY - (presetGains[2] / 15) * (canvas.height / 2) * 0.7;
      points.push({x: x3, y: y3});
      
      // Draw a smooth curve through the points
      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        
        if (i === 0) {
          // Draw line from start to first point
          ctx.lineTo(point.x, point.y);
        } else {
          // Draw quadratic curve between points
          const prevPoint = points[i-1];
          const cpX = (prevPoint.x + point.x) / 2;
          ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, cpX, (prevPoint.y + point.y) / 2);
          ctx.lineTo(point.x, point.y);
        }
      }
      
      // Continue to right edge
      ctx.lineTo(canvas.width, zeroDbY - (presetGains[2] / 15) * (canvas.height / 2) * 0.7);
      
      // Stroke the path
      ctx.stroke();
      
      // Add dots at each frequency point
      ctx.fillStyle = color;
      points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Reset opacity for next drawing
      ctx.globalAlpha = 1.0;
    };
    
    // Draw curves based on current mode
    if (isSplitEarMode) {
      // Use red and blue for split mode
      // Always draw the curves, even if filters are not yet initialized
      drawEQCurve(leftFiltersRef.current, '#3b82f6'); // Blue for left
      drawEQCurve(rightFiltersRef.current, '#ef4444'); // Red for right
      
      // Add a legend
      ctx.font = '12px system-ui';
      ctx.fillStyle = '#3b82f6';
      ctx.fillText('Left', canvas.width - 60, 20);
      ctx.fillStyle = '#ef4444';
      ctx.fillText('Right', canvas.width - 60, 40);
    } else {
      // Use dark orange for unified mode
      // Always draw the curve, even if filters are not yet initialized
      drawEQCurve(filtersRef.current, '#dd6b20'); // Dark orange for unified
    }
  };

  const PresetButton = ({ 
    preset, 
    activePreset, 
    onClick 
  }: { 
    preset: PresetType, 
    activePreset: PresetType, 
    onClick: () => void 
  }) => {
    // Map presets to colors
    const colorMap = {
      flat: {
        active: { bg: "#374151", text: "white" },
        inactive: { bg: "#F3F4F6", text: "#1F2937" }
      },
      bassBoost: {
        active: { bg: "#1D4ED8", text: "white" },
        inactive: { bg: "#DBEAFE", text: "#1E40AF" }
      },
      vocalEnhancer: {
        active: { bg: "#047857", text: "white" },
        inactive: { bg: "#D1FAE5", text: "#065F46" }
      },
      trebleBoost: {
        active: { bg: "#7E22CE", text: "white" },
        inactive: { bg: "#F3E8FF", text: "#6B21A8" }
      }
    };
    
    const isActive = activePreset === preset;
    const style = colorMap[preset];
    
    return (
      <button 
        className={`text-sm font-medium rounded-md shadow-sm transition-colors ${!isEQEnabled ? "opacity-60" : ""}`}
        style={{
          backgroundColor: isActive ? style.active.bg : style.inactive.bg,
          color: isActive ? style.active.text : style.inactive.text,
          padding: "8px 12px",
          border: "none",
        }}
        onClick={onClick}
        disabled={!isEQEnabled}
      >
        {preset === 'flat' ? 'Flat' : 
         preset === 'bassBoost' ? 'Bass Boost' :
         preset === 'vocalEnhancer' ? 'Vocal Enhancer' : 'Treble Boost'}
      </button>
    );
  };

  const renderUnifiedControls = () => (
    <div className="flex flex-wrap gap-2 justify-center">
      <PresetButton 
        preset="flat" 
        activePreset={unifiedPreset} 
        onClick={() => applyUnifiedPreset("flat")} 
      />
      <PresetButton 
        preset="bassBoost" 
        activePreset={unifiedPreset} 
        onClick={() => applyUnifiedPreset("bassBoost")} 
      />
      <PresetButton 
        preset="vocalEnhancer" 
        activePreset={unifiedPreset} 
        onClick={() => applyUnifiedPreset("vocalEnhancer")} 
      />
      <PresetButton 
        preset="trebleBoost" 
        activePreset={unifiedPreset} 
        onClick={() => applyUnifiedPreset("trebleBoost")} 
      />
    </div>
  );

  // The rest of your component code...
  
  return (
    <Card className="w-[400px] overflow-hidden bg-white rounded-xl shadow-lg">
      <audio ref={audioRef} />
      <CardHeader className="p-0 relative bg-gradient-to-b from-neutral-800 to-black h-56 flex flex-col justify-end">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        
        {/* Album cover */}
        <div className="absolute top-4 left-4 w-36 h-36 rounded-md overflow-hidden shadow-lg">
          <img 
            src={playerData.song.cover} 
            alt="Album cover" 
            className="w-full h-full object-cover" 
          />
        </div>
        
        {/* Track info */}
        <div className="relative p-4 text-white">
          <h2 className="text-lg font-bold">{playerData.song.name}</h2>
          <p className="text-sm text-white/80">{playerData.song.author}</p>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Playback controls */}
          <div className="flex items-center justify-between">
            <div className="w-10" /> {/* Spacer */}
            
            <button 
              className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800 transition-colors"
              onClick={togglePlayPause}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} fill="white" />}
            </button>
            
            <div className="flex items-center space-x-2">
              <Volume2 size={18} className="text-gray-500" />
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="space-y-1">
            <Slider
              value={[progress]}
              min={0}
              max={100}
              step={0.01}
              onValueChange={handleSeek}
              className="cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{new Date(currentTime * 1000).toISOString().substr(14, 5)}</span>
              <span>{new Date(duration * 1000).toISOString().substr(14, 5)}</span>
            </div>
          </div>
          
          <div className="border-t border-gray-100 pt-4">
            <Tabs defaultValue="eq">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="eq" className="text-xs">Equalizer</TabsTrigger>
                <TabsTrigger value="settings" className="text-xs">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="eq" className="space-y-4">
                {/* EQ visualization */}
                <div className="border border-gray-200 rounded-md p-2 h-32 relative">
                  <canvas ref={canvasRef} className="w-full h-full" />
                </div>
                
                {/* EQ toggle and mode selector */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      checked={isEQEnabled} 
                      onCheckedChange={toggleEQ} 
                      id="eq-toggle"
                    />
                    <label htmlFor="eq-toggle" className="text-sm font-medium">
                      EQ {isEQEnabled ? "On" : "Off"}
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={toggleEarMode}
                      className="text-xs h-8"
                    >
                      {isSplitEarMode ? "Unified Mode" : "Split Ear Mode"}
                    </Button>
                  </div>
                </div>
                
                {/* EQ presets */}
                <div className="space-y-3">
                  {isSplitEarMode ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-2 text-blue-600">Left Ear</p>
                        <div className="flex flex-wrap gap-2">
                          <PresetButton 
                            preset="flat" 
                            activePreset={leftEarPreset}
                            onClick={() => applyLeftEarPreset("flat")}
                          />
                          <PresetButton 
                            preset="bassBoost" 
                            activePreset={leftEarPreset}
                            onClick={() => applyLeftEarPreset("bassBoost")}
                          />
                          <PresetButton 
                            preset="vocalEnhancer" 
                            activePreset={leftEarPreset}
                            onClick={() => applyLeftEarPreset("vocalEnhancer")}
                          />
                          <PresetButton 
                            preset="trebleBoost" 
                            activePreset={leftEarPreset}
                            onClick={() => applyLeftEarPreset("trebleBoost")}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-2 text-red-600">Right Ear</p>
                        <div className="flex flex-wrap gap-2">
                          <PresetButton 
                            preset="flat" 
                            activePreset={rightEarPreset}
                            onClick={() => applyRightEarPreset("flat")}
                          />
                          <PresetButton 
                            preset="bassBoost" 
                            activePreset={rightEarPreset}
                            onClick={() => applyRightEarPreset("bassBoost")}
                          />
                          <PresetButton 
                            preset="vocalEnhancer" 
                            activePreset={rightEarPreset}
                            onClick={() => applyRightEarPreset("vocalEnhancer")}
                          />
                          <PresetButton 
                            preset="trebleBoost" 
                            activePreset={rightEarPreset}
                            onClick={() => applyRightEarPreset("trebleBoost")}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium mb-2">Presets</p>
                      {renderUnifiedControls()}
                    </div>
                  )}
                </div>
                
                {/* Balance control */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Balance</span>
                    <Button onClick={resetEQ} size="sm" variant="outline" className="h-7 text-xs">
                      Reset EQ
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs">L</span>
                    <Slider 
                      value={[balance]} 
                      min={0} 
                      max={1} 
                      step={0.01} 
                      onValueChange={updateBalance}
                    />
                    <span className="text-xs">R</span>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="settings" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Channel Mode</h3>
                    <ToggleGroup 
                      type="single" 
                      value={channelMode}
                      onValueChange={(value) => {
                        if (value) setChannelMode(value as ChannelMode);
                      }}
                      className="justify-start"
                    >
                      <ToggleGroupItem value="stereo" size="sm" className="text-xs">
                        Stereo
                      </ToggleGroupItem>
                      <ToggleGroupItem value="mono" size="sm" className="text-xs">
                        Mono
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Solo Mode</h3>
                    <ToggleGroup 
                      type="single" 
                      value={soloMode}
                      onValueChange={(value) => {
                        if (value) setSoloMode(value as SoloMode);
                      }}
                      className="justify-start"
                    >
                      <ToggleGroupItem value="none" size="sm" className="text-xs">
                        Off
                      </ToggleGroupItem>
                      <ToggleGroupItem value="left" size="sm" className="text-xs">
                        Left
                      </ToggleGroupItem>
                      <ToggleGroupItem value="right" size="sm" className="text-xs">
                        Right
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}