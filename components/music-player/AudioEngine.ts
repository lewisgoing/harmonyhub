import { AudioNodes, FrequencyBand, ChannelMode, SoloMode, SplitEarConfig, Preset } from './types';
import { DEFAULT_FREQUENCY_BANDS } from './constants';


/**
 * AudioEngine class handles all interactions with the Web Audio API
 */
export class AudioEngine {
  private debounceTimers: Record<string, number> = {};

  private audioElement: HTMLAudioElement | null = null;
  public nodes: AudioNodes = {
    context: null,
    source: null,
    filters: [],
    leftFilters: [],
    rightFilters: [],
    splitter: null,
    merger: null,
    leftGain: null,
    rightGain: null
  };
  
  private initialized = false;
  private eqEnabled = true;
  private leftEarEnabled = true;
  private rightEarEnabled = true;
  private splitEarMode = false;
  private channelMode: ChannelMode = 'stereo';
  private soloMode: SoloMode = 'none';
  private balance = 0.5;
  
  // Store current preset bands
  private unifiedBands: FrequencyBand[] = [...DEFAULT_FREQUENCY_BANDS];
  private leftEarBands: FrequencyBand[] = [...DEFAULT_FREQUENCY_BANDS];
  private rightEarBands: FrequencyBand[] = [...DEFAULT_FREQUENCY_BANDS];

  constructor(audioElement: HTMLAudioElement) {
    this.audioElement = audioElement;
  }

  /**
 * Simple debounce utility
 */
private debounce(func: Function, wait: number, key: string): void {
  if (this.debounceTimers[key]) {
    clearTimeout(this.debounceTimers[key]);
  }
  
  this.debounceTimers[key] = window.setTimeout(() => {
    func();
    delete this.debounceTimers[key];
  }, wait);
}


  /**
   * Initialize the audio context and create base nodes
   */
  public async initialize(): Promise<boolean> {
    try {
      if (this.initialized) {
        await this.cleanupContext();
      }

      if (!this.audioElement) {
        console.error("No audio element provided");
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
      
      this.nodes.context = ctx;
      
      // Create source node
      this.nodes.source = ctx.createMediaElementSource(this.audioElement);
      console.log("Media element source created");
      
      // Basic setup - just connect source to destination initially
      this.nodes.source.connect(ctx.destination);
      
      this.initialized = true;
      console.log("Audio context initialized successfully");
      
      // Set up initial audio routing
      await this.updateAudioRouting();
      
      return true;
    } catch (error) {
      console.error("Failed to initialize audio context:", error);
      return false;
    }
  }

  /**
   * Clean up and close existing audio context
   */
  private async cleanupContext(): Promise<void> {
    if (this.nodes.context) {
      try {
        // Disconnect source if it exists
        if (this.nodes.source) {
          try {
            this.nodes.source.disconnect();
          } catch (e) {
            console.warn("Error disconnecting source:", e);
          }
        }
        
        // Close the context
        await this.nodes.context.close();
        console.log("Audio context closed");
        
        // Reset node references
        this.nodes = {
          context: null,
          source: null,
          filters: [],
          leftFilters: [],
          rightFilters: [],
          splitter: null,
          merger: null,
          leftGain: null,
          rightGain: null
        };
      } catch (e) {
        console.error("Error closing audio context:", e);
      }
    }
  }

  /**
   * Update audio routing based on current settings
   */
  public async updateAudioRouting(): Promise<boolean> {
    try {
      if (!this.nodes.context || !this.nodes.source) {
        console.log("Cannot update audio routing - missing context or source");
        return false;
      }
      
      const context = this.nodes.context;
      const mediaSource = this.nodes.source;

      const needsRebuild = (
        // If we're switching modes, we need to rebuild
        (this.splitEarMode && this.nodes.filters.length > 0 && this.nodes.leftFilters.length === 0) ||
        (!this.splitEarMode && this.nodes.leftFilters.length > 0 && this.nodes.filters.length === 0) ||
        // If any required nodes are missing
        !this.nodes.splitter || !this.nodes.merger || !this.nodes.leftGain || !this.nodes.rightGain
      );

      if (needsRebuild) {
        // Full rebuild needed - disconnect everything
        try {
          mediaSource.disconnect();
        } catch (e) {
          console.warn("Error disconnecting source:", e);
        }
        
        console.log("Rebuilding audio routing", 
                    "Mode:", this.splitEarMode ? "split" : "unified");

                    this.nodes.filters = [];
                    this.nodes.leftFilters = [];
                    this.nodes.rightFilters = [];
                    this.nodes.splitter = null;
                    this.nodes.merger = null;
                    this.nodes.leftGain = null;
                    this.nodes.rightGain = null;
      
      // First disconnect everything
      // try {
      //   mediaSource.disconnect();
      // } catch (e) {
      //   console.warn("Error disconnecting source:", e);
      // }
      
      // console.log("Updating audio routing", 
      //             "Mode:", this.splitEarMode ? "split" : "unified", 
      //             "EQ enabled:", this.eqEnabled);
      
      if (this.splitEarMode) {
        // SPLIT EAR MODE SETUP
        console.log("Setting up split ear mode");
        
        // Create splitter
        const splitter = context.createChannelSplitter(2);
        this.nodes.splitter = splitter;
        
        // Create merger
        const merger = context.createChannelMerger(2);
        this.nodes.merger = merger;
        
        // Create gain nodes
        const leftGain = context.createGain();
        const rightGain = context.createGain();
        this.nodes.leftGain = leftGain;
        this.nodes.rightGain = rightGain;
        
        // Create filters for left channel
        const leftFilters = this.createFiltersFromBands(context, this.leftEarBands);
        this.nodes.leftFilters = leftFilters;
        
        // Create filters for right channel
        const rightFilters = this.createFiltersFromBands(context, this.rightEarBands);
        this.nodes.rightFilters = rightFilters;
        
        // Apply gain and balance
        this.applyBalance();
        
        // Connect everything in sequence
        mediaSource.connect(splitter);
        
        // Left channel
        splitter.connect(leftFilters[0], 0);
        // Connect filters in sequence
        for (let i = 0; i < leftFilters.length - 1; i++) {
          leftFilters[i].connect(leftFilters[i + 1]);
        }
        // Connect last filter to gain
        leftFilters[leftFilters.length - 1].connect(leftGain);
        leftGain.connect(merger, 0, 0);
        
        // Right channel
        splitter.connect(rightFilters[0], 1);
        // Connect filters in sequence
        for (let i = 0; i < rightFilters.length - 1; i++) {
          rightFilters[i].connect(rightFilters[i + 1]);
        }
        // Connect last filter to gain
        rightFilters[rightFilters.length - 1].connect(rightGain);
        rightGain.connect(merger, 0, 1);
        
        // Connect merger to destination
        merger.connect(context.destination);
        
        // Apply EQ settings
        this.applyEQSettings();
        
        console.log("Split ear mode setup complete");
      } else {
        // UNIFIED MODE SETUP
        console.log("Setting up unified mode");
        
        // Create filters
        const filters = this.createFiltersFromBands(context, this.unifiedBands);
        this.nodes.filters = filters;
        
        // Create splitter for balance control
        const splitter = context.createChannelSplitter(2);
        this.nodes.splitter = splitter;
        
        // Create merger
        const merger = context.createChannelMerger(2);
        this.nodes.merger = merger;
        
        // Create gain nodes for balance
        const leftGain = context.createGain();
        const rightGain = context.createGain();
        this.nodes.leftGain = leftGain;
        this.nodes.rightGain = rightGain;
        
        // Apply gain and balance
        this.applyBalance();
        
        // Connect nodes: Source -> Filters -> Splitter -> Gains -> Merger -> Destination
        if (this.eqEnabled) {
          mediaSource.connect(filters[0]);
          
          // Connect filters in sequence
          for (let i = 0; i < filters.length - 1; i++) {
            filters[i].connect(filters[i + 1]);
          }
          
          // Split for balance control
          filters[filters.length - 1].connect(splitter);
        } else {
          // Skip filters if EQ is disabled
          mediaSource.connect(splitter);
        }
        
        splitter.connect(leftGain, 0);
        splitter.connect(rightGain, 1);
        leftGain.connect(merger, 0, 0);
        rightGain.connect(merger, 0, 1);
        merger.connect(context.destination);
        
        // Apply EQ settings
        this.applyEQSettings();
        
        console.log("Unified mode setup complete");
      }
      } else {
        console.log("Updating audio parameters without rebuilding graph");
      
        // Update balance
        this.applyBalance();
        
        // Update EQ settings
        this.applyEQSettings();
      }
      
      return true;
    } catch (error) {
      console.error("Error in updateAudioRouting:", error);
      
      // Fallback: direct connection if routing fails
      try {
        if (this.nodes.source && this.nodes.context) {
          this.nodes.source.disconnect();
          this.nodes.source.connect(this.nodes.context.destination);
          console.log("Fallback connection established");
        }
      } catch (e) {
        console.error("Fallback connection failed:", e);
      }
      
      return false;
    }
  }

  /**
   * Create filter nodes from frequency bands
   */
  private createFiltersFromBands(
    context: AudioContext, 
    bands: FrequencyBand[]
  ): BiquadFilterNode[] {
    return bands.map(band => {
      const filter = context.createBiquadFilter();
      filter.type = "peaking";
      filter.frequency.value = band.frequency;
      filter.gain.value = this.eqEnabled ? band.gain : 0;
      filter.Q.value = band.Q;
      return filter;
    });
  }

  /**
   * Apply balance setting to gain nodes
   */
  private applyBalance(): void {
    if (!this.nodes.leftGain || !this.nodes.rightGain) return;
    
    // Calculate balance (0 = full left, 1 = full right, 0.5 = center)
    let leftGain = this.balance <= 0.5 ? 
      1 : 1 - (this.balance - 0.5) * 2;
    
    let rightGain = this.balance >= 0.5 ? 
      1 : this.balance * 2;
    
    // REMOVED: The code that was setting gain to 0 based on ear enabled state
    // if (this.splitEarMode) {
    //   if (!this.leftEarEnabled) leftGain = 0;
    //   if (!this.rightEarEnabled) rightGain = 0;
    // }
    
    // Apply gain values
    this.nodes.leftGain.gain.value = leftGain;
    this.nodes.rightGain.gain.value = rightGain;
    
    // Apply solo mode if active
    if (this.soloMode === 'left') {
      this.nodes.rightGain.gain.value = 0;
    } else if (this.soloMode === 'right') {
      this.nodes.leftGain.gain.value = 0;
    }
    
    // console.log("Balance applied", 
                // "Left gain:", this.nodes.leftGain.gain.value, 
                // "Right gain:", this.nodes.rightGain.gain.value);
  }

  /**
   * Apply current EQ settings to all filters
   */
  private applyEQSettings(): void {
    if (this.splitEarMode) {
      // Apply to left ear filters
      this.applyBandsToFilters(
        this.leftEarBands, 
        this.nodes.leftFilters, 
        this.eqEnabled && this.leftEarEnabled
      );
      
      // Apply to right ear filters
      this.applyBandsToFilters(
        this.rightEarBands, 
        this.nodes.rightFilters,
        this.eqEnabled && this.rightEarEnabled
      );
    } else {
      // Apply to unified filters
      this.applyBandsToFilters(
        this.unifiedBands, 
        this.nodes.filters,
        this.eqEnabled
      );
    }
  }

  /**
   * Apply band settings to filter nodes
   */
  private applyBandsToFilters(
    bands: FrequencyBand[], 
    filters: BiquadFilterNode[],
    enabled: boolean
  ): void {
    // Get current time from audio context for scheduling parameter changes
    const currentTime = this.nodes.context?.currentTime || 0;
    // Set a short ramp time for smoother transitions (50ms)
    const rampTime = 0.05; 
  
    bands.forEach((band, index) => {
      if (index < filters.length) {
        const filter = filters[index];
        
        // Apply gain change with a smooth ramp
        const targetGain = enabled ? band.gain : 0;
        filter.gain.cancelScheduledValues(currentTime);
        filter.gain.setValueAtTime(filter.gain.value, currentTime);
        filter.gain.linearRampToValueAtTime(targetGain, currentTime + rampTime);
        
        // Apply frequency change with a smooth ramp
        filter.frequency.cancelScheduledValues(currentTime);
        filter.frequency.setValueAtTime(filter.frequency.value, currentTime);
        filter.frequency.exponentialRampToValueAtTime(
          Math.max(20, band.frequency), // Ensure frequency isn't too low for exponential ramp
          currentTime + rampTime
        );
        
        // Apply Q change with a smooth ramp
        filter.Q.cancelScheduledValues(currentTime);
        filter.Q.setValueAtTime(filter.Q.value, currentTime);
        filter.Q.linearRampToValueAtTime(band.Q, currentTime + rampTime);
      }
    });
  }

  /**
 * Approximate frequency response from bands when WebAudio API is not available
 */
private approximateResponse(
  frequencies: Float32Array,
  magnitudes: Float32Array,
  bands: FrequencyBand[]
): void {
  // For each frequency point
  for (let i = 0; i < frequencies.length; i++) {
    const freq = frequencies[i];
    let totalGain = 0;
    
    // Sum the contribution of each band
    for (const band of bands) {
      // Simple approximation of a peaking filter response
      const normalizedFreq = Math.log(freq / band.frequency);
      const response = band.gain * Math.exp(-normalizedFreq * normalizedFreq * band.Q);
      totalGain += response;
    }
    
    // Apply the total gain
    magnitudes[i] = this.eqEnabled ? totalGain : 0;
  }
}

  /**
   * Set whether EQ is enabled
   */
  public setEQEnabled(enabled: boolean): void {
    this.eqEnabled = enabled;
    this.applyEQSettings();
    
    // For unified mode, we need to rewire when toggling EQ
    if (!this.splitEarMode) {
      this.updateAudioRouting();
    }
  }

  /**
   * Set unified mode EQ bands
   */
  public setUnifiedBands(bands: FrequencyBand[]): void {
    this.unifiedBands = [...bands];
    if (!this.splitEarMode) {
      this.applyBandsToFilters(
        this.unifiedBands, 
        this.nodes.filters,
        this.eqEnabled
      );
    }
  }

  /**
   * Set left ear EQ bands
   */
  public setLeftEarBands(bands: FrequencyBand[]): void {
    this.leftEarBands = [...bands];
    if (this.splitEarMode) {
      this.applyBandsToFilters(
        this.leftEarBands, 
        this.nodes.leftFilters,
        this.eqEnabled && this.leftEarEnabled
      );
    }
  }

  /**
   * Set right ear EQ bands
   */
  public setRightEarBands(bands: FrequencyBand[]): void {
    this.rightEarBands = [...bands];
    if (this.splitEarMode) {
      this.applyBandsToFilters(
        this.rightEarBands, 
        this.nodes.rightFilters,
        this.eqEnabled && this.rightEarEnabled
      );
    }
  }

  /**
   * Set split ear mode
   */
  public setSplitEarMode(enabled: boolean): void {
    if (this.splitEarMode !== enabled) {
      this.splitEarMode = enabled;
      this.updateAudioRouting();
    }
  }

  /**
   * Set individual ear enabled states
   */
  public setLeftEarEnabled(enabled: boolean): void {
    this.leftEarEnabled = enabled;
    if (this.splitEarMode) {
      this.applyBandsToFilters(
        this.leftEarBands, 
        this.nodes.leftFilters,
        this.eqEnabled && enabled
      );
      this.applyBalance();
    }
  }
  
  public setRightEarEnabled(enabled: boolean): void {
    this.rightEarEnabled = enabled;
    if (this.splitEarMode) {
      this.applyBandsToFilters(
        this.rightEarBands, 
        this.nodes.rightFilters,
        this.eqEnabled && enabled
      );
      this.applyBalance();
    }
  }

  /**
   * Set balance between left and right channels
   */
  public setBalance(balance: number): void {
    this.balance = balance;
    this.applyBalance();
  }

  /**
   * Set channel mode (stereo/mono)
   */
  public setChannelMode(mode: ChannelMode): void {
    this.channelMode = mode;
    // Implementation would require additional audio processing
    console.log("Channel mode set to", mode);
  }

  /**
   * Set solo mode (none/left/right)
   */
  public setSoloMode(mode: SoloMode): void {
    this.soloMode = mode;
    this.applyBalance();
  }

  /**
   * Apply a preset to unified mode
   */
  public applyUnifiedPreset(preset: Preset): void {
    this.unifiedBands = [...preset.bands];
    if (!this.splitEarMode) {
      this.applyBandsToFilters(
        this.unifiedBands, 
        this.nodes.filters,
        this.eqEnabled
      );
    }
  }

  /**
   * Apply a preset to left ear
   */
  public applyLeftEarPreset(preset: Preset): void {
    this.leftEarBands = [...preset.bands];
    if (this.splitEarMode) {
      this.applyBandsToFilters(
        this.leftEarBands, 
        this.nodes.leftFilters,
        this.eqEnabled && this.leftEarEnabled
      );
    }
  }

  /**
   * Apply a preset to right ear
   */
  public applyRightEarPreset(preset: Preset): void {
    this.rightEarBands = [...preset.bands];
    if (this.splitEarMode) {
      this.applyBandsToFilters(
        this.rightEarBands, 
        this.nodes.rightFilters,
        this.eqEnabled && this.rightEarEnabled
      );
    }
  }

  /**
   * Update split ear configuration
   */
  public updateSplitEarConfig(config: SplitEarConfig): void {
    this.balance = config.balance;
    this.applyBalance();
  }

  /**
   * Clean up and dispose audio engine
   */
  public dispose(): void {
    this.cleanupContext();
  }

  /**
   * Get current frequency response data for visualization
   */
  public getFrequencyResponse(numPoints = 200): {
    frequencies: Float32Array, 
    leftMagnitudes: Float32Array, 
    rightMagnitudes: Float32Array
  } {
    const frequencies = new Float32Array(numPoints);
    const leftMagnitudes = new Float32Array(numPoints);
    const rightMagnitudes = new Float32Array(numPoints);
    
    // Initialize with logarithmic frequency scale (20Hz to 20kHz)
    for (let i = 0; i < numPoints; i++) {
      frequencies[i] = 20 * Math.pow(10, i / numPoints * 3);
    }
    
    // Initialize response arrays with neutral values
    leftMagnitudes.fill(0);
    rightMagnitudes.fill(0);
    
    // If the audio context isn't fully initialized yet, return smooth approximated curves
    if (!this.nodes.context || 
        !this.nodes.filters.length || 
        (this.splitEarMode && 
        (!this.nodes.leftFilters.length || !this.nodes.rightFilters.length))) {
      
      // Generate approximated response based on band settings
      if (this.splitEarMode) {
        this.approximateResponse(frequencies, leftMagnitudes, this.leftEarBands);
        this.approximateResponse(frequencies, rightMagnitudes, this.rightEarBands);
      } else {
        this.approximateResponse(frequencies, leftMagnitudes, this.unifiedBands);
        // Copy left channel response to right for unified mode
        for (let i = 0; i < numPoints; i++) {
          rightMagnitudes[i] = leftMagnitudes[i];
        }
      }
      
      return { frequencies, leftMagnitudes, rightMagnitudes };
    }
    
    if (this.splitEarMode) {
      if (this.nodes.leftFilters.length > 0) {
        // Combine frequency responses from all filters
        const tempMags = new Float32Array(numPoints);
        tempMags.fill(1); // Start with unity gain
        
        this.nodes.leftFilters.forEach(filter => {
          const mags = new Float32Array(numPoints);
          const phases = new Float32Array(numPoints);
          filter.getFrequencyResponse(frequencies, mags, phases);
          
          // Combine with previous filters (multiply magnitudes)
          for (let i = 0; i < numPoints; i++) {
            tempMags[i] *= mags[i];
          }
        });
        
        // Convert to dB
        for (let i = 0; i < numPoints; i++) {
          leftMagnitudes[i] = 20 * Math.log10(tempMags[i]);
        }
        
        // Apply left ear enabled state
        if (!this.leftEarEnabled) {
          leftMagnitudes.fill(0);
        }
      }
      
      if (this.nodes.rightFilters.length > 0) {
        // Combine frequency responses from all filters
        const tempMags = new Float32Array(numPoints);
        tempMags.fill(1); // Start with unity gain
        
        this.nodes.rightFilters.forEach(filter => {
          const mags = new Float32Array(numPoints);
          const phases = new Float32Array(numPoints);
          filter.getFrequencyResponse(frequencies, mags, phases);
          
          // Combine with previous filters (multiply magnitudes)
          for (let i = 0; i < numPoints; i++) {
            tempMags[i] *= mags[i];
          }
        });
        
        // Convert to dB
        for (let i = 0; i < numPoints; i++) {
          rightMagnitudes[i] = 20 * Math.log10(tempMags[i]);
        }
        
        // Apply right ear enabled state
        if (!this.rightEarEnabled) {
          rightMagnitudes.fill(0);
        }
      }
    } else {
      if (this.nodes.filters.length > 0) {
        // Combine frequency responses from all filters
        const tempMags = new Float32Array(numPoints);
        tempMags.fill(1); // Start with unity gain
        
        this.nodes.filters.forEach(filter => {
          const mags = new Float32Array(numPoints);
          const phases = new Float32Array(numPoints);
          filter.getFrequencyResponse(frequencies, mags, phases);
          
          // Combine with previous filters (multiply magnitudes)
          for (let i = 0; i < numPoints; i++) {
            tempMags[i] *= mags[i];
          }
        });
        
        // Convert to dB and copy to both channels for unified mode
        for (let i = 0; i < numPoints; i++) {
          leftMagnitudes[i] = 20 * Math.log10(tempMags[i]);
          rightMagnitudes[i] = leftMagnitudes[i];
        }
        
        // Apply EQ enabled state
        if (!this.eqEnabled) {
          leftMagnitudes.fill(0);
          rightMagnitudes.fill(0);
        }
      }
    }
    
    return { frequencies, leftMagnitudes, rightMagnitudes };
  }
}


export default AudioEngine;

