'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { useOnboardingContext } from '@/contexts/onboarding-context';

export const HelpButton: React.FC<{triggerFeature?: string; className?: string}> = ({ 
  triggerFeature = null,
  className = ""
}) => {
  const { openOnboarding } = useOnboardingContext();
  
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={() => openOnboarding(triggerFeature)}
      className={`text-xs flex items-center gap-1 ${className}`}
    >
      <HelpCircle className="h-3 w-3" />
      How It Works
    </Button>
  );
};

export default HelpButton;