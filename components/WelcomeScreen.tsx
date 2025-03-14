'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { 
  Headphones, 
  ArrowRight, 
  VolumeX,
  Settings,
  UserPlus,
  CheckCircle2,
  CloudUpload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOnboardingContext } from '@/contexts/onboarding-context';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Welcome screen shown to first-time visitors
 */
const WelcomeScreen: React.FC = () => {
  const [hasSeenWelcome, setHasSeenWelcome] = useLocalStorage('harmony-hub-welcome-seen', false);
  const [isVisible, setIsVisible] = useState(false);
  const { openOnboarding } = useOnboardingContext();
  
  useEffect(() => {
    // Show welcome screen if user hasn't seen it before
    if (!hasSeenWelcome) {
      // Short delay to ensure page is fully loaded
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [hasSeenWelcome]);
  
  const handleClose = () => {
    setIsVisible(false);
    setHasSeenWelcome(true);
  };
  
  const handleStartTour = () => {
    setIsVisible(false);
    setHasSeenWelcome(true);
    openOnboarding();
  };
  
  if (!isVisible) return null;
  
  return (
    <AnimatePresence>
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
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 relative">
            <div className="absolute top-1/2 -translate-y-1/2 right-6 opacity-20">
              <Headphones className="w-24 h-24" />
            </div>
            <h1 className="text-2xl font-bold mb-2 relative z-10">Welcome to Harmony Hub</h1>
            <p className="text-white/90 max-w-xs relative z-10">
              Enhance your music listening experience, especially designed for those with hearing impairments or tinnitus.
            </p>
          </div>
          
          {/* Features */}
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-3">Key Features:</h2>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-purple-100 p-2 rounded-full">
                  <Headphones className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Personalized EQ</h3>
                  <p className="text-xs text-gray-600">
                    Customize frequency levels to match your hearing profile
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <VolumeX className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Tinnitus Calibration</h3>
                  <p className="text-xs text-gray-600">
                    Create sound profiles matched to your specific tinnitus frequency
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <Settings className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Split Ear Mode</h3>
                  <p className="text-xs text-gray-600">
                    Configure different settings for each ear
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-amber-100 p-2 rounded-full">
                  <CloudUpload className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Cloud Sync</h3>
                  <p className="text-xs text-gray-600">
                    Save your presets and access them from any device
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="p-6 bg-gray-50 flex flex-col space-y-3">
            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700"
              onClick={handleStartTour}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Show Me How It Works
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleClose}
            >
              Get Started Now
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            
            <div className="text-center text-xs text-gray-500 mt-2">
              <p>Created by Hearing Heroes for INFO Capstone 24-25</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WelcomeScreen;