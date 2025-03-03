import { useState, useEffect } from 'react';
import { Preset, UserPreset, PresetType, FrequencyBand } from '../types';
import { DEFAULT_PRESETS, STORAGE_KEYS, DEFAULT_FREQUENCY_BANDS } from '../constants';

interface UseEQPresetsReturn {
  presets: Record<string, Preset>;
  userPresets: Record<string, UserPreset>;
  saveUserPreset: (preset: UserPreset) => void;
  deleteUserPreset: (presetId: string) => void;
  getPresetById: (id: string) => Preset | undefined;
  createCustomPreset: (
    name: string,
    bands: FrequencyBand[],
    tinnitusCenterFreq?: number
  ) => UserPreset;
}

/**
 * Custom hook for managing EQ presets
 */
export function useEQPresets(): UseEQPresetsReturn {
  // Built-in presets never change
  const [presets] = useState<Record<string, Preset>>(DEFAULT_PRESETS);
  
  // User presets can be created, modified, and deleted
  const [userPresets, setUserPresets] = useState<Record<string, UserPreset>>({});

  // Load user presets from localStorage on mount
  useEffect(() => {
    try {
      const savedPresetsJSON = localStorage.getItem(STORAGE_KEYS.USER_PRESETS);
      if (savedPresetsJSON) {
        const savedPresets = JSON.parse(savedPresetsJSON);
        setUserPresets(savedPresets);
      }
    } catch (error) {
      console.error('Failed to load user presets:', error);
    }
  }, []);

  // Save user presets to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_PRESETS, JSON.stringify(userPresets));
    } catch (error) {
      console.error('Failed to save user presets:', error);
    }
  }, [userPresets]);

  /**
   * Save or update a user preset
   */
  const saveUserPreset = (preset: UserPreset) => {
    setUserPresets(prev => ({
      ...prev,
      [preset.id]: preset
    }));
  };

  /**
   * Delete a user preset
   */
  const deleteUserPreset = (presetId: string) => {
    setUserPresets(prev => {
      const newPresets = { ...prev };
      delete newPresets[presetId];
      return newPresets;
    });
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
    
    // Save the new preset
    saveUserPreset(newPreset);
    
    return newPreset;
  };

  return {
    presets,
    userPresets,
    saveUserPreset,
    deleteUserPreset,
    getPresetById,
    createCustomPreset
  };
}

export default useEQPresets;