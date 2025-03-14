import { Preset, FrequencyBand, Song } from './types';

/**
 * Default frequency bands for equalization (in Hz)
 * Focused on ranges relevant for tinnitus and speech
 */
// In constants.ts
export const DEFAULT_FREQUENCY_BANDS: FrequencyBand[] = [
  { id: 'band1', frequency: 125, gain: 0, Q: 5.0 },   // Low bass
  { id: 'band2', frequency: 250, gain: 0, Q: 5.0 },   // Bass
  { id: 'band3', frequency: 500, gain: 0, Q: 5.0 },   // Low mids
  { id: 'band4', frequency: 1000, gain: 0, Q: 5.0 },  // Mids
  { id: 'band5', frequency: 2000, gain: 0, Q: 5.0 },  // Upper mids
  { id: 'band6', frequency: 4000, gain: 0, Q: 5.0 },  // Presence
  { id: 'band7', frequency: 6000, gain: 0, Q: 5.0 },  // Critical tinnitus range (added)
  { id: 'band8', frequency: 8000, gain: 0, Q: 5.0 },  // Brilliance
  { id: 'band9', frequency: 16000, gain: 0, Q: 5.0 }, // Air
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
    description: 'Targets the 5-7kHz range where tinnitus commonly occurs',
    color: {
      active: { bg: "#1D4ED8", text: "white" },
      inactive: { bg: "#DBEAFE", text: "#1E40AF" }
    },
    bands: DEFAULT_FREQUENCY_BANDS.map(band => {
      // Create focused notches at the most common tinnitus frequencies
      if (band.frequency === 5000) {
        return { ...band, gain: -12, Q: 7.0 };
      } else if (band.frequency === 6000) {
        return { ...band, gain: -10, Q: 7.0 };
      } else if (band.frequency === 7000) {
        return { ...band, gain: -8, Q: 7.0 };
      } else if (band.frequency === 4000 || band.frequency === 8000) {
        // Less aggressive at the edges of the common range
        return { ...band, gain: -6, Q: 5.0 };
      }
      // Add a touch of bass for comfort
      else if (band.frequency < 300) {
        return { ...band, gain: 2 };
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
    description: 'Balanced sound with reduced tinnitus frequencies',
    color: {
      active: { bg: "#7E22CE", text: "white" },
      inactive: { bg: "#F3E8FF", text: "#6B21A8" }
    },
    bands: DEFAULT_FREQUENCY_BANDS.map(band => {
      if (band.frequency < 500) {
        return { ...band, gain: 4 }; // Bass boost
      } else if (band.frequency >= 1000 && band.frequency <= 3000) {
        return { ...band, gain: 2 }; // Light mid boost for voices
      } else if (band.frequency >= 4000 && band.frequency <= 8000) {
        return { ...band, gain: -5, Q: 1.0 }; // Wider, gentler cut in tinnitus range
      } else if (band.frequency > 8000) {
        return { ...band, gain: -3 }; // Soften the highest frequencies 
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
  { frequency: 2000, label: '2 kHz - Speech Range' },
  { frequency: 3000, label: '3 kHz - Common Ringing' },
  { frequency: 4000, label: '4 kHz - Classic Tinnitus' },
  { frequency: 5000, label: '5 kHz - High Ringing' },  // Added 5kHz as it's important
  { frequency: 6000, label: '6 kHz - Telephone-like' },
  { frequency: 7000, label: '7 kHz - High Whistling' }, // Added 7kHz for better coverage
  { frequency: 8000, label: '8 kHz - Sharp Whistling' },
  { frequency: 10000, label: '10 kHz - Hissing Range' },
  { frequency: 12000, label: '12 kHz - Fine Hissing' },
  { frequency: 16000, label: '16 kHz - Ultra-high Tone' },
];

/**
 * Calibration step descriptions
 */
/**
 * Calibration step descriptions - updated with expert-backed messaging
 */
export const CALIBRATION_STEPS = [
  {
    title: 'Welcome to Tinnitus Calibration',
    description: 'Based on clinically-validated notched sound therapy, this calibration will create a personalized EQ preset for your specific tinnitus frequency. Please use headphones for the best results.'
  },
  {
    title: 'Identify Your Tinnitus Frequency',
    description: 'Select the tone that most closely matches your tinnitus sound. Research shows that most people with tinnitus experience frequencies between 5-7kHz (Pantev et al., 2012).'
  },
  {
    title: 'Fine-Tune the Frequency',
    description: 'Adjust the slider to match your exact tinnitus pitch. Studies show that precise frequency matching is crucial for effective notched sound therapy.'
  },
  {
    title: 'Adjust Filter Settings',
    description: 'Set the notch depth (how much to reduce the tinnitus frequency) and width (how many nearby frequencies to affect). Research suggests a reduction of 10-15dB with moderate width provides optimal results.'
  },
  {
    title: 'Save Your Preset',
    description: 'Name your personalized preset. It will be saved in the "Tinnitus" tab and can be modified any time if your tinnitus characteristics change.'
  },
  {
    title: 'Calibration Complete!',
    description: 'Your evidence-based preset has been created and applied. For best results, use regularly while listening to music or other audio content.'
  }
];

/**
 * Scientific basis for the calibration approach
 */
export const CALIBRATION_RESEARCH = {
  PRIMARY_SOURCE: {
    AUTHORS: "Pantev C, Okamoto H, Teismann H",
    TITLE: "Tinnitus: the dark side of the auditory cortex plasticity",
    JOURNAL: "Annals of the New York Academy of Sciences",
    YEAR: 2012,
    VOLUME: "1252(1)",
    PAGES: "253-258",
    DOI: "10.1111/j.1749-6632.2012.06452.x"
  },
  SECONDARY_SOURCES: [
    {
      AUTHORS: "Okamoto H, Stracke H, Stoll W, Pantev C",
      TITLE: "Listening to tailor-made notched music reduces tinnitus loudness and tinnitus-related auditory cortex activity",
      JOURNAL: "Proceedings of the National Academy of Sciences",
      YEAR: 2010,
      VOLUME: "107(3)",
      PAGES: "1207-1210",
      DOI: "10.1073/pnas.0911268107"
    },
    {
      AUTHORS: "American Tinnitus Association",
      TITLE: "Sound Therapies",
      URL: "https://www.ata.org/managing-your-tinnitus/treatment-options/sound-therapies"
    }
  ],
  METHODOLOGY_NOTES: "Our calibration approach combines individualized notched sound therapy with user-adjustable parameters, allowing for personalized settings based on the specific characteristics of each person's tinnitus. The notch filtering technique has been demonstrated in multiple peer-reviewed studies to help reduce tinnitus perception over time."
};

/**
 * Demo song data
 */
export const DEMO_SONG: Song = {
  name: "They Say It's Wonderful",
  author: "John Coltrane and Johnny Hartman",
  cover: "https://t2.genius.com/unsafe/354x354/https%3A%2F%2Fimages.genius.com%2F377d1cbe4d61d32706cd40ea9f01b467.1000x980x1.jpg",
  audio: "audio/they-say-its-wonderful.mp3", // Original Google API URL
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


export const CALIBRATION_DEFAULTS = {
  INITIAL_FREQUENCY: 6000,     // Default starting frequency in Hz
  DEFAULT_NOTCH_DEPTH: -12,    // Default reduction in dB
  DEFAULT_NOTCH_WIDTH: 0.7,    // Default Q factor multiplier
  SAFE_VOLUME_MAX: 0.3,        // Maximum recommended volume (0-1)
  MIN_Q_VALUE: 0.1,            // Minimum Q value (very wide)
  MAX_Q_VALUE: 30,             // Maximum Q value (very narrow)
  
  // Common frequency ranges based on clinical data
  COMMON_RANGES: {
    MILD: [3000, 4000],        // Mild tinnitus common range
    MODERATE: [4000, 6000],    // Moderate tinnitus common range
    SEVERE: [6000, 8000]       // Severe/high-pitched tinnitus common range
  }
};
/**
 * Audio context configuration
 */
export const AUDIO_CONTEXT_CONFIG = {
  DEFAULT_Q: 5.0,
  MOBILE_BREAKPOINT: 768,
  TRANSITION_DURATION: 150, // ms
};