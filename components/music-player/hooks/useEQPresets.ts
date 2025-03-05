import { useState, useEffect, useRef } from 'react';
import { Preset, UserPreset, PresetType, FrequencyBand } from '../types';
import { DEFAULT_PRESETS, STORAGE_KEYS, DEFAULT_FREQUENCY_BANDS } from '../constants';
import { useAuth } from '@/hooks/useAuth';
import { getUserPresets, saveUserPreset as saveCloudPreset, deleteUserPreset as deleteCloudPreset } from '@/lib/firestore';
import { useToast } from '@/components/ui/use-toast';

interface UseEQPresetsReturn {
  presets: Record<string, Preset>;
  userPresets: Record<string, UserPreset>;
  saveUserPreset: (preset: UserPreset, callback?: () => void) => Promise<void>;
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
  
  // Pending save operations
  const pendingSaveRef = useRef<{preset: UserPreset, callback?: () => void} | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track loading states
  const hasLoadedLocalRef = useRef(false);
  const isLoadingCloudRef = useRef(false);
  const loadAttempts = useRef(0);
  const MAX_LOAD_ATTEMPTS = 3;
  
  // Get auth state for cloud sync
  const { user } = useAuth();
  const { toast } = useToast();

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
  
  // Second, ensure we only overwrite local presets with cloud ones if the user is logged in
  useEffect(() => {
    const loadCloudPresets = async () => {
      // Skip if already loading, no user, or too many attempts
      if (isLoadingCloudRef.current || !user || loadAttempts.current >= MAX_LOAD_ATTEMPTS) return;
      
      isLoadingCloudRef.current = true;
      loadAttempts.current++;
      setIsLoading(true);
      
      try {
        console.log('Loading cloud presets for user:', user.uid);
        const cloudPresets = await getUserPresets(user.uid);
        
        if (Object.keys(cloudPresets).length > 0) {
          console.log('Loaded cloud presets:', Object.keys(cloudPresets).length);
          
          // When logged in, use cloud presets directly
          setUserPresets(cloudPresets);
          
          // Store cloud presets in localStorage for offline access
          localStorage.setItem(STORAGE_KEYS.USER_PRESETS, JSON.stringify(cloudPresets));
          
          toast({
            title: "Cloud presets loaded",
            description: `${Object.keys(cloudPresets).length} presets loaded from your account`,
          });
        } else {
          console.log('No cloud presets found');
          
          // If no cloud presets, sync local presets to cloud
          const localPresets = { ...userPresets };
          
          // Only sync if we have local presets
          if (Object.keys(localPresets).length > 0) {
            console.log('Syncing local presets to cloud:', Object.keys(localPresets).length);
            
            // Save each local preset to cloud
            for (const preset of Object.values(localPresets)) {
              await saveCloudPreset(preset, user.uid);
            }
            
            toast({
              title: "Presets synced to cloud",
              description: `${Object.keys(localPresets).length} presets synced to your account`,
            });
          }
        }
      } catch (error) {
        console.error('Failed to load cloud presets:', error);
      } finally {
        setIsLoading(false);
        isLoadingCloudRef.current = false;
      }
    };
    
    if (user) {
      // Add a small delay to prevent immediate loading
      const timer = setTimeout(() => {
        loadCloudPresets();
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      // When logged out, reset loading attempts
      loadAttempts.current = 0;
      
      // When logged out, ALWAYS show local presets, not cloud presets
      try {
        const savedPresetsJSON = localStorage.getItem(STORAGE_KEYS.USER_PRESETS);
        if (savedPresetsJSON) {
          const localPresets = JSON.parse(savedPresetsJSON);
          setUserPresets(localPresets);
        }
      } catch (error) {
        console.error('Failed to load local user presets:', error);
      }
    }
  }, [user, toast]);

  /**
   * Save a user preset to both local storage and cloud if logged in
   */
  const saveUserPreset = async (preset: UserPreset, callback?: () => void) => {
    // Cancel any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    
    // Check if we already have this preset with the exact same content
    const existingPreset = userPresets[preset.id];
    const hasChanged = !existingPreset || 
      JSON.stringify(existingPreset.bands) !== JSON.stringify(preset.bands) ||
      existingPreset.name !== preset.name ||
      existingPreset.description !== preset.description;
    
    if (!hasChanged) {
      console.log('Skipping save - preset has not changed:', preset.id);
      callback?.();
      return;
    }
    
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
        await saveCloudPreset(preset, user.uid);
        console.log('Preset saved to cloud successfully');
      } catch (error) {
        console.error('Failed to save preset to cloud:', error);
        toast({
          title: "Cloud sync failed",
          description: "Your preset was saved locally but couldn't be synced to the cloud.",
          variant: "destructive",
        });
      }
    }
    
    callback?.();
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
        toast({
          title: "Cloud sync failed",
          description: "Your preset was deleted locally but couldn't be deleted from the cloud.",
          variant: "destructive",
        });
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
   * Create a new custom user preset with improved ID generation
   */
  const createCustomPreset = (
    name: string,
    bands: FrequencyBand[] = [...DEFAULT_FREQUENCY_BANDS],
    tinnitusCenterFreq?: number,
    description: string = 'Custom user preset'
  ): UserPreset => {
    // Generate a unique ID that includes a timestamp AND a random string
    // to ensure no duplicates even if created at the exact same millisecond
    const randomStr = Math.random().toString(36).substring(2, 10);
    const id = `custom-${Date.now()}-${randomStr}`;
    
    const newPreset: UserPreset = {
      id,
      name,
      description,
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