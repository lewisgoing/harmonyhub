'use client';
import React, { createContext, useContext, useState } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';

// Define the shape of our context
interface OnboardingContextType {
  isOnboardingOpen: boolean;
  hasSeenOnboarding: boolean;
  openOnboarding: (trigger?: string | null) => void;
  closeOnboarding: () => void;
  completeOnboarding: () => void;
  activeTrigger: string | null;
}

// Create the context with default values
const OnboardingContext = createContext<OnboardingContextType>({
  isOnboardingOpen: false,
  hasSeenOnboarding: false,
  openOnboarding: () => {},
  closeOnboarding: () => {},
  completeOnboarding: () => {},
  activeTrigger: null
});

// Custom hook to use the onboarding context
export const useOnboardingContext = () => useContext(OnboardingContext);

// Provider component
export const OnboardingContextProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useLocalStorage('harmony-hub-onboarding-complete', false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [activeTrigger, setActiveTrigger] = useState<string | null>(null);
  
  // Remove the automatic popup useEffect - we'll show a welcome callout instead
  
  const openOnboarding = (trigger: string | null = null) => {
    setActiveTrigger(trigger);
    setIsOnboardingOpen(true);
  };
  
  const closeOnboarding = () => {
    setIsOnboardingOpen(false);
  };
  
  const completeOnboarding = () => {
    setHasSeenOnboarding(true);
    setIsOnboardingOpen(false);
  };
  
  return (
    <OnboardingContext.Provider 
      value={{ 
        isOnboardingOpen, 
        hasSeenOnboarding, 
        openOnboarding, 
        closeOnboarding, 
        completeOnboarding,
        activeTrigger
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};