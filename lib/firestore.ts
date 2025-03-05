import { 
    collection, 
    doc, 
    setDoc, 
    getDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    serverTimestamp,
    DocumentReference,
    DocumentData,
    Timestamp
  } from 'firebase/firestore';
  import { db } from '@/lib/firebase'; // Updated path
  import { UserPreset } from '@/components/music-player/types';
  
  // Extend the PlaybackSettings interface from music player types
  export interface PlaybackSettings {
    isEQEnabled: boolean;
    isSplitEarMode: boolean;
    splitEarConfig: {
      leftEarPreset: string;
      rightEarPreset: string;
      balance: number;
    };
    lastPresetId?: string;
    volume?: number;
  }
  
  export interface FirestoreUserPreset extends Omit<UserPreset, 'dateCreated'> {
    dateCreated: Timestamp;
    userId: string;
  }
  
  /**
   * Save a user preset to Firestore
   */
  export async function saveUserPreset(preset: UserPreset, userId: string): Promise<string> {
    try {
      // Convert UserPreset to FirestoreUserPreset
      const firestorePreset: FirestoreUserPreset = {
        ...preset,
        dateCreated: Timestamp.fromDate(new Date(preset.dateCreated)),
        userId
      };
      
      // Create a reference to the preset document
      const presetRef = doc(collection(db, 'presets'));
      
      // For new presets, use the generated Firestore ID
      if (!preset.id.startsWith('custom-')) {
        firestorePreset.id = presetRef.id;
      }
      
      // Save the preset
      await setDoc(presetRef, firestorePreset);
      
      return firestorePreset.id;
    } catch (error) {
      console.error('Error saving user preset:', error);
      throw error;
    }
  }
  
  /**
   * Get all presets for a user
   */
  export async function getUserPresets(userId: string): Promise<Record<string, UserPreset>> {
    try {
      const presetsQuery = query(collection(db, 'presets'), where('userId', '==', userId));
      const snapshot = await getDocs(presetsQuery);
      
      const presets: Record<string, UserPreset> = {};
      
      snapshot.forEach(doc => {
        const data = doc.data() as FirestoreUserPreset;
        
        // Convert Firestore Timestamp to ISO string
        const dateCreated = data.dateCreated.toDate().toISOString();
        
        presets[data.id] = {
          ...data,
          dateCreated
        };
      });
      
      return presets;
    } catch (error) {
      console.error('Error getting user presets:', error);
      return {};
    }
  }
  
  /**
   * Delete a user preset
   */
  export async function deleteUserPreset(presetId: string): Promise<boolean> {
    try {
      const presetsQuery = query(collection(db, 'presets'), where('id', '==', presetId));
      const snapshot = await getDocs(presetsQuery);
      
      if (snapshot.empty) {
        console.error('Preset not found:', presetId);
        return false;
      }
      
      // Delete the first matching preset
      await deleteDoc(snapshot.docs[0].ref);
      return true;
    } catch (error) {
      console.error('Error deleting user preset:', error);
      return false;
    }
  }
  
  /**
   * Save user playback settings
   */
  export async function savePlaybackSettings(
    settings: PlaybackSettings, 
    userId: string
  ): Promise<boolean> {
    try {
      const settingsRef = doc(db, 'settings', userId);
      await setDoc(settingsRef, {
        ...settings,
        userId,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error saving playback settings:', error);
      return false;
    }
  }
  
  /**
   * Get user playback settings
   */
  export async function getPlaybackSettings(userId: string): Promise<PlaybackSettings | null> {
    try {
      const settingsRef = doc(db, 'settings', userId);
      const snapshot = await getDoc(settingsRef);
      
      if (snapshot.exists()) {
        const data = snapshot.data() as PlaybackSettings & { updatedAt: Timestamp };
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting playback settings:', error);
      return null;
    }
  }