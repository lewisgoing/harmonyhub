"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  PlusCircle, 
  MinusCircle, 
  Volume2, 
  VolumeX, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  AlertTriangle,
  Headphones,
  Check,
  Music
} from 'lucide-react';

import { CALIBRATION_STEPS, TINNITUS_TEST_FREQUENCIES, DEFAULT_FREQUENCY_BANDS } from './constants';
import { FrequencyBand, UserPreset } from './types';

interface CalibrationWizardProps {
  onComplete: (preset: UserPreset) => void;
  onCancel: () => void;
}

// Animation variants for step transitions
const fadeVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

const CalibrationWizard: React.FC<CalibrationWizardProps> = ({ onComplete, onCancel }) => {
  // Step state
  const [step, setStep] = useState(0);
  const totalSteps = CALIBRATION_STEPS.length;
  
  // Audio state for test tones
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [oscillator, setOscillator] = useState<OscillatorNode | null>(null);
  const [gainNode, setGainNode] = useState<GainNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Frequency selection state
  const [selectedFrequencyIndex, setSelectedFrequencyIndex] = useState<number | null>(null);
  const [customFrequency, setCustomFrequency] = useState(4000); // Default to 4kHz
  
  // Set a safer initial volume
  const [volume, setVolume] = useState(0.1);
  
  // Add a safer max volume constant
  const MAX_SAFE_VOLUME = 0.3;
  
  // Add warning flag for high volume
  const [showVolumeWarning, setShowVolumeWarning] = useState(false);
  
  // EQ band adjustment state
  const [notchDepth, setNotchDepth] = useState(-12);
  const [notchWidth, setNotchWidth] = useState(0.7);
  
  // Preset name
  const [presetName, setPresetName] = useState('My Tinnitus Relief');
  
  // Reference to keep track of calibration results
  const calibrationResultsRef = useRef<{
    frequency: number;
    notchDepth: number;
    notchWidth: number;
  }>({
    frequency: 4000,
    notchDepth: -12,
    notchWidth: 0.7
  });
  
  // Add animated progress bar
  const progress = ((step + 1) / totalSteps) * 100;
  
  // Initialize audio context
  useEffect(() => {
    const initAudio = async () => {
      try {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Create gain node
        const gain = context.createGain();
        gain.gain.value = volume;
        gain.connect(context.destination);
        
        setAudioContext(context);
        setGainNode(gain);
      } catch (error) {
        console.error('Failed to initialize audio context:', error);
      }
    };
    
    initAudio();
    
    // Cleanup on unmount
    return () => {
      stopTone();
      if (audioContext) {
        audioContext.close();
      }
    };
  }, []);
  
  // Update gain when volume changes
  useEffect(() => {
    if (gainNode) {
      gainNode.gain.value = volume;
    }
    
    // Monitor volume for warnings
    if (volume > 0.25) {
      setShowVolumeWarning(true);
    } else {
      setShowVolumeWarning(false);
    }
  }, [volume, gainNode]);
  
  // Update calibration results when values change
  useEffect(() => {
    calibrationResultsRef.current = {
      frequency: customFrequency,
      notchDepth,
      notchWidth
    };
  }, [customFrequency, notchDepth, notchWidth]);
  
  /**
   * Start playing a test tone with a fade-in for a gentler experience
   */
  const safePlayTone = (frequency: number) => {
    if (!audioContext || !gainNode) return;
    
    // Stop any existing tone
    stopTone();
    
    // Create oscillator with a fade-in
    const osc = audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    
    // Create a temporary gain node for fade-in
    const tempGain = audioContext.createGain();
    tempGain.gain.value = 0; // Start silent
    tempGain.connect(gainNode);
    
    // Connect and start
    osc.connect(tempGain);
    osc.start();
    
    // Slowly fade in over 200ms for a less harsh start
    tempGain.gain.linearRampToValueAtTime(1, audioContext.currentTime + 0.2);
    
    setOscillator(osc);
    setIsPlaying(true);
    setCustomFrequency(frequency);
  };
  
  /**
   * Stop the test tone
   */
  const stopTone = () => {
    if (oscillator) {
      oscillator.stop();
      oscillator.disconnect();
      setOscillator(null);
    }
    setIsPlaying(false);
  };
  
  /**
   * Toggle test tone playback
   */
  const toggleTone = () => {
    if (isPlaying) {
      stopTone();
    } else {
      safePlayTone(customFrequency);
    }
  };
  
  /**
   * Handle frequency selection
   */
  const handleFrequencySelect = (index: number) => {
    setSelectedFrequencyIndex(index);
    const frequency = TINNITUS_TEST_FREQUENCIES[index].frequency;
    safePlayTone(frequency);
  };
  
  /**
   * Handle custom frequency change
   */
  const handleFrequencyChange = (values: number[]) => {
    const newFreq = values[0];
    setCustomFrequency(newFreq);
    
    if (isPlaying && oscillator) {
      oscillator.frequency.value = newFreq;
    }
    
    // Deselect any previously selected frequency
    setSelectedFrequencyIndex(null);
  };
  
  /**
   * Go to next step
   */
  const nextStep = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
      stopTone(); // Stop tone when navigating
    }
  };
  
  /**
   * Go to previous step
   */
  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
      stopTone(); // Stop tone when navigating
    }
  };
  
  /**
   * Create custom preset based on calibration
   */
// In components/music-player/CalibrationWizard.tsx
// Replace the createCustomPreset function with this improved version:

// In components/music-player/CalibrationWizard.tsx
// Update the createCustomPreset function to enforce correct settings

const createCustomPreset = () => {
  const { frequency } = calibrationResultsRef.current;

  const enforcedNotchDepth = -12; // Ensure this is consistently -12dB
  const enforcedNotchWidth = 0.3;
  
  const finalNotchDepth = notchDepth;
  
  // Format frequency for display
  const formattedFreq = frequency >= 1000 ? 
    `${(frequency/1000).toFixed(1)}kHz` : 
    `${frequency.toFixed(0)}Hz`;
  
  // Create bands with our enforced settings
  const customBands: FrequencyBand[] = DEFAULT_FREQUENCY_BANDS.map(band => {
    // Find closest band to tinnitus frequency
    const distance = Math.abs(band.frequency - frequency);
    const isClosest = distance < (band.frequency * 0.2); // Within 20% range
    
    if (isClosest) {
      return {
        ...band,
        frequency, // Set exact tinnitus frequency
        gain: finalNotchDepth, // Use what the UI showed
        Q: notchWidth * 10 // Use what the UI showed
      };
    }
    
    // Mild high-freq attenuation and low-freq boost
    if (band.frequency > frequency * 1.5) {
      return { ...band, gain: -3 };
    } else if (band.frequency < frequency * 0.3) {
      return { ...band, gain: 2 };
    }
    
    return band;
  });
  
  // Create the custom preset
  const customPreset: UserPreset = {
    id: `tinnitus-${Date.now()}`,
    name: presetName || `Tinnitus Relief ${formattedFreq}`,
description: `Personalized tinnitus relief preset with ${Math.abs(enforcedNotchDepth)}dB notch filter at ${formattedFreq}. Created through calibration.`,description: `Personalized tinnitus relief preset with ${Math.abs(enforcedNotchDepth)}dB notch filter at ${formattedFreq}. Created through calibration.`,    color: {
      active: { bg: "#8B5CF6", text: "white" },
      inactive: { bg: "#EDE9FE", text: "#6D28D9" }
    },
    bands: customBands,
    dateCreated: new Date().toISOString(),
    tinnitusCenterFreq: frequency,
    isCalibrated: true
  };
  
  // Send preset to parent
  onComplete(customPreset);
};
  
  /**
   * Render the current step content
   */
  const renderStepContent = () => {
    switch (step) {
      case 0: // Welcome
        return (
          <CardContent className="space-y-4">
            <motion.div 
              className="flex justify-center p-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="bg-blue-50 w-24 h-24 rounded-full flex items-center justify-center">
                <Headphones className="h-12 w-12 text-blue-500" />
              </div>
            </motion.div>
            
            <motion.p 
              className="text-muted-foreground"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              This wizard will help identify your tinnitus frequency and create a customized EQ preset to provide relief while listening to music.
            </motion.p>
            
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <p className="font-medium">For best results:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <motion.li initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                  Use headphones in a quiet environment
                </motion.li>
                <motion.li initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
                  Set your device volume to a comfortable level
                </motion.li>
                <motion.li initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}>
                  Take your time with each step
                </motion.li>
              </ul>
            </motion.div>
          </CardContent>
        );
        
      case 1: // Frequency selection
        return (
          <CardContent className="space-y-4">
            <motion.p 
              className="text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              Click each button to play test tones. Select the one that most closely matches your tinnitus sound.
            </motion.p>
            
            <motion.div 
              className="grid grid-cols-2 gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {TINNITUS_TEST_FREQUENCIES.map((freq, index) => (
                <motion.div
                  key={freq.frequency}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button
                    variant={selectedFrequencyIndex === index ? "default" : "outline"}
                    className={`justify-start w-full ${selectedFrequencyIndex === index ? 'bg-blue-500 text-white' : ''}`}
                    onClick={() => handleFrequencySelect(index)}
                  >
                    <span>{freq.label}</span>
                  </Button>
                </motion.div>
              ))}
            </motion.div>
            
            <motion.div 
              className="flex items-center gap-2 pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Button 
                size="icon" 
                variant={isPlaying ? "destructive" : "outline"}
                onClick={toggleTone}
                className="aspect-square w-10 h-10 rounded-full"
              >
                {isPlaying ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </Button>
              <div className="text-sm font-medium">
                {isPlaying ? "Stop Tone" : "Play Current Tone"}
              </div>
            </motion.div>
            
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <Label className="flex justify-between">
                <span>Volume</span>
                {showVolumeWarning && (
                  <motion.span 
                    className="text-amber-500 text-xs flex items-center"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: 1, duration: 1 }}
                  >
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    High volume - use caution
                  </motion.span>
                )}
              </Label>
              <Slider
                min={0}
                max={MAX_SAFE_VOLUME}
                step={0.01}
                value={[volume]}
                onValueChange={(values) => setVolume(values[0])}
                className="py-2"
              />
              <div className="flex justify-between text-xs">
                <span>Quiet</span>
                <span>Loud</span>
              </div>
            </motion.div>
          </CardContent>
        );
        
      case 2: // Fine-tune frequency
        return (
          <CardContent className="space-y-4">
            <motion.p 
              className="text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Use the slider to fine-tune the exact frequency that matches your tinnitus.
            </motion.p>
            
            <motion.div 
              className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div 
                className="text-center font-mono text-lg mb-3 font-semibold text-blue-700"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                key={customFrequency} // Key will force re-render when frequency changes
              >
                {customFrequency.toFixed(0)} Hz
              </motion.div>
              
              <div className="relative pb-10">
                <Slider
                  min={125}
                  max={16000}
                  step={50}
                  value={[customFrequency]}
                  onValueChange={handleFrequencyChange}
                  className="py-2"
                />
                
                {/* Frequency scale markers */}
                <div className="absolute w-full flex justify-between mt-2 px-1 text-xs text-gray-500">
                  <span>125 Hz</span>
                  <span>1 kHz</span>
                  <span>4 kHz</span>
                  <span>8 kHz</span>
                  <span>16 kHz</span>
                </div>
              </div>
              
              {/* Moved the tip outside the slider container so it doesn't block the frequency display */}
              <motion.div 
                className="bg-blue-50 rounded-md p-2 border border-blue-200 mb-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="text-xs text-blue-700">
                  <span className="font-medium block mb-1">Tip:</span>
                  Most tinnitus is between 3kHz and 8kHz. If you're unsure, try frequencies in this range.
                </div>
              </motion.div>
            </motion.div>
            
            <motion.div 
              className="grid grid-cols-2 gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div>
                <Label>Fine Adjustment</Label>
                <div className="flex gap-1 mt-1">
                  <Button 
                    size="sm"
                    variant="outline" 
                    onClick={() => handleFrequencyChange([customFrequency - 50])}
                    className="rounded-full"
                  >
                    <MinusCircle className="mr-1 h-3 w-3" />
                    50 Hz
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline" 
                    onClick={() => handleFrequencyChange([customFrequency - 10])}
                    className="rounded-full"
                  >
                    <MinusCircle className="mr-1 h-3 w-3" />
                    10 Hz
                  </Button>
                </div>
              </div>
              
              <div>
                <Label>&nbsp;</Label>
                <div className="flex gap-1 mt-1">
                  <Button 
                    size="sm"
                    variant="outline" 
                    onClick={() => handleFrequencyChange([customFrequency + 10])}
                    className="rounded-full"
                  >
                    <PlusCircle className="mr-1 h-3 w-3" />
                    10 Hz
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline" 
                    onClick={() => handleFrequencyChange([customFrequency + 50])}
                    className="rounded-full"
                  >
                    <PlusCircle className="mr-1 h-3 w-3" />
                    50 Hz
                  </Button>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="flex items-center gap-2 pt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Button 
                onClick={toggleTone}
                variant={isPlaying ? "destructive" : "default"}
                className="w-full rounded-full"
              >
                {isPlaying ? (
                  <>
                    <VolumeX className="mr-2 h-4 w-4" />
                    Stop Tone
                  </>
                ) : (
                  <>
                    <Volume2 className="mr-2 h-4 w-4" />
                    Play Test Tone
                  </>
                )}
              </Button>
            </motion.div>
            
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Label className="flex justify-between">
                <span>Volume</span>
                {showVolumeWarning && (
                  <motion.span 
                    className="text-amber-500 text-xs flex items-center"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: 2, duration: 1 }}
                  >
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    High volume - use caution
                  </motion.span>
                )}
              </Label>
              <Slider
                min={0}
                max={MAX_SAFE_VOLUME}
                step={0.01}
                value={[volume]}
                onValueChange={(values) => setVolume(values[0])}
                className="py-2"
              />
            </motion.div>
          </CardContent>
        );
        
      case 3: // Create EQ preset
        return (
          <CardContent className="space-y-4">
            <motion.p 
              className="text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              We'll create a notch filter at {customFrequency}Hz to provide relief from your tinnitus.
              Adjust the filter settings below.
            </motion.p>
            
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
<motion.div 
  className="space-y-2"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.3 }}
>
  <div className="flex justify-between">
    <Label>Notch Depth</Label>
    <motion.span 
      className="text-sm font-mono"
      key={notchDepth} // Force re-render animation when value changes
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
    >
      {notchDepth} dB
    </motion.span>
  </div>
  <Slider
    min={-24}
    max={0}
    step={1}
    value={[notchDepth]}
    onValueChange={(values) => setNotchDepth(values[0])}
    className="py-2"
  />
  <div className="flex justify-between text-xs">
    <span>More Relief (-24dB)</span>
    <span>Less Relief (0dB)</span>
  </div>
</motion.div>
              
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex justify-between">
                  <Label>Notch Width</Label>
                  <motion.span 
                    className="text-sm font-mono"
                    key={notchWidth} // Force re-render animation when value changes
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                  >
                    {notchWidth.toFixed(1)}
                  </motion.span>
                </div>
                <Slider
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  value={[notchWidth]}
                  onValueChange={(values) => setNotchWidth(values[0])}
                  className="py-2"
                />
                <div className="flex justify-between text-xs">
                  <span>Narrow</span>
                  <span>Wide</span>
                </div>
              </motion.div>
            </motion.div>
            
            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Switch
                id="test-tone"
                checked={isPlaying}
                onCheckedChange={toggleTone}
              />
              <Label htmlFor="test-tone">Play test tone while adjusting</Label>
            </motion.div>
          </CardContent>
        );
        
        case 4: // Save preset
        return (
          <CardContent className="space-y-4">
            <motion.p 
              className="text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Name your tinnitus relief preset. This will be specially tuned to your tinnitus frequency.
            </motion.p>
            
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Label htmlFor="preset-name">Preset Name</Label>
              <Input
                id="preset-name"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder={`Tinnitus Relief ${(customFrequency/1000).toFixed(1)}kHz`}
                className="rounded-lg"
              />
              <p className="text-xs text-muted-foreground">
                A descriptive name helps you identify this preset later. We've suggested a name based on your tinnitus frequency.
              </p>
            </motion.div>
            
            <motion.div 
              className="bg-purple-50 p-4 rounded-xl shadow-sm border border-purple-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h4 className="font-medium mb-2 flex items-center text-purple-800">
                <Headphones className="h-4 w-4 mr-2" />
                Your Tinnitus Profile
              </h4>
              <ul className="space-y-2 text-sm text-purple-700">
                <motion.li 
                  className="flex justify-between"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <span>Frequency:</span>
                  <span className="font-mono font-medium">
                    {customFrequency < 1000 ? 
                      `${customFrequency.toFixed(0)} Hz` : 
                      `${(customFrequency/1000).toFixed(1)} kHz`}
                  </span>
                </motion.li>
                <motion.li 
  className="flex justify-between"
  initial={{ opacity: 0, x: -10 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ delay: 0.5 }}
>
  <span>Notch Depth:</span>
  <span className="font-mono font-medium">{notchDepth} dB</span>
</motion.li>
                <motion.li 
                  className="flex justify-between"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <span>Notch Width:</span>
                  <span className="font-mono font-medium">Q = {(notchWidth * 10).toFixed(1)}</span>
                </motion.li>
              </ul>
              <div className="mt-3 text-xs bg-purple-100 p-2 rounded text-purple-700">
                This preset applies a precise notch filter at your tinnitus frequency to provide relief while listening to music.
              </div>
            </motion.div>
          </CardContent>
        );        
        
      case 5: // Complete
        return (
          <CardContent className="space-y-4">
            <motion.div 
              className="flex justify-center p-4"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="rounded-full bg-green-100 p-5 w-24 h-24 flex items-center justify-center">
                <Check size={48} className="text-green-600" />
              </div>
            </motion.div>
            
            <motion.p 
              className="text-center text-lg font-medium"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Your custom preset "{presetName}" has been created successfully!
            </motion.p>
            
            <motion.p 
              className="text-sm text-muted-foreground text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              You can now enjoy music with reduced tinnitus interference. Your preset will
              be available in the EQ preset list for future use.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                className="w-full rounded-lg bg-green-600 hover:bg-green-700" 
                onClick={createCustomPreset}
              >
                <Save className="mr-2 h-4 w-4" />
                Apply Preset
              </Button>
            </motion.div>
          </CardContent>
        );
    }
  };
  
  return (
    <Card className="overflow-hidden relative">
      {/* Progress bar */}
      <motion.div 
        className="absolute top-0 left-0 h-1 bg-blue-500"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5 }}
      />
      
      <CardHeader>
        <CardTitle>{CALIBRATION_STEPS[step].title}</CardTitle>
        <CardDescription>{CALIBRATION_STEPS[step].description}</CardDescription>
      </CardHeader>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={fadeVariants}
        >
          {renderStepContent()}
        </motion.div>
      </AnimatePresence>
      
      <CardFooter className="flex justify-between">
        {step > 0 ? (
          <Button 
            variant="outline" 
            onClick={prevStep}
            className="rounded-full"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        ) : (
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="rounded-full"
          >
            Cancel
          </Button>
        )}
        
        {step < totalSteps - 1 ? (
          <Button 
            onClick={nextStep}
            className="rounded-full bg-blue-600 hover:bg-blue-700"
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button 
            onClick={createCustomPreset}
            className="rounded-full bg-green-600 hover:bg-green-700"
          >
            <Save className="mr-2 h-4 w-4" />
            Save & Apply
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default CalibrationWizard;