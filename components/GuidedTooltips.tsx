'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalStorage } from '../hooks/use-local-storage';
import { 
  ArrowRight, 
  X, 
  Headphones, 
  Volume2, 
  Sliders, 
  Split, 
  Music
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TooltipProps {
  id: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  targetSelector: string;
  icon?: React.ReactNode;
  delay?: number;
  onComplete?: () => void;
  onDismiss?: () => void;
}

/**
 * A system for highlighting UI elements with guided tooltips
 * that appear in sequence to teach users about the interface
 */
const GuidedTooltip: React.FC<TooltipProps> = ({
  id,
  title,
  content,
  position,
  targetSelector,
  icon,
  delay = 0,
  onComplete,
  onDismiss
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [hasShown, setHasShown] = useLocalStorage(`tooltip-shown-${id}`, false);
  
  useEffect(() => {
    // Don't show if already seen
    if (hasShown) return;
    
    // Delay showing the tooltip
    const timer = setTimeout(() => {
      const element = document.querySelector(targetSelector);
      if (element) {
        const rect = element.getBoundingClientRect();
        setCoords({
          x: rect.left + window.scrollX,
          y: rect.top + window.scrollY,
          width: rect.width,
          height: rect.height
        });
        setIsVisible(true);
      }
    }, delay);
    
    return () => clearTimeout(timer);
  }, [targetSelector, delay, hasShown]);
  
  // If the window resizes, update position
  useEffect(() => {
    const handleResize = () => {
      const element = document.querySelector(targetSelector);
      if (element && isVisible) {
        const rect = element.getBoundingClientRect();
        setCoords({
          x: rect.left + window.scrollX,
          y: rect.top + window.scrollY,
          width: rect.width,
          height: rect.height
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [targetSelector, isVisible]);
  
  // Calculate tooltip position based on target element
  const getTooltipStyle = () => {
    let style: React.CSSProperties = { position: 'absolute' };
    
    switch (position) {
      case 'top':
        style.bottom = `calc(100% - ${coords.y}px + 10px)`;
        style.left = `${coords.x + coords.width / 2}px`;
        style.transform = 'translateX(-50%)';
        break;
      case 'bottom':
        style.top = `${coords.y + coords.height + 10}px`;
        style.left = `${coords.x + coords.width / 2}px`;
        style.transform = 'translateX(-50%)';
        break;
      case 'left':
        style.top = `${coords.y + coords.height / 2}px`;
        style.right = `calc(100% - ${coords.x}px + 10px)`;
        style.transform = 'translateY(-50%)';
        break;
      case 'right':
        style.top = `${coords.y + coords.height / 2}px`;
        style.left = `${coords.x + coords.width + 10}px`;
        style.transform = 'translateY(-50%)';
        break;
    }
    
    return style;
  };
  
  // Get arrow position class
  const getArrowClass = () => {
    switch (position) {
      case 'top': return 'bottom-[-8px] left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent';
      case 'bottom': return 'top-[-8px] left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent';
      case 'left': return 'right-[-8px] top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent';
      case 'right': return 'left-[-8px] top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent';
    }
  };
  
  const handleComplete = () => {
    setIsVisible(false);
    setHasShown(true);
    if (onComplete) {
      onComplete();
    }
  };
  
  const handleDismiss = () => {
    setIsVisible(false);
    setHasShown(true);
    if (onDismiss) {
      onDismiss();
    }
  };
  
  if (!isVisible || hasShown) return null;
  
  return (
    <div
      className="fixed top-0 left-0 w-full h-full z-50 pointer-events-none"
      style={{ zIndex: 9999 }}
    >
      {/* Highlighter for target element */}
      <div 
        className="absolute bg-purple-500 opacity-20 rounded-md pointer-events-none"
        style={{
          left: coords.x - 4,
          top: coords.y - 4,
          width: coords.width + 8,
          height: coords.height + 8,
          animation: 'pulse 2s infinite'
        }}
      />
      
      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="absolute bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-64 pointer-events-auto"
        style={getTooltipStyle()}
      >
        {/* Arrow */}
        <div 
          className={`absolute w-0 h-0 border-8 border-white ${getArrowClass()}`} 
        />
        
        {/* Content */}
        <div className="relative">
          <div className="flex items-start mb-2">
            {icon && <div className="mr-2 text-purple-600">{icon}</div>}
            <div className="flex-1">
              <h4 className="font-bold text-sm">{title}</h4>
              <p className="text-xs text-gray-600">{content}</p>
            </div>
            <button 
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex justify-end">
            <Button 
              size="sm" 
              onClick={handleComplete}
              className="text-xs h-7 bg-purple-600 hover:bg-purple-700"
            >
              Got it
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * Display a sequence of guided tooltips
 */
export const GuidedTour: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isTourActive, setIsTourActive] = useLocalStorage('harmony-hub-tour-active', true);
  
  const tourSteps = [
    {
      id: 'player-controls',
      title: 'Play Music',
      content: 'Start playing music with our default tracks or add your own.',
      position: 'bottom' as const,
      targetSelector: '.player-controls-play-button',
      icon: <Music className="h-4 w-4" />,
      delay: 1000
    },
    {
      id: 'eq-visualization',
      title: 'Adjust EQ',
      content: 'Drag these points up or down to customize frequencies. Double-click for more options.',
      position: 'top' as const,
      targetSelector: '.eq-visualization',
      icon: <Sliders className="h-4 w-4" />,
      delay: 500
    },
    {
      id: 'split-ear-toggle',
      title: 'Split Ear Mode',
      content: 'Toggle this to set different EQ settings for each ear.',
      position: 'bottom' as const,
      targetSelector: '.split-ear-toggle',
      icon: <Split className="h-4 w-4" />,
      delay: 500
    },
    {
      id: 'tinnitus-calibration',
      title: 'Tinnitus Calibration',
      content: 'Create a personalized preset tailored to your specific tinnitus frequency.',
      position: 'left' as const,
      targetSelector: '.tinnitus-calibration-button',
      icon: <Headphones className="h-4 w-4" />,
      delay: 500
    }
  ];
  
  // Advance to next step
  const goToNextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // End tour
      setIsTourActive(false);
    }
  };
  
  // Skip the entire tour
  const skipTour = () => {
    setIsTourActive(false);
  };
  
  if (!isTourActive) return null;
  
  return (
    <AnimatePresence>
      {tourSteps.map((step, index) => (
        index === currentStep && (
          <GuidedTooltip
            key={step.id}
            id={step.id}
            title={step.title}
            content={step.content}
            position={step.position}
            targetSelector={step.targetSelector}
            icon={step.icon}
            delay={step.delay}
            onComplete={goToNextStep}
            onDismiss={skipTour}
          />
        )
      ))}
    </AnimatePresence>
  );
};

export default GuidedTour;