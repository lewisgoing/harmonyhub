"use client";
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Preset, UserPreset, PresetType } from './types';
import { Trash2, Calendar, PlusCircle, Headphones } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface PresetsProps {
  // Preset data
  presets: Record<string, Preset>;
  userPresets: Record<string, UserPreset>;
  activePresetId: string;
  
  // Which ear this preset panel is for (if applicable)
  ear?: 'left' | 'right';
  
  // Callbacks
  onPresetSelect: (preset: Preset) => void;
  onDeletePreset?: (presetId: string) => void;
  onSavePreset?: () => void;
  
  // Display options
  showUserPresets?: boolean;
  showDeleteButton?: boolean;
  showLabel?: boolean;
  labelText?: string;
  className?: string;
}

/**
 * Presets Component
 */
const Presets: React.FC<PresetsProps> = ({
  presets,
  userPresets,
  activePresetId,
  ear,
  onPresetSelect,
  onDeletePreset,
  onSavePreset,
  showUserPresets = true,
  showDeleteButton = true,
  showLabel = true,
  labelText,
  className = ''
}) => {
  // Format date for display
  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return '';
    }
  };
  
  // Get label text based on ear
  const getLabel = (): string => {
    if (labelText) return labelText;
    if (ear === 'left') return 'Left Ear';
    if (ear === 'right') return 'Right Ear';
    return 'Presets';
  };
  
  // Get class name for active ear
  const getEarClass = (): string => {
    if (ear === 'left') return 'border-l-2 border-blue-500 pl-2';
    if (ear === 'right') return 'border-l-2 border-red-500 pl-2';
    return '';
  };

  // Animation variants for preset buttons
  const buttonVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
        ease: "easeOut"
      }
    }),
    hover: { scale: 1.03, transition: { duration: 0.2 } },
    tap: { scale: 0.97, transition: { duration: 0.1 } }
  };
  
  return (
    <div className={`space-y-4 ${className} relative`}>
      {showLabel && (
        <div className={`flex items-center justify-between ${getEarClass()}`}>
          <p className="text-sm font-medium">{getLabel()}</p>
          
          {onSavePreset && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSavePreset}
              className="h-6 px-2 text-xs flex items-center gap-1"
            >
              <PlusCircle className="h-3 w-3" />
              Save Current
            </Button>
          )}
        </div>
      )}
      
      {/* Built-in presets */}
      <div className="grid grid-cols-2 gap-2">
      {Object.values(userPresets).map((preset, index) => {
  const isActive = activePresetId === preset.id;
  const style = preset.color;
  
  return (
    <motion.div 
      key={preset.id} 
      className="relative group"
      custom={index}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
      variants={buttonVariants}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className={`text-sm font-medium rounded-md shadow-sm transition-colors w-full h-auto py-2 justify-start overflow-hidden ${
                preset.isCalibrated ? 'border-l-4 border-purple-500' : ''
              }`}
              style={{
                backgroundColor: isActive ? style.active.bg : style.inactive.bg,
                color: isActive ? style.active.text : style.inactive.text,
                border: preset.isCalibrated ? undefined : "none",
              }}
              onClick={() => onPresetSelect(preset)}
            >
              <div className="flex flex-col items-start">
                {preset.isCalibrated && (
                  <div className="flex items-center gap-1 text-[9px] opacity-80 mb-0.5">
                    <Headphones className="h-2 w-2" />
                    <span>Calibrated</span>
                  </div>
                )}
                
                <span className="font-medium">{preset.name}</span>
                
                {/* Show tinnitus frequency if available */}
                {preset.tinnitusCenterFreq && (
                  <span className="text-xs opacity-70">
                    {preset.tinnitusCenterFreq >= 1000 ? 
                      `${(preset.tinnitusCenterFreq/1000).toFixed(1)}kHz` : 
                      `${preset.tinnitusCenterFreq.toFixed(0)}Hz`}
                  </span>
                )}
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1 max-w-xs">
              <p className="font-medium">{preset.name}</p>
              <p className="text-xs">{preset.description}</p>
              {preset.tinnitusCenterFreq && (
                <p className="text-xs">
                  {preset.isCalibrated ? 
                    `Calibrated for your tinnitus at ${preset.tinnitusCenterFreq.toFixed(0)}Hz` : 
                    `Tinnitus frequency: ${preset.tinnitusCenterFreq.toFixed(0)}Hz`}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </motion.div>
  );
})}
      </div>
      
{/* User presets (optional) */}
{showUserPresets && Object.keys(userPresets).length > 0 && (
  <div className="space-y-2">
    <div className="flex items-center">
      <Badge variant="outline" className="text-xs bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700">Custom</Badge>
    </div>
    
    <div className="grid grid-cols-2 gap-2">
      {Object.values(userPresets).map((preset, index) => {
        const isActive = activePresetId === preset.id;
        const style = preset.color;
        
        return (
          <motion.div 
            key={preset.id} 
            className="relative group"
            custom={index}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            whileTap="tap"
            variants={buttonVariants}
          >
            <TooltipProvider delayDuration={300} skipDelayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="text-sm font-medium rounded-md shadow-sm transition-colors w-full h-auto py-2 justify-start overflow-hidden"
                    style={{
                      backgroundColor: isActive ? style.active.bg : style.inactive.bg,
                      color: isActive ? style.active.text : style.inactive.text,
                      border: "none",
                    }}
                    onClick={() => onPresetSelect(preset)}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{preset.name}</span>
                      
                      {/* Show tinnitus frequency if available */}
                      {preset.tinnitusCenterFreq && (
                        <span className="text-xs opacity-70">
                          {preset.tinnitusCenterFreq.toFixed(0)}Hz
                        </span>
                      )}
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent       side="right" 
      align="center" 
      sideOffset={5} 
      className="z-50">
                  <div className="space-y-1 max-w-xs">
                    <p className="font-medium">{preset.name}</p>
                    <p className="text-xs">{preset.description}</p>
                    {preset.tinnitusCenterFreq && (
                      <p className="text-xs">Tinnitus frequency: {preset.tinnitusCenterFreq.toFixed(0)}Hz</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Delete button (only shows on hover) */}
            {showDeleteButton && onDeletePreset && (
              <motion.div
                className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                initial={{ opacity: 0, rotate: -45 }}
                whileHover={{ opacity: 1, rotate: 0, scale: 1.1 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full bg-white shadow border border-gray-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePreset(preset.id);
                  }}
                >
                  <Trash2 className="h-3 w-3 text-red-500" />
                </Button>
              </motion.div>
            )}
            
            {/* Date badge */}
            <div className="absolute -bottom-2 right-2 text-[10px] bg-white/80 rounded-full px-1.5 py-0.5 flex items-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
              <Calendar className="h-2 w-2 mr-0.5" />
              {formatDate(preset.dateCreated)}
            </div>
          </motion.div>
        );
      })}
    </div>
  </div>
)}
    </div>
  );
};

export default Presets;