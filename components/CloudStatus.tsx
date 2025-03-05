"use client";

import { CloudOff, Check, Cloud } from 'lucide-react';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Cloud Status Component
 * Shows the current sync status and provides options to login/signup
 */
export default function CloudStatus() {
  const { user } = useAuthContext();
  const router = useRouter();

  if (user) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <Cloud className="h-3 w-3" />
              <Check className="h-3 w-3" />
              <span>Synced</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Your presets are synced to the cloud</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/login')}
            className="h-6 flex items-center gap-1 text-xs text-muted-foreground"
          >
            <CloudOff className="h-3 w-3" />
            <span>Local only</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            Sign in to sync your presets across devices
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}