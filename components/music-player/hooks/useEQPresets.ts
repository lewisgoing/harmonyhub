import { useState, useEffect, useRef } from 'react';
import { Preset, UserPreset, PresetType, FrequencyBand } from '../types';
import { DEFAULT_PRESETS, STORAGE_KEYS, DEFAULT_FREQUENCY_BANDS } from '../constants';
import { useAuth } from '@/hooks/useAuth';
import { getUserPresets, saveUserPreset as saveCloudPreset, deleteUserPreset as deleteCloudPreset } from '@/lib/firestore';

interface UseEQPresetsReturn {
  presets: Record<string, Preset>;
  userPresets: Record<string, UserPreset>;
  saveUserPreset: (preset: UserPreset) => Promise<void>;
  deleteUserPreset: (presetId: string) => Promise<void>;
  getPresetById: (id: string) => Preset | undefined;
  createCustomPreset: (
    name: string,
    bands: FrequencyBand[],
    tinnitusCenterFreq?: number
  ) => UserPreset;
  isLoading: boolean;
}

/**
 * Custom hook for managing EQ presets, combining local and cloud storage
 */
export function useEQPresets(): UseEQPresetsReturn {
  // Built-in presets never change
  const [presets] = useState<Record<string, Preset>>(DEFAULT_PRESETS);
  
  // User presets can be created, modified, and deleted
  const [userPresets, setUserPresets] = useState<Record<string, UserPreset>>({});
  
  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  
  // Get auth state for cloud sync
  const { user } = useAuth();
  
  // Use ref to prevent multiple loads
  const hasLoadedLocalRef = useRef(false);
  const isLoadingCloudRef = useRef(false);

  // First load local presets immediately (only once)
  useEffect(() => {
    if (!hasLoadedLocalRef.current) {
      try {
        const savedPresetsJSON = localStorage.getItem(STORAGE_KEYS.USER_PRESETS);
        if (savedPresetsJSON) {
          const localPresets = JSON.parse(savedPresetsJSON);
          console.log('Loaded local presets:', Object.keys(localPresets).length);
          setUserPresets(localPresets);
        }
      } catch (error) {
        console.error('Failed to load local user presets:', error);
      } finally {
        hasLoadedLocalRef.current = true;
      }
    }
  }, []);

// Add this at the beginning of the useEQPresets hook
const loadingCloudRef = useRef(false);
const loadAttempts = useRef(0);
const MAX_LOAD_ATTEMPTS = 3;

// Then update the cloud loading effect:
useEffect(() => {
  const loadCloudPresets = async () => {
    // Skip if already loading, no user, or too many attempts
    if (loadingCloudRef.current || !user || loadAttempts.current >= MAX_LOAD_ATTEMPTS) return;
    
    loadingCloudRef.current = true;
    loadAttempts.current++;
    setIsLoading(true);
    
    try {
      console.log('Loading cloud presets for user:', user.uid);
      const cloudPresets = await getUserPresets(user.uid);
      console.log('Loaded cloud presets:', Object.keys(cloudPresets).length);
      
      // Get current local presets for merging
      let currentPresets = { ...userPresets };
      
      // Merge local and cloud presets, with cloud taking precedence
      const mergedPresets = {
        ...currentPresets,
        ...cloudPresets
      };
      
      setUserPresets(mergedPresets);
      
      // Also save merged presets back to localStorage for offline access
      localStorage.setItem(STORAGE_KEYS.USER_PRESETS, JSON.stringify(mergedPresets));
    } catch (error) {
      console.error('Failed to load cloud presets:', error);
      // Don't retry on permission errors
      if (error.code === 'permission-denied' || error.message.includes('permissions')) {
        loadAttempts.current = MAX_LOAD_ATTEMPTS; // Stop retrying
      }
    } finally {
      setIsLoading(false);
      loadingCloudRef.current = false;
    }
  };
  
  if (user) {
    // Add a small delay to prevent immediate loading
    const timer = setTimeout(() => {
      loadCloudPresets();
    }, 500);
    
    return () => clearTimeout(timer);
  }
}, [user]);

  /**
   * Save or update a user preset to both local storage and cloud (if signed in)
   */
  const saveUserPreset = async (preset: UserPreset) => {
    // Update local state
    setUserPresets(prev => ({
      ...prev,
      [preset.id]: preset
    }));
    
    // Save to localStorage
    try {
      const updatedPresets = {
        ...userPresets,
        [preset.id]: preset
      };
      localStorage.setItem(STORAGE_KEYS.USER_PRESETS, JSON.stringify(updatedPresets));
    } catch (error) {
      console.error('Failed to save preset to localStorage:', error);
    }
    
    // Save to cloud if user is signed in
    if (user) {
      try {
        console.log('Saving preset to cloud:', preset.id);
        await saveCloudPreset(preset, user.uid);
        console.log('Preset saved to cloud successfully');
      } catch (error) {
        console.error('Failed to save preset to cloud:', error);
      }
    }
  };

  /**
   * Delete a user preset from both local storage and cloud
   */
  const deleteUserPreset = async (presetId: string) => {
    // Update local state
    setUserPresets(prev => {
      const newPresets = { ...prev };
      delete newPresets[presetId];
      return newPresets;
    });
    
    // Remove from localStorage
    try {
      const updatedPresets = { ...userPresets };
      delete updatedPresets[presetId];
      localStorage.setItem(STORAGE_KEYS.USER_PRESETS, JSON.stringify(updatedPresets));
    } catch (error) {
      console.error('Failed to delete preset from localStorage:', error);
    }
    
    // Delete from cloud if user is signed in
    if (user) {
      try {
        await deleteCloudPreset(presetId);
        console.log('Preset deleted from cloud:', presetId);
      } catch (error) {
        console.error('Failed to delete preset from cloud:', error);
      }
    }
  };

  /**
   * Get a preset by ID (from either built-in or user presets)
   */
  const getPresetById = (id: string): Preset | undefined => {
    if (id in presets) {
      return presets[id];
    }
    
    if (id in userPresets) {
      return userPresets[id];
    }
    
    return undefined;
  };

  /**
   * Create a new custom user preset
   */
  const createCustomPreset = (
    name: string,
    bands: FrequencyBand[] = [...DEFAULT_FREQUENCY_BANDS],
    tinnitusCenterFreq?: number
  ): UserPreset => {
    // Generate a unique ID
    const id = `custom-${Date.now()}`;
    
    const newPreset: UserPreset = {
      id,
      name,
      description: 'Custom user preset',
      color: {
        active: { bg: "#0EA5E9", text: "white" },
        inactive: { bg: "#E0F2FE", text: "#0369A1" }
      },
      bands,
      dateCreated: new Date().toISOString(),
      tinnitusCenterFreq
    };
    
    // Save the new preset (async)
    saveUserPreset(newPreset);
    
    return newPreset;
  };

  return {
    presets,
    userPresets,
    saveUserPreset,
    deleteUserPreset,
    getPresetById,
    createCustomPreset,
    isLoading
  };
}

export default useEQPresets;