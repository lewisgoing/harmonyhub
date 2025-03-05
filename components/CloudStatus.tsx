"use client";

import { CloudOff, Check, Cloud, CloudSun } from 'lucide-react';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/router';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

/**
 * Cloud Status Component
 * Shows the current sync status and provides options to login/signup
 */
export default function CloudStatus() {
  const { user } = useAuthContext();
  // const router = useRouter();

  if (user) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div 
              className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <CloudSun className="h-3 w-3" />
              <span>Synced</span>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Your presets are synced to the cloud</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              variant="ghost" 
              size="sm" 
              // onClick={() => router.push('/login')}
              className="h-6 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            >
              <CloudOff className="h-3 w-3" />
              <span>Local only</span>
            </Button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="text-xs font-medium">Sign in to sync your presets</p>
            <p className="text-xs text-gray-500">
              Create custom presets that follow you everywhere
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}