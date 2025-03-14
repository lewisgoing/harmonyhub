'use client';
import React from 'react';
import { useOnboardingContext } from '@/contexts/onboarding-context';
import OnboardingTour from '@/components/OnboardingTour';

export const OnboardingTourContainer: React.FC = () => {
  const { 
    isOnboardingOpen, 
    closeOnboarding, 
    completeOnboarding, 
    activeTrigger 
  } = useOnboardingContext();

  return (
    <OnboardingTour 
      isOpen={isOnboardingOpen}
      onClose={closeOnboarding}
      onComplete={completeOnboarding}
      onboardingTrigger={activeTrigger}
    />
  );
};

export default OnboardingTourContainer;