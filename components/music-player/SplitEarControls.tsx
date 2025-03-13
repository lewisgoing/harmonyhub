// Update components/music-player/SplitEarControls.tsx with the tabbed organization

import React from 'react';
import { Separator } from '@/components/ui/separator';
import { Preset, UserPreset, PresetType, SplitEarConfig } from './types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Headphones, Save, Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';

interface SplitEarControlsProps {
  // Preset data
  builtInPresets: Record<string, Preset>;
  userPresets: Record<string, UserPreset>;
  splitEarConfig: SplitEarConfig;
  
  // Callbacks
  onLeftEarPresetSelect: (preset: Preset) => void;
  onRightEarPresetSelect: (preset: Preset) => void;
  onDeletePreset?: (presetId: string) => void;
  onSaveLeftEarPreset?: () => void;
  onSaveRightEarPreset?: () => void;
  
  // Display options
  showUserPresets?: boolean;
  showDeleteButton?: boolean;
  isEQEnabled?: boolean;
  leftEarEnabled?: boolean;
  rightEarEnabled?: boolean;
}

/**
 * Split Ear Controls Component
 * Displays separate preset selections for left and right ears
 */
const SplitEarControls: React.FC<SplitEarControlsProps> = ({
  builtInPresets,
  userPresets,
  splitEarConfig,
  onLeftEarPresetSelect,
  onRightEarPresetSelect,
  onDeletePreset,
  onSaveLeftEarPreset,
  onSaveRightEarPreset,
  showUserPresets = true,
  showDeleteButton = true,
  isEQEnabled = true,
  leftEarEnabled = true,
  rightEarEnabled = true
}) => {
  // Button animation variants
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

  return (
<div className="space-y-6 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
      {/* Left ear presets */}
      <div className={`${!isEQEnabled || !leftEarEnabled ? 'opacity-60' : ''}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold flex items-center gap-1 text-blue-600">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Left Ear
          </h3>
          
          {onSaveLeftEarPreset && (
    <Button
      variant="ghost"
      size="sm"
      onClick={onSaveLeftEarPreset}
      className="h-6 px-2 text-xs flex items-center gap-1 text-blue-600 hover:bg-blue-50"
    >
      <Save className="h-3 w-3" />
      Save Preset
    </Button>
  )}
        </div>
        
        <Tabs defaultValue="standard" className="w-full">
          <TabsList className="grid grid-cols-3 mb-3">
            <TabsTrigger value="standard" className="text-xs">Standard</TabsTrigger>
            <TabsTrigger value="tinnitus" className="text-xs flex items-center gap-1">
              <Headphones className="h-3 w-3" />
              Tinnitus
            </TabsTrigger>
            <TabsTrigger value="custom" className="text-xs">Custom</TabsTrigger>
          </TabsList>
          
          {/* STANDARD PRESETS */}
          <TabsContent value="standard">
            <div className="grid grid-cols-2 gap-2">
              {Object.values(builtInPresets).map((preset, index) => {
                const isActive = splitEarConfig.leftEarPreset === preset.id;
                const style = preset.color;
                
                return (
                  <motion.div
                    key={preset.id}
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
                            className="text-sm font-medium rounded-md shadow-sm transition-colors w-full h-auto py-2 justify-start"
                            style={{
                              backgroundColor: isActive ? style.active.bg : style.inactive.bg,
                              color: isActive ? style.active.text : style.inactive.text,
                              border: "none",
                            }}
                            onClick={() => onLeftEarPresetSelect(preset)}
                          >
                            <div className="flex flex-col items-start">
                              <span className="font-medium">{preset.name}</span>
                              <span className="text-xs opacity-70">
                                {preset.description.slice(0, 18)}{preset.description.length > 18 ? '...' : ''}
                              </span>
                            </div>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{preset.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>
          
          {/* TINNITUS PRESETS */}
          <TabsContent value="tinnitus">
            <div className="grid grid-cols-2 gap-2">
              {Object.values(userPresets)
                .filter(preset => preset.isCalibrated)
                .map((preset, index) => {
                  const isActive = splitEarConfig.leftEarPreset === preset.id;
                  const style = preset.color;
                  
                  return (
                    <motion.div
                      key={preset.id}
                      custom={index}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      whileTap="tap"
                      variants={buttonVariants}
                      className="relative group"
                    >
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              className="text-sm font-medium rounded-md shadow-sm transition-colors w-full h-auto py-2 justify-start"
                              style={{
                                backgroundColor: isActive ? style.active.bg : style.inactive.bg,
                                color: isActive ? style.active.text : style.inactive.text,
                                border: "none",
                              }}
                              onClick={() => onLeftEarPresetSelect(preset)}
                            >
                              <div className="flex flex-col items-start">
                                <span className="font-medium">{preset.name}</span>
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
                          <TooltipContent side="right">
                            <div className="space-y-1 max-w-xs">
                              <p className="font-medium">{preset.name}</p>
                              <p className="text-xs">{preset.description}</p>
                              {preset.tinnitusCenterFreq && (
                                <p className="text-xs">
                                  Calibrated for tinnitus at {preset.tinnitusCenterFreq.toFixed(0)}Hz
                                </p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      {/* Delete button */}
                      {showDeleteButton && onDeletePreset && (
                        <div className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              
              {Object.values(userPresets).filter(preset => preset.isCalibrated).length === 0 && (
                <div className="col-span-2 p-4 text-center text-muted-foreground bg-purple-50 rounded-md">
                  <Headphones className="h-5 w-5 mx-auto mb-2 text-purple-500" />
                  <p className="text-sm text-purple-700">No tinnitus presets yet</p>
                  <p className="text-xs mt-1 text-purple-600">
                    Use the calibration wizard to create a personalized tinnitus preset
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* CUSTOM PRESETS */}
          <TabsContent value="custom">
            <div className="grid grid-cols-2 gap-2">
              {Object.values(userPresets)
                .filter(preset => !preset.isCalibrated)
                .map((preset, index) => {
                  const isActive = splitEarConfig.leftEarPreset === preset.id;
                  const style = preset.color;
                  
                  return (
                    <motion.div
                      key={preset.id}
                      custom={index}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      whileTap="tap"
                      variants={buttonVariants}
                      className="relative group"
                    >
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              className="text-sm font-medium rounded-md shadow-sm transition-colors w-full h-auto py-2 justify-start"
                              style={{
                                backgroundColor: isActive ? style.active.bg : style.inactive.bg,
                                color: isActive ? style.active.text : style.inactive.text,
                                border: "none",
                              }}
                              onClick={() => onLeftEarPresetSelect(preset)}
                            >
                              <div className="flex flex-col items-start">
                                <span className="font-medium">{preset.name}</span>
                                <span className="text-xs opacity-70">
                                  {formatDate(preset.dateCreated)}
                                </span>
                              </div>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <div className="space-y-1 max-w-xs">
                              <p className="font-medium">{preset.name}</p>
                              <p className="text-xs">{preset.description}</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      {/* Delete button */}
                      {showDeleteButton && onDeletePreset && (
                        <div className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              
              {Object.values(userPresets).filter(preset => !preset.isCalibrated).length === 0 && (
                <div className="col-span-2 p-4 text-center text-muted-foreground bg-gray-50 rounded-md">
                  <Save className="h-5 w-5 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No custom presets yet</p>
                  <p className="text-xs mt-1">
                    Adjust the EQ and save your settings
                  </p>
                  {onSaveLeftEarPreset && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="mt-3"
                      onClick={onSaveLeftEarPreset}
                    >
                      <Save className="h-3 w-3 mr-1" />
                      Save EQ Preset
                    </Button>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="md:hidden">
    <Separator className="opacity-30" />
  </div>
      
      {/* Right ear presets */}
      <div className={`${!isEQEnabled || !rightEarEnabled ? 'opacity-60' : ''}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold flex items-center gap-1 text-red-600">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            Right Ear
          </h3>

            {/* Add a save button specific to right ear */}
  {onSaveRightEarPreset && (
    <Button
      variant="ghost"
      size="sm"
      onClick={onSaveRightEarPreset}
      className="h-6 px-2 text-xs flex items-center gap-1 text-red-600 hover:bg-red-50"
    >
      <Save className="h-3 w-3" />
      Save Preset
    </Button>
  )}
        </div>
        
        <Tabs defaultValue="standard" className="w-full">
          <TabsList className="grid grid-cols-3 mb-3">
            <TabsTrigger value="standard" className="text-xs">Standard</TabsTrigger>
            <TabsTrigger value="tinnitus" className="text-xs flex items-center gap-1">
              <Headphones className="h-3 w-3" />
              Tinnitus
            </TabsTrigger>
            <TabsTrigger value="custom" className="text-xs">Custom</TabsTrigger>
          </TabsList>
          
          {/* STANDARD PRESETS */}
          <TabsContent value="standard">
            <div className="grid grid-cols-2 gap-2">
              {Object.values(builtInPresets).map((preset, index) => {
                const isActive = splitEarConfig.rightEarPreset === preset.id;
                const style = preset.color;
                
                return (
                  <motion.div
                    key={preset.id}
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
                            className="text-sm font-medium rounded-md shadow-sm transition-colors w-full h-auto py-2 justify-start"
                            style={{
                              backgroundColor: isActive ? style.active.bg : style.inactive.bg,
                              color: isActive ? style.active.text : style.inactive.text,
                              border: "none",
                            }}
                            onClick={() => onRightEarPresetSelect(preset)}
                          >
                            <div className="flex flex-col items-start">
                              <span className="font-medium">{preset.name}</span>
                              <span className="text-xs opacity-70">
                                {preset.description.slice(0, 18)}{preset.description.length > 18 ? '...' : ''}
                              </span>
                            </div>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{preset.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>
          
          {/* TINNITUS PRESETS */}
          <TabsContent value="tinnitus">
            <div className="grid grid-cols-2 gap-2">
              {Object.values(userPresets)
                .filter(preset => preset.isCalibrated)
                .map((preset, index) => {
                  const isActive = splitEarConfig.rightEarPreset === preset.id;
                  const style = preset.color;
                  
                  return (
                    <motion.div
                      key={preset.id}
                      custom={index}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      whileTap="tap"
                      variants={buttonVariants}
                      className="relative group"
                    >
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              className="text-sm font-medium rounded-md shadow-sm transition-colors w-full h-auto py-2 justify-start"
                              style={{
                                backgroundColor: isActive ? style.active.bg : style.inactive.bg,
                                color: isActive ? style.active.text : style.inactive.text,
                                border: "none",
                              }}
                              onClick={() => onRightEarPresetSelect(preset)}
                            >
                              <div className="flex flex-col items-start">
                                <span className="font-medium">{preset.name}</span>
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
                          <TooltipContent side="right">
                            <div className="space-y-1 max-w-xs">
                              <p className="font-medium">{preset.name}</p>
                              <p className="text-xs">{preset.description}</p>
                              {preset.tinnitusCenterFreq && (
                                <p className="text-xs">
                                  Calibrated for tinnitus at {preset.tinnitusCenterFreq.toFixed(0)}Hz
                                </p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      {/* Delete button */}
                      {showDeleteButton && onDeletePreset && (
                        <div className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              
              {Object.values(userPresets).filter(preset => preset.isCalibrated).length === 0 && (
                <div className="col-span-2 p-4 text-center text-muted-foreground bg-purple-50 rounded-md">
                  <Headphones className="h-5 w-5 mx-auto mb-2 text-purple-500" />
                  <p className="text-sm text-purple-700">No tinnitus presets yet</p>
                  <p className="text-xs mt-1 text-purple-600">
                    Use the calibration wizard to create a personalized tinnitus preset
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* CUSTOM PRESETS */}
          <TabsContent value="custom">
            <div className="grid grid-cols-2 gap-2">
              {Object.values(userPresets)
                .filter(preset => !preset.isCalibrated)
                .map((preset, index) => {
                  const isActive = splitEarConfig.rightEarPreset === preset.id;
                  const style = preset.color;
                  
                  return (
                    <motion.div
                      key={preset.id}
                      custom={index}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      whileTap="tap"
                      variants={buttonVariants}
                      className="relative group"
                    >
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              className="text-sm font-medium rounded-md shadow-sm transition-colors w-full h-auto py-2 justify-start"
                              style={{
                                backgroundColor: isActive ? style.active.bg : style.inactive.bg,
                                color: isActive ? style.active.text : style.inactive.text,
                                border: "none",
                              }}
                              onClick={() => onRightEarPresetSelect(preset)}
                            >
                              <div className="flex flex-col items-start">
                                <span className="font-medium">{preset.name}</span>
                                <span className="text-xs opacity-70">
                                  {formatDate(preset.dateCreated)}
                                </span>
                              </div>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <div className="space-y-1 max-w-xs">
                              <p className="font-medium">{preset.name}</p>
                              <p className="text-xs">{preset.description}</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      {/* Delete button */}
                      {showDeleteButton && onDeletePreset && (
                        <div className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              
              {Object.values(userPresets).filter(preset => !preset.isCalibrated).length === 0 && (
                <div className="col-span-2 p-4 text-center text-muted-foreground bg-gray-50 rounded-md">
                  <Save className="h-5 w-5 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No custom presets yet</p>
                  <p className="text-xs mt-1">
                    Adjust the EQ and save your settings
                  </p>
                  {onSaveRightEarPreset && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="mt-3"
                      onClick={onSaveRightEarPreset}
                    >
                      <Save className="h-3 w-3 mr-1" />
                      Save EQ Preset
                    </Button>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SplitEarControls;