import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Headphones, 
  Music, 
  Sliders, 
  Split, 
  VolumeX,
  Save,
  CloudUpload,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const OnboardingTour = ({ 
  isOpen, 
  onClose, 
  onComplete, 
  onboardingTrigger = null 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  // Reset to specific step when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (onboardingTrigger) {
        const stepIndex = onboardingSteps.findIndex(step => step.id === onboardingTrigger);
        if (stepIndex !== -1) {
          setCurrentStep(stepIndex);
        } else {
          setCurrentStep(0);
        }
      } else {
        setCurrentStep(0);
      }
    }
  }, [isOpen, onboardingTrigger]);
  
  const onboardingSteps = [
    {
      id: 'welcome',
      title: 'Welcome to Harmony Hub',
      description: 'Enhance your music listening experience with personalized sound adjustments, especially designed for those with hearing impairments or tinnitus.',
      icon: <Headphones className="w-12 h-12 text-white" />,
      bgColor: 'from-purple-600 to-blue-600',
      features: [
        {
          title: 'Personalized Sound', 
          description: 'Tailor your audio to your unique hearing needs',
          icon: <Sliders className="h-5 w-5 text-purple-600" />
        },
        {
          title: 'Tinnitus Relief', 
          description: 'Targeted tools to help manage tinnitus',
          icon: <VolumeX className="h-5 w-5 text-blue-600" />
        },
        {
          title: 'Split Ear Control', 
          description: 'Different settings for each ear',
          icon: <Split className="h-5 w-5 text-green-600" />
        },
        {
          title: 'Cloud Sync', 
          description: 'Access your settings anywhere',
          icon: <CloudUpload className="h-5 w-5 text-amber-600" />
        }
      ]
    },
    {
      id: 'eq',
      title: 'Customizable Equalizer',
      description: 'Adjust frequency levels to match your hearing profile and enhance your listening experience.',
      icon: <Sliders className="w-12 h-12 text-white" />,
      bgColor: 'from-green-600 to-teal-600',
      features: [
        {
          title: 'Drag & Drop', 
          description: 'Adjust frequency points by dragging them up or down',
          icon: <Sliders className="h-5 w-5 text-green-600" />
        },
        {
          title: 'Fine-Tuning', 
          description: 'Double-click points to adjust width (Q-value)',
          icon: <Sliders className="h-5 w-5 text-green-600" />
        },
        {
          title: 'Save Presets', 
          description: 'Save your custom EQ settings for future use',
          icon: <Save className="h-5 w-5 text-green-600" />
        }
      ]
    },
    {
      id: 'split-ear',
      title: 'Split Ear Mode',
      description: 'Configure different EQ settings for each ear, perfect for asymmetric hearing conditions.',
      icon: <Split className="w-12 h-12 text-white" />,
      bgColor: 'from-orange-600 to-amber-600',
      features: [
        {
          title: 'Independent Control', 
          description: 'Configure each ear separately',
          icon: <Split className="h-5 w-5 text-orange-600" />
        },
        {
          title: 'Different Presets', 
          description: 'Apply different EQ presets to each ear',
          icon: <Save className="h-5 w-5 text-orange-600" />
        },
        {
          title: 'Balance Adjustment', 
          description: 'Fine-tune the balance between left and right',
          icon: <Sliders className="h-5 w-5 text-orange-600" />
        }
      ]
    },
    {
      id: 'tinnitus',
      title: 'Tinnitus Calibration',
      description: 'Create personalized sound profiles matched to your specific tinnitus frequency for better relief.',
      icon: <VolumeX className="w-12 h-12 text-white" />,
      bgColor: 'from-purple-600 to-indigo-600',
      features: [
        {
          title: 'Frequency Matching', 
          description: 'Identify your exact tinnitus frequency',
          icon: <VolumeX className="h-5 w-5 text-purple-600" />
        },
        {
          title: 'Custom Relief', 
          description: 'Create a notch filter at your tinnitus frequency',
          icon: <Headphones className="h-5 w-5 text-purple-600" />
        },
        {
          title: 'Based on Research', 
          description: 'Uses clinically-tested notch therapy approaches',
          icon: <CheckCircle2 className="h-5 w-5 text-purple-600" />
        }
      ]
    },
    {
      id: 'presets',
      title: 'Customizable Presets',
      description: 'Save your favorite EQ settings as presets or use our pre-configured options designed for common hearing needs.',
      icon: <Save className="w-12 h-12 text-white" />,
      bgColor: 'from-teal-600 to-cyan-600',
      features: [
        {
          title: 'Built-in Presets', 
          description: 'Try our presets designed for different hearing needs',
          icon: <Save className="h-5 w-5 text-teal-600" />
        },
        {
          title: 'Custom Presets', 
          description: 'Save your own EQ settings as custom presets',
          icon: <Save className="h-5 w-5 text-teal-600" />
        },
        {
          title: 'Tinnitus Presets', 
          description: 'Access your calibrated tinnitus presets',
          icon: <Headphones className="h-5 w-5 text-teal-600" />
        }
      ]
    },
    {
      id: 'player',
      title: 'Music Player',
      description: 'Enjoy music with your customized settings. You can use our built-in player with your customized EQ settings.',
      icon: <Music className="w-12 h-12 text-white" />,
      bgColor: 'from-blue-600 to-purple-600',
      features: [
        {
          title: 'Built-in Player', 
          description: 'Play music with your custom EQ settings',
          icon: <Music className="h-5 w-5 text-blue-600" />
        },
        {
          title: 'Direct Audio Files', 
          description: 'Add your own audio files via URL',
          icon: <Music className="h-5 w-5 text-blue-600" />
        },
        {
          title: 'Coming Soon', 
          description: 'YouTube and SoundCloud integration coming soon',
          icon: <Music className="h-5 w-5 text-blue-600" />
        }
      ]
    },
    {
        id: 'cloud',
        title: 'Cloud Sync',
        description: 'Save your presets and settings to the cloud, allowing you to access them from any device.',
        icon: <CloudUpload className="w-12 h-12 text-white" />,
        bgColor: 'from-blue-600 to-sky-600',
        features: [
          {
            title: 'Account Benefits', 
            description: 'Create an account to save settings to the cloud',
            icon: <CloudUpload className="h-5 w-5 text-blue-600" />
          },
          {
            title: 'Multi-device Access', 
            description: 'Access your settings from any device',
            icon: <CloudUpload className="h-5 w-5 text-blue-600" />
          },
          {
            title: 'Automatic Sync', 
            description: 'Changes automatically sync when you\'re signed in',
            icon: <CloudUpload className="h-5 w-5 text-blue-600" />
          }
        ]
      },
    {
      id: 'get-started',
      title: 'You\'re All Set!',
      description: 'Now youre ready to enjoy a personalized listening experience with Harmony Hub.',
      icon: <CheckCircle2 className="w-12 h-12 text-white" />,
      bgColor: 'from-green-600 to-emerald-600',
      features: [
        {
          title: 'Try Calibration', 
          description: 'We recommend trying the Tinnitus Calibration first',
          icon: <Headphones className="h-5 w-5 text-green-600" />
        },
        {
          title: 'Experiment', 
          description: 'Test different presets to find what works best',
          icon: <Sliders className="h-5 w-5 text-green-600" />
        },
        {
          title: 'Have Fun', 
          description: 'Enjoy music with your personalized settings',
          icon: <Music className="h-5 w-5 text-green-600" />
        }
      ]
    }
  ];
  
  const goToNextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };
  
  const goToPrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleClose = () => {
    onClose();
  };
  
  if (!isOpen) return null;
  
  const currentStepData = onboardingSteps[currentStep];
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden"
          >
            {/* Header */}
            <div className={`bg-gradient-to-r ${currentStepData.bgColor} text-white p-6 relative`}>
              <div className="absolute top-1/2 -translate-y-1/2 right-6 opacity-20">
                {currentStepData.icon}
              </div>
              <button 
                onClick={handleClose}
                className="absolute top-3 right-3 text-white/80 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-bold mb-2 relative z-10">{currentStepData.title}</h1>
              <p className="text-white/90 max-w-xs relative z-10">
                {currentStepData.description}
              </p>
            </div>
            
            {/* Features */}
            <div className="p-6">
              <div className="space-y-4">
                {currentStepData.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="bg-gray-100 p-2 rounded-full">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">{feature.title}</h3>
                      <p className="text-xs text-gray-600">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Actions */}
            <div className="p-6 bg-gray-50 flex items-center justify-between">
              <div className="flex space-x-1">
                {Array.from({ length: onboardingSteps.length }).map((_, index) => (
                  <div 
                    key={index}
                    className={`h-1.5 rounded-full ${
                      index === currentStep 
                        ? 'w-6 bg-blue-500' 
                        : 'w-2 bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              
              <div className="flex space-x-2">
                {currentStep > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={goToPrevStep}
                    className="h-9"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                )}
                
                <Button 
                  onClick={goToNextStep}
                  className="h-9"
                >
                  {currentStep === onboardingSteps.length - 1 ? 'Get Started' : 'Next'}
                  {currentStep !== onboardingSteps.length - 1 && (
                    <ArrowRight className="ml-2 h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OnboardingTour;