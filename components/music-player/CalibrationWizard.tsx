"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PlusCircle, MinusCircle, Volume2, VolumeX, ChevronRight, ChevronLeft, Save, AlertTriangle } from "lucide-react";

import { CALIBRATION_STEPS, TINNITUS_TEST_FREQUENCIES, DEFAULT_FREQUENCY_BANDS } from './constants';
import { FrequencyBand, UserPreset } from './types';

interface CalibrationWizardProps {
  onComplete: (preset: UserPreset) => void;
  onCancel: () => void;
}

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
  
  // Set a safer initial volume (reduced from 0.2 to 0.1)
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
  const createCustomPreset = () => {
    const { frequency, notchDepth, notchWidth } = calibrationResultsRef.current;
    
    // Create bands based on default bands
    const customBands: FrequencyBand[] = DEFAULT_FREQUENCY_BANDS.map(band => {
      // Find closest band to tinnitus frequency
      const distance = Math.abs(band.frequency - frequency);
      const isClosest = distance < (band.frequency * 0.2); // Within 20% range
      
      if (isClosest) {
        // This is the band we want to notch
        return {
          ...band,
          frequency, // Set exact tinnitus frequency
          gain: notchDepth,
          Q: notchWidth * 10 // Scale Q value (0.1-1 to 1-10)
        };
      }
      
      // Mild high-freq attenuation and low-freq boost
      if (band.frequency > frequency * 1.5) {
        return { ...band, gain: -3 };
      } else if (band.frequency < frequency * 0.3) {
        return { ...band, gain: 3 };
      }
      
      return band;
    });
    
    // Create the custom preset
    const customPreset: UserPreset = {
      id: `tinnitus-${Date.now()}`,
      name: presetName,
      description: `Custom tinnitus relief preset with notch at ${frequency.toFixed(0)}Hz`,
      color: {
        active: { bg: "#0EA5E9", text: "white" },
        inactive: { bg: "#E0F2FE", text: "#0369A1" }
      },
      bands: customBands,
      dateCreated: new Date().toISOString(),
      tinnitusCenterFreq: frequency
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
            <div className="flex justify-center p-4">
              <Headphones size={64} className="text-primary" />
            </div>
            <p className="text-muted-foreground">
              This wizard will help identify your tinnitus frequency and create a customized EQ preset to provide relief while listening to music.
            </p>
            <div className="space-y-2">
              <p className="font-medium">For best results:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Use headphones in a quiet environment</li>
                <li>Set your device volume to a comfortable level</li>
                <li>Take your time with each step</li>
              </ul>
            </div>
          </CardContent>
        );
        
      case 1: // Frequency selection
        return (
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Click each button to play test tones. Select the one that most closely matches your tinnitus sound.
            </p>
            
            <div className="grid grid-cols-2 gap-2">
              {TINNITUS_TEST_FREQUENCIES.map((freq, index) => (
                <Button
                  key={freq.frequency}
                  variant={selectedFrequencyIndex === index ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => handleFrequencySelect(index)}
                >
                  <span>{freq.label}</span>
                </Button>
              ))}
            </div>
            
            <div className="flex items-center gap-2 pt-4">
              <Button 
                size="icon" 
                variant="outline" 
                onClick={toggleTone}
              >
                {isPlaying ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </Button>
              <div className="text-sm font-medium">
                {isPlaying ? "Stop Tone" : "Play Current Tone"}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="flex justify-between">
                <span>Volume</span>
                {showVolumeWarning && (
                  <span className="text-amber-500 text-xs flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    High volume - use caution
                  </span>
                )}
              </Label>
              <Slider
                min={0}
                max={MAX_SAFE_VOLUME}
                step={0.01}
                value={[volume]}
                onValueChange={(values) => setVolume(values[0])}
              />
              <div className="flex justify-between text-xs">
                <span>Quiet</span>
                <span>Loud</span>
              </div>
            </div>
          </CardContent>
        );
        
      case 2: // Fine-tune frequency
        return (
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Use the slider to fine-tune the exact frequency that matches your tinnitus.
            </p>
            
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-md border border-blue-200">
              <div className="text-center font-mono text-lg mb-3 font-semibold">
                {customFrequency.toFixed(0)} Hz
              </div>
              
              <div className="relative pb-8">
                <Slider
                  min={125}
                  max={16000}
                  step={50}
                  value={[customFrequency]}
                  onValueChange={handleFrequencyChange}
                />
                
                {/* Frequency scale markers */}
                <div className="absolute w-full flex justify-between mt-2 px-1 text-xs text-gray-500">
                  <span>125 Hz</span>
                  <span>1 kHz</span>
                  <span>4 kHz</span>
                  <span>8 kHz</span>
                  <span>16 kHz</span>
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 bg-blue-50 rounded-md p-2 border border-blue-200 mt-6">
                  <div className="text-xs text-blue-700">
                    <span className="font-medium block mb-1">Tip:</span>
                    Most tinnitus is between 3kHz and 8kHz. If you're unsure, try frequencies in this range.
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Fine Adjustment</Label>
                <div className="flex gap-1 mt-1">
                  <Button 
                    size="sm"
                    variant="outline" 
                    onClick={() => handleFrequencyChange([customFrequency - 50])}
                  >
                    -50 Hz
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline" 
                    onClick={() => handleFrequencyChange([customFrequency - 10])}
                  >
                    -10 Hz
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
                  >
                    +10 Hz
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline" 
                    onClick={() => handleFrequencyChange([customFrequency + 50])}
                  >
                    +50 Hz
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 pt-2">
              <Button 
                onClick={toggleTone}
                variant={isPlaying ? "destructive" : "default"}
                className="w-full"
              >
                {isPlaying ? "Stop Tone" : "Play Test Tone"}
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label className="flex justify-between">
                <span>Volume</span>
                {showVolumeWarning && (
                  <span className="text-amber-500 text-xs flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    High volume - use caution
                  </span>
                )}
              </Label>
              <Slider
                min={0}
                max={MAX_SAFE_VOLUME}
                step={0.01}
                value={[volume]}
                onValueChange={(values) => setVolume(values[0])}
              />
            </div>
          </CardContent>
        );
        
      case 3: // Create EQ preset
        return (
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We'll create a notch filter at {customFrequency}Hz to provide relief from your tinnitus.
              Adjust the filter settings below.
            </p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Notch Depth</Label>
                  <span className="text-sm">{notchDepth} dB</span>
                </div>
                <Slider
                  min={-24}
                  max={0}
                  step={1}
                  value={[notchDepth]}
                  onValueChange={(values) => setNotchDepth(values[0])}
                />
                <div className="flex justify-between text-xs">
                  <span>More Relief</span>
                  <span>Less Relief</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Notch Width</Label>
                  <span className="text-sm">{notchWidth.toFixed(1)}</span>
                </div>
                <Slider
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  value={[notchWidth]}
                  onValueChange={(values) => setNotchWidth(values[0])}
                />
                <div className="flex justify-between text-xs">
                  <span>Narrow</span>
                  <span>Wide</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                id="test-tone"
                checked={isPlaying}
                onCheckedChange={toggleTone}
              />
              <Label htmlFor="test-tone">Play test tone while adjusting</Label>
            </div>
          </CardContent>
        );
        
      case 4: // Save preset
        return (
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Name your custom preset. This will be saved for future use.
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="preset-name">Preset Name</Label>
              <Input
                id="preset-name"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="My Tinnitus Relief"
              />
            </div>
            
            <div className="bg-muted p-3 rounded-md text-sm">
              <h4 className="font-medium mb-1">Preset Summary:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>Frequency: {customFrequency} Hz</li>
                <li>Notch Depth: {notchDepth} dB</li>
                <li>Notch Width: Q = {(notchWidth * 10).toFixed(1)}</li>
              </ul>
            </div>
          </CardContent>
        );
        
      case 5: // Complete
        return (
          <CardContent className="space-y-4">
            <div className="flex justify-center p-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle size={48} className="text-green-600" />
              </div>
            </div>
            
            <p className="text-center">
              Your custom preset "{presetName}" has been created successfully!
            </p>
            
            <p className="text-sm text-muted-foreground">
              You can now enjoy music with reduced tinnitus interference. Your preset will
              be available in the EQ preset list for future use.
            </p>
            
            <Button 
              className="w-full" 
              onClick={createCustomPreset}
            >
              Apply Preset
            </Button>
          </CardContent>
        );
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{CALIBRATION_STEPS[step].title}</CardTitle>
        <CardDescription>{CALIBRATION_STEPS[step].description}</CardDescription>
      </CardHeader>
      
      {renderStepContent()}
      
      <CardFooter className="flex justify-between">
        {step > 0 ? (
          <Button variant="outline" onClick={prevStep}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        ) : (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        
        {step < totalSteps - 1 ? (
          <Button onClick={nextStep}>
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={createCustomPreset}>
            <Save className="mr-2 h-4 w-4" />
            Save & Apply
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

// Missing icons from the imports
const Headphones = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
  </svg>
);

const CheckCircle = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

export default CalibrationWizard;