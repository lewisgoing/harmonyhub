import { Preset, FrequencyBand, Song } from './types';

/**
 * Default frequency bands for equalization (in Hz)
 * Focused on ranges relevant for tinnitus and speech
 */
export const DEFAULT_FREQUENCY_BANDS: FrequencyBand[] = [
  { id: 'band1', frequency: 125, gain: 0, Q: 1.0 },   // Low bass
  { id: 'band2', frequency: 250, gain: 0, Q: 1.0 },   // Bass
  { id: 'band3', frequency: 500, gain: 0, Q: 1.0 },   // Low mids
  { id: 'band4', frequency: 1000, gain: 0, Q: 1.0 },  // Mids
  { id: 'band5', frequency: 2000, gain: 0, Q: 1.0 },  // Upper mids
  { id: 'band6', frequency: 4000, gain: 0, Q: 1.0 },  // Presence (common tinnitus range)
  { id: 'band7', frequency: 8000, gain: 0, Q: 1.0 },  // Brilliance (common tinnitus range)
  { id: 'band8', frequency: 16000, gain: 0, Q: 1.0 }, // Air
];

/**
 * Built-in presets focused on tinnitus relief
 */
export const DEFAULT_PRESETS: Record<string, Preset> = {
  flat: {
    id: 'flat',
    name: 'Flat',
    description: 'No equalization applied',
    color: {
      active: { bg: "#374151", text: "white" },
      inactive: { bg: "#F3F4F6", text: "#1F2937" }
    },
    bands: DEFAULT_FREQUENCY_BANDS.map(band => ({ ...band, gain: 0 }))
  },

  notchFilter: {
    id: 'notchFilter',
    name: 'Notch Filter',
    description: 'Reduces volume in the 3-8kHz range where tinnitus commonly occurs',
    color: {
      active: { bg: "#1D4ED8", text: "white" },
      inactive: { bg: "#DBEAFE", text: "#1E40AF" }
    },
    bands: DEFAULT_FREQUENCY_BANDS.map(band => {
      if (band.frequency >= 3000 && band.frequency <= 8000) {
        return { ...band, gain: -12, Q: 2.0 };
      }
      return { ...band, gain: 0 };
    })
  },

  speechClarity: {
    id: 'speechClarity',
    name: 'Speech Clarity',
    description: 'Enhances frequencies important for speech understanding',
    color: {
      active: { bg: "#047857", text: "white" },
      inactive: { bg: "#D1FAE5", text: "#065F46" }
    },
    bands: DEFAULT_FREQUENCY_BANDS.map(band => {
      if (band.frequency >= 500 && band.frequency <= 4000) {
        return { ...band, gain: 5 };
      } else if (band.frequency > 4000) {
        return { ...band, gain: -3 };
      }
      return { ...band, gain: 0 };
    })
  },

  gentleRelief: {
    id: 'gentleRelief',
    name: 'Gentle Relief',
    description: 'Subtle bass enhancement with high frequency attenuation',
    color: {
      active: { bg: "#7E22CE", text: "white" },
      inactive: { bg: "#F3E8FF", text: "#6B21A8" }
    },
    bands: DEFAULT_FREQUENCY_BANDS.map(band => {
      if (band.frequency < 500) {
        return { ...band, gain: 4 };
      } else if (band.frequency > 4000) {
        return { ...band, gain: -6, Q: 0.8 };
      }
      return { ...band, gain: 0 };
    })
  },

  masking: {
    id: 'masking',
    name: 'Masking',
    description: 'Enhances frequencies to help mask tinnitus',
    color: {
      active: { bg: "#B91C1C", text: "white" },
      inactive: { bg: "#FEE2E2", text: "#991B1B" }
    },
    bands: DEFAULT_FREQUENCY_BANDS.map(band => {
      // Create a gentle noise curve that doesn't aggravate tinnitus
      if (band.frequency < 200) {
        return { ...band, gain: 3 };
      } else if (band.frequency < 1000) {
        return { ...band, gain: 5 };
      } else if (band.frequency < 5000) {
        return { ...band, gain: 2 };
      }
      return { ...band, gain: -4 };
    })
  }
};

/**
 * Common tinnitus frequency ranges
 */
export const TINNITUS_TEST_FREQUENCIES = [
  { frequency: 125, label: '125 Hz - Very Low' },
  { frequency: 250, label: '250 Hz - Low' },
  { frequency: 500, label: '500 Hz - Mid-Low' },
  { frequency: 1000, label: '1 kHz - Mid' },
  { frequency: 2000, label: '2 kHz - Mid-High' },
  { frequency: 3000, label: '3 kHz - High' },
  { frequency: 4000, label: '4 kHz - Very High' },
  { frequency: 6000, label: '6 kHz - Very High' },
  { frequency: 8000, label: '8 kHz - Extremely High' },
  { frequency: 10000, label: '10 kHz - Extremely High' },
  { frequency: 12000, label: '12 kHz - Ultrahigh' },
  { frequency: 16000, label: '16 kHz - Ultrahigh' },
];

/**
 * Calibration step descriptions
 */
export const CALIBRATION_STEPS = [
  {
    title: 'Welcome to Tinnitus Calibration',
    description: 'This wizard will help you create a personalized EQ preset for your specific tinnitus frequency. Please use headphones for the best results.'
  },
  {
    title: 'Identify Your Tinnitus Frequency',
    description: 'Listen to each frequency and select the one that most closely matches your tinnitus. If you don\'t hear your tinnitus, that\'s okay - choose the closest match.'
  },
  {
    title: 'Fine-Tune the Frequency',
    description: 'Adjust the slider to fine-tune the exact frequency of your tinnitus. The goal is to find the frequency that most closely matches what you hear.'
  },
  {
    title: 'Create Your EQ Preset',
    description: 'We\'ll create a notch filter at your tinnitus frequency. You can adjust the intensity of the filter using the slider below.'
  },
  {
    title: 'Save Your Preset',
    description: 'Give your preset a name and save it for future use. You can always modify or delete it later.'
  },
  {
    title: 'Calibration Complete!',
    description: 'Your custom preset has been created and applied. You can now enjoy music with reduced tinnitus interference.'
  }
];

/**
 * Demo song data
 */
export const DEMO_SONG: Song = {
  name: "They Say It's Wonderful",
  author: "John Coltrane and Johnny Hartman",
  cover: "https://i.scdn.co/image/ab67616d0000b2731d1cc2e40d533d7bcebf5dae",
  audio: "https://storage.googleapis.com/media-session/elephants-dream/the-wires.mp3", // Original Google API URL
};

/**
 * Storage keys for saving user presets and settings
 */
export const STORAGE_KEYS = {
  USER_PRESETS: 'hearing-heroes-user-presets',
  LAST_PRESET: 'hearing-heroes-last-preset',
  PLAYBACK_SETTINGS: 'hearing-heroes-playback-settings',
  CALIBRATION_DATA: 'hearing-heroes-calibration-data',
};

/**
 * Audio context configuration
 */
export const AUDIO_CONTEXT_CONFIG = {
  DEFAULT_Q: 1.0,
  MOBILE_BREAKPOINT: 768,
  TRANSITION_DURATION: 150, // ms
};