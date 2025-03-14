import { AudioNodes, FrequencyBand, ChannelMode, SoloMode, SplitEarConfig, Preset } from './types';
import { DEFAULT_FREQUENCY_BANDS } from './constants';

/**
 * AudioEngine class handles all interactions with the Web Audio API
 * with improved memory management and performance optimizations
 */
export class AudioEngine {
  private debounceTimers: Record<string, number> = {};
  private audioElement: HTMLAudioElement | null = null;
  
  // Track node creation to prevent redundancy
  private isInitialized = false;
  private nodesInitialized = false;
  
  // Add cache properties
  private cacheInvalidated = true;
  private lastResponseCache: {
    frequencies: Float32Array, 
    leftMagnitudes: Float32Array, 
    rightMagnitudes: Float32Array
  } | null = null;
  
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

  // Track route rebuilding status
  private isRebuildingRoute = false;
  private pendingStateChanges: Array<() => void> = [];

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
      if (this.isInitialized) {
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
      
      this.isInitialized = true;
      this.nodesInitialized = false;
      console.log("Audio context initialized successfully");
      
      // Set up initial audio routing
      await this.updateAudioRouting();
      
      // Invalidate cache to ensure fresh frequency response
      this.cacheInvalidated = true;
      
      return true;
    } catch (error) {
      console.error("Failed to initialize audio context:", error);
      return false;
    }
  }

  /**
   * Ensure the audio context is resumed and ready
   */
  public async ensureAudioContextReady(): Promise<boolean> {
    if (!this.nodes.context) {
      console.error("No audio context to resume");
      return false;
    }
    
    if (this.nodes.context.state === 'suspended') {
      try {
        console.log("Resuming suspended audio context");
        await this.nodes.context.resume();
        console.log("Audio context resumed successfully");
        
        // Force a fresh frequency response
        this.cacheInvalidated = true;
        
        return true;
      } catch (error) {
        console.error("Failed to resume audio context:", error);
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Refresh the frequency response data (useful after context state changes)
   */
  public refreshFrequencyResponse(): {
    frequencies: Float32Array, 
    leftMagnitudes: Float32Array, 
    rightMagnitudes: Float32Array
  } | undefined {
    // Always mark cache as invalid to force refresh
    this.cacheInvalidated = true;
    
    // Check if audio context is ready
    if (!this.nodes.context || 
        this.nodes.context.state === 'suspended') {
      console.log("Audio context not ready, attempting to resume");
      
      // Try to resume context if suspended
      if (this.nodes.context?.state === 'suspended') {
        this.nodes.context.resume().catch(err => {
          console.warn("Failed to resume audio context:", err);
        });
      }
      
      // Return approximated response if context isn't ready
      const numPoints = 200;
      const frequencies = new Float32Array(numPoints);
      const leftMagnitudes = new Float32Array(numPoints);
      const rightMagnitudes = new Float32Array(numPoints);
      
      // Initialize with logarithmic frequency scale (20Hz to 20kHz)
      for (let i = 0; i < numPoints; i++) {
        frequencies[i] = 20 * Math.pow(10, i / numPoints * 3);
      }
      
      // Generate approximated response
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
      
      // Cache and return this approximated response
      this.lastResponseCache = { frequencies, leftMagnitudes, rightMagnitudes };
      this.cacheInvalidated = false;
      
      return { frequencies, leftMagnitudes, rightMagnitudes };
    }
    
    // Return fresh frequency response data
    return this.getFrequencyResponse();
  }

  /**
   * Clean up and close existing audio context
   */
  private async cleanupContext(): Promise<void> {
    if (this.nodes.context) {
      try {
        // Disconnect all nodes in a controlled manner
        this.disconnectAllNodes();
        
        // Close the context
        await this.nodes.context.close();
        console.log("Audio context closed");
        
        // Reset node references
        this.resetNodeReferences();
        
        this.isInitialized = false;
        this.nodesInitialized = false;
      } catch (e) {
        console.error("Error closing audio context:", e);
      }
    }
  }

  /**
   * Disconnect all audio nodes safely
   */
  private disconnectAllNodes(): void {
    try {
      // Disconnect source if it exists
      if (this.nodes.source) {
        try {
          this.nodes.source.disconnect();
        } catch (e) {
          console.warn("Error disconnecting source:", e);
        }
      }
      
      // Disconnect all filter nodes
      const disconnectFilters = (filters: BiquadFilterNode[]) => {
        filters.forEach(filter => {
          try {
            filter.disconnect();
          } catch (e) {
            // Ignore disconnection errors
          }
        });
      };
      
      disconnectFilters(this.nodes.filters);
      disconnectFilters(this.nodes.leftFilters);
      disconnectFilters(this.nodes.rightFilters);
      
      // Disconnect channel nodes
      [this.nodes.splitter, this.nodes.merger, this.nodes.leftGain, this.nodes.rightGain].forEach(node => {
        if (node) {
          try {
            node.disconnect();
          } catch (e) {
            // Ignore disconnection errors
          }
        }
      });
    } catch (e) {
      console.warn("Error during node disconnection:", e);
    }
  }

  /**
   * Reset all node references
   */
  private resetNodeReferences(): void {
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
  }

  /**
   * Update audio routing based on current settings
   */
  public async updateAudioRouting(): Promise<boolean> {
    // If already rebuilding, queue this request
    if (this.isRebuildingRoute) {
      return new Promise((resolve) => {
        this.pendingStateChanges.push(() => {
          resolve(true);
        });
      });
    }
    
    this.isRebuildingRoute = true;
    
    try {
      // First ensure audio context is ready
      await this.ensureAudioContextReady();
      
      if (!this.nodes.context || !this.nodes.source) {
        console.log("Cannot update audio routing - missing context or source");
        this.isRebuildingRoute = false;
        return false;
      }
      
      const context = this.nodes.context;
      const mediaSource = this.nodes.source;
  
      const needsRebuild = (
        // If this is our first run
        !this.nodesInitialized ||
        // If we're switching modes, we need to rebuild
        (this.splitEarMode && this.nodes.filters.length > 0 && this.nodes.leftFilters.length === 0) ||
        (!this.splitEarMode && this.nodes.leftFilters.length > 0 && this.nodes.filters.length === 0) ||
        // If any required nodes are missing
        !this.nodes.splitter || !this.nodes.merger || !this.nodes.leftGain || !this.nodes.rightGain
      );
  
      if (needsRebuild) {
        // Full rebuild needed - disconnect everything
        this.disconnectAllNodes();
        
        console.log("Rebuilding audio routing", 
                    "Mode:", this.splitEarMode ? "split" : "unified");
        
        if (this.splitEarMode) {
          await this.setupSplitEarMode(context, mediaSource);
        } else {
          await this.setupUnifiedMode(context, mediaSource);
        }
        
        this.nodesInitialized = true;
      } else {
        console.log("Updating audio parameters without rebuilding graph");
      
        // Update balance
        this.applyBalance();
        
        // Update EQ settings
        this.applyEQSettings();
      }
      
      // Force frequency response update
      this.cacheInvalidated = true;
      
      // Add debug output to help diagnose remaining issues
      this.debugFilterSettings();
      
      this.isRebuildingRoute = false;
      
      // Process any pending state changes
      this.processPendingStateChanges();
      
      return true;
    } catch (error) {
      console.error("Error in updateAudioRouting:", error);
      
      // Fallback: direct connection if routing fails
      try {
        if (this.nodes.source && this.nodes.context) {
          this.disconnectAllNodes();
          this.nodes.source.connect(this.nodes.context.destination);
          console.log("Fallback connection established");
        }
      } catch (e) {
        console.error("Fallback connection failed:", e);
      }
      
      this.isRebuildingRoute = false;
      return false;
    }
  }

  /**
   * Process any pending state changes
   */
  private processPendingStateChanges(): void {
    // Execute all pending callbacks
    while (this.pendingStateChanges.length > 0) {
      const callback = this.pendingStateChanges.shift();
      if (callback) callback();
    }
  }

  /**
   * Setup split ear mode audio routing
   */
  private async setupSplitEarMode(context: AudioContext, mediaSource: MediaElementAudioSourceNode): Promise<void> {
    console.log("Setting up split ear mode");
    
    // 1. Create all nodes first before connecting
    const splitter = context.createChannelSplitter(2);
    const merger = context.createChannelMerger(2);
    const leftGain = context.createGain();
    const rightGain = context.createGain();
    
    // 2. Create filter chains with consistent parameters
    const leftFilters = this.createFiltersFromBands(context, this.leftEarBands);
    const rightFilters = this.createFiltersFromBands(context, this.rightEarBands);
    
    // 3. Store references to all nodes
    this.nodes.splitter = splitter;
    this.nodes.merger = merger;
    this.nodes.leftGain = leftGain;
    this.nodes.rightGain = rightGain;
    this.nodes.leftFilters = leftFilters;
    this.nodes.rightFilters = rightFilters;
    this.nodes.filters = []; // Clear unified filters
    
    // 4. Apply gain and balance
    this.applyBalance();
    
    // 5. Connect nodes in clear sequence
    // Source → Splitter
    mediaSource.connect(splitter);
    
    // Left channel: Splitter → Filters → Gain → Merger
    splitter.connect(leftFilters[0], 0); // Connect first filter to left channel
    for (let i = 0; i < leftFilters.length - 1; i++) {
      leftFilters[i].connect(leftFilters[i + 1]);
    }
    leftFilters[leftFilters.length - 1].connect(leftGain);
    leftGain.connect(merger, 0, 0);
    
    // Right channel: Splitter → Filters → Gain → Merger
    splitter.connect(rightFilters[0], 1); // Connect first filter to right channel
    for (let i = 0; i < rightFilters.length - 1; i++) {
      rightFilters[i].connect(rightFilters[i + 1]);
    }
    rightFilters[rightFilters.length - 1].connect(rightGain);
    rightGain.connect(merger, 0, 1);
    
    // Merger → Destination
    merger.connect(context.destination);
    
    // 6. Apply EQ settings after all connections are made
    this.applyEQSettings();
    
    console.log("Split ear mode setup complete");
  }

  /**
   * Setup unified mode audio routing
   */
  private async setupUnifiedMode(context: AudioContext, mediaSource: MediaElementAudioSourceNode): Promise<void> {
    console.log("Setting up unified mode");
    
    // 1. Create all nodes first before connecting
    const filters = this.createFiltersFromBands(context, this.unifiedBands);
    const splitter = context.createChannelSplitter(2);
    const merger = context.createChannelMerger(2);
    const leftGain = context.createGain();
    const rightGain = context.createGain();
    
    // 2. Store references to all nodes
    this.nodes.filters = filters;
    this.nodes.splitter = splitter;
    this.nodes.merger = merger;
    this.nodes.leftGain = leftGain;
    this.nodes.rightGain = rightGain;
    this.nodes.leftFilters = []; // Clear split mode filters
    this.nodes.rightFilters = [];
    
    // 3. Apply gain and balance
    this.applyBalance();
    
    // 4. Connect nodes in clear sequence
    if (this.eqEnabled) {
      // Source → Filters → Splitter → Gains → Merger → Destination
      mediaSource.connect(filters[0]);
      
      // Connect filters in sequence
      for (let i = 0; i < filters.length - 1; i++) {
        filters[i].connect(filters[i + 1]);
      }
      
      // Last filter → Splitter
      filters[filters.length - 1].connect(splitter);
    } else {
      // Skip filters if EQ is disabled: Source → Splitter → Gains → Merger → Destination
      mediaSource.connect(splitter);
    }
    
    // Splitter → Gains → Merger
    splitter.connect(leftGain, 0);
    splitter.connect(rightGain, 1);
    leftGain.connect(merger, 0, 0);
    rightGain.connect(merger, 0, 1);
    
    // Merger → Destination
    merger.connect(context.destination);
    
    // 5. Apply EQ settings after all connections are made
    this.applyEQSettings();
    
    console.log("Unified mode setup complete");
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
    
    // Apply gain values
    this.nodes.leftGain.gain.value = leftGain;
    this.nodes.rightGain.gain.value = rightGain;
    
    // Apply solo mode if active
    if (this.soloMode === 'left') {
      this.nodes.rightGain.gain.value = 0;
    } else if (this.soloMode === 'right') {
      this.nodes.leftGain.gain.value = 0;
    }
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
    
    // Always invalidate cache when settings change
    this.cacheInvalidated = true;
  }

  /**
   * Apply band settings to filter nodes with improved performance
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
        
        // Only update if the gain has actually changed
        if (Math.abs(filter.gain.value - targetGain) > 0.01) {
          filter.gain.cancelScheduledValues(currentTime);
          filter.gain.setValueAtTime(filter.gain.value, currentTime);
          filter.gain.linearRampToValueAtTime(targetGain, currentTime + rampTime);
        }
        
        // Only update frequency if it's changed
        if (Math.abs(filter.frequency.value - band.frequency) > 0.1) {
          filter.frequency.cancelScheduledValues(currentTime);
          filter.frequency.setValueAtTime(filter.frequency.value, currentTime);
          filter.frequency.exponentialRampToValueAtTime(
            Math.max(20, band.frequency), // Ensure frequency isn't too low for exponential ramp
            currentTime + rampTime
          );
        }
        
        // Only update Q if it's changed
        if (Math.abs(filter.Q.value - band.Q) > 0.01) {
          filter.Q.cancelScheduledValues(currentTime);
          filter.Q.setValueAtTime(filter.Q.value, currentTime);
          filter.Q.linearRampToValueAtTime(band.Q, currentTime + rampTime);
        }
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
      
      // Sum the contribution of each band with improved approximation
      for (const band of bands) {
        // Improved calculation using log scaling for better representation
        const frequencyRatio = freq / band.frequency;
        const logRatio = Math.log2(frequencyRatio);
        
        // This formula better approximates the behavior of BiquadFilter
        // It uses the band's Q value properly
        const bandwidth = 1.0 / band.Q;
        const response = band.gain * Math.exp(-logRatio * logRatio / (2.0 * bandwidth * bandwidth));
        
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
    if (this.eqEnabled === enabled) return; // Skip if no change
    
    this.eqEnabled = enabled;
    this.applyEQSettings();
    
    // For unified mode, we need to rewire when toggling EQ
    if (!this.splitEarMode) {
      this.updateAudioRouting();
    }
    
    // Invalidate cache
    this.cacheInvalidated = true;
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
    
    // Invalidate cache
    this.cacheInvalidated = true;
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
    
    // Invalidate cache
    this.cacheInvalidated = true;
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
    
    // Invalidate cache
    this.cacheInvalidated = true;
  }

  /**
   * Set split ear mode
   */
  public setSplitEarMode(enabled: boolean): void {
    if (this.splitEarMode !== enabled) {
      this.splitEarMode = enabled;
      this.updateAudioRouting();
      
      // Invalidate cache
      this.cacheInvalidated = true;
    }
  }

  /**
   * Debug current filter settings to help diagnose issues
   */
  public debugFilterSettings(): void {
    console.log("%c === FILTER SETTINGS DEBUG ===", "color: blue; font-weight: bold");
    console.log("Mode:", this.splitEarMode ? "Split Ear" : "Unified");
    
    if (this.splitEarMode) {
      console.log("%c Left Ear Filters:", "color: blue");
      this.nodes.leftFilters.forEach((filter, i) => {
        console.log(`Filter ${i}:`, {
          frequency: filter.frequency.value.toFixed(1),
          gain: filter.gain.value.toFixed(1),
          Q: filter.Q.value.toFixed(2),
          type: filter.type
        });
      });
      
      console.log("%c Right Ear Filters:", "color: red");
      this.nodes.rightFilters.forEach((filter, i) => {
        console.log(`Filter ${i}:`, {
          frequency: filter.frequency.value.toFixed(1),
          gain: filter.gain.value.toFixed(1),
          Q: filter.Q.value.toFixed(2),
          type: filter.type
        });
      });
    } else {
      console.log("%c Unified Filters:", "color: orange");
      this.nodes.filters.forEach((filter, i) => {
        console.log(`Filter ${i}:`, {
          frequency: filter.frequency.value.toFixed(1),
          gain: filter.gain.value.toFixed(1),
          Q: filter.Q.value.toFixed(2),
          type: filter.type
        });
      });
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
    
    // Invalidate cache
    this.cacheInvalidated = true;
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
    
    // Invalidate cache
    this.cacheInvalidated = true;
  }

  /**
   * Set balance between left and right channels
   */
  public setBalance(balance: number): void {
    this.balance = balance;
    this.applyBalance();
    
    // Invalidate cache
    this.cacheInvalidated = true;
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
    
    // Invalidate cache
    this.cacheInvalidated = true;
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
    
    // Invalidate cache
    this.cacheInvalidated = true;
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
    
    // Invalidate cache
    this.cacheInvalidated = true;
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
    
    // Invalidate cache
    this.cacheInvalidated = true;
  }

  /**
   * Update split ear configuration
   */
  public updateSplitEarConfig(config: SplitEarConfig): void {
    this.balance = config.balance;
    this.applyBalance();
    
    // Invalidate cache
    this.cacheInvalidated = true;
  }

  /**
   * Clean up and dispose audio engine
   */
  public dispose(): void {
    this.cleanupContext();
  }

  /**
   * Check if the audio engine is initialized
   */
  public isEngineInitialized(): boolean {
    return this.isInitialized && this.nodesInitialized;
  }

  /**
   * Get current frequency response data for visualization with memoization
   */
  public getFrequencyResponse(numPoints = 200): {
    frequencies: Float32Array, 
    leftMagnitudes: Float32Array, 
    rightMagnitudes: Float32Array
  } {
    // Return cached response if valid and has the same number of points
    if (!this.cacheInvalidated && this.lastResponseCache && 
        this.lastResponseCache.frequencies.length === numPoints) {
      return this.lastResponseCache;
    }
    
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
    
    // If the audio context isn't fully initialized yet, return approximated curves
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
      
      // Cache this response
      this.lastResponseCache = { frequencies, leftMagnitudes, rightMagnitudes };
      this.cacheInvalidated = false;
      
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
    
    // Cache this response
    this.lastResponseCache = { frequencies, leftMagnitudes, rightMagnitudes };
    this.cacheInvalidated = false;
    
    return { frequencies, leftMagnitudes, rightMagnitudes };
  }
}

export default AudioEngine;