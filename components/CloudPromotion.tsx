"use client";

import { useState } from 'react';
import { Cloud, CloudOff, X, Check } from 'lucide-react';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CloudPromotionProps {
  trigger?: 'presets' | 'calibration' | 'general';
}

/**
 * Cloud Promotion Component
 * Shows benefits of cloud sync for non-logged in users
 */
export default function CloudPromotion({ trigger = 'general' }: CloudPromotionProps) {
  const { user } = useAuthContext();
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  // Only show for non-logged in users and if not dismissed
  if (user || dismissed) {
    return null;
  }

  // Different messages based on context
  const getMessage = () => {
    switch (trigger) {
      case 'presets':
        return "Create an account to access your custom presets on any device";
      case 'calibration':
        return "Sign in to save your calibration results and use them anywhere";
      default:
        return "Sign in to save your settings to the cloud";
    }
  };

  return (
    <Alert className="my-2 bg-blue-50 text-blue-800 border-blue-200">
      <CloudOff className="h-4 w-4 text-blue-500 mt-3" />
      <AlertDescription className="flex items-center justify-between mt-2">
        <span>{getMessage()}</span>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            className="h-7 bg-white border-blue-200 hover:bg-blue-50"
            onClick={() => router.push('/login')}
          >
            <Cloud className="mr-1 h-3 w-3" />
            <Check className="mr-1 h-3 w-3" />
            Sign in
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-7 hover:bg-blue-100" 
            onClick={() => setDismissed(true)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}