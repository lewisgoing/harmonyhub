"use client";
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sliders, 
  Headphones, 
  RotateCcw, 
  Save,
  Settings,
  VolumeX,
  Volume2,
  Ear
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SplitEarConfig } from './types';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Label } from '../ui/label';

interface EQControlsProps {
  // EQ state
  isEQEnabled: boolean;
  isSplitEarMode: boolean;
  splitEarConfig: SplitEarConfig;
  leftEarEnabled?: boolean;
  rightEarEnabled?: boolean;
  maxGainRange: 12 | 24 | 36 | 48;
  maxQValue: 10 | 20 | 30;
  onMaxGainRangeChange: (value: 12 | 24 | 36 | 48) => void;
  onMaxQValueChange: (value: 10 | 20 | 30) => void;
  
  // Visualization settings
  dbRange?: number;
  onDbRangeChange?: (value: number) => void;
  
  // Callbacks
  onEQToggle: () => void;
  onSplitEarToggle: () => void;
  onLeftEarToggle?: () => void;
  onRightEarToggle?: () => void;
  onBalanceChange: (value: number[]) => void;
  onResetEQ: () => void;
  onSavePreset?: () => void;
  
  // Optional active tab
  activeTab?: string;
  onTabChange?: (value: string) => void;
  
  // Additional controls
  showCalibration?: boolean;
  onStartCalibration?: () => void;
}

/**
 * EQ Controls Component
 */
const EQControls: React.FC<EQControlsProps> = ({
  isEQEnabled,
  isSplitEarMode,
  splitEarConfig,
  leftEarEnabled = true,
  rightEarEnabled = true,
  dbRange = 48,
  onDbRangeChange,
  onEQToggle,
  onSplitEarToggle,
  onLeftEarToggle,
  onRightEarToggle,
  onBalanceChange,
  onResetEQ,
  onSavePreset,
  maxGainRange,
  maxQValue,
  onMaxGainRangeChange,
  onMaxQValueChange,
  activeTab = 'eq',
  onTabChange,
  showCalibration = true,
  onStartCalibration
}) => {
  return (
<div className="border-t border-gray-100 pt-4">
  <Tabs 
    defaultValue={activeTab} 
    value={activeTab}
    onValueChange={onTabChange}
  >
    <TabsList className="grid grid-cols-2 mb-4">
      <TabsTrigger value="eq" className="text-xs">
        <Sliders className="h-3 w-3 mr-1" />
        Equalizer
      </TabsTrigger>
      <TabsTrigger value="settings" className="text-xs">
        <Settings className="h-3 w-3 mr-1" />
        Settings
        <span className="ml-1 text-[9px] bg-blue-100 text-blue-700 px-1 rounded">Soon</span>
      </TabsTrigger>
    </TabsList>
    
    <TabsContent value="eq" className="space-y-4">
      {/* EQ toggle and mode selector */}
      <div className="relative flex justify-center items-center py-2">
    {/* Left toggle, positioned absolutely */}
    <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center space-x-2">
      <Switch 
        checked={isEQEnabled} 
        onCheckedChange={onEQToggle} 
        id="eq-toggle"
      />
      <label htmlFor="eq-toggle" className="text-sm font-medium">
        EQ {isEQEnabled ? "On" : "Off"}
      </label>
    </div>
    
    {/* Centered buttons */}
    <div className="flex items-center gap-4 px-4">
      <button
        type="button"
        onClick={() => !isSplitEarMode ? null : onSplitEarToggle()}
        className={`transition-all duration-300 rounded-full px-3 py-1 text-xs flex items-center gap-1 cursor-pointer hover:shadow ${
          !isSplitEarMode 
            ? 'bg-orange-100 text-orange-700 border border-orange-200 font-medium ring-1 ring-orange-300' 
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200'
        }`}
        aria-pressed={!isSplitEarMode}
        aria-label="Switch to unified mode"
      >
        <span className={`h-2 w-2 rounded-full ${!isSplitEarMode ? 'bg-orange-500' : 'bg-gray-300'}`}></span>
        Unified Mode
      </button>
      
      <button
        type="button"
        onClick={() => isSplitEarMode ? null : onSplitEarToggle()}
        className={`transition-all duration-300 rounded-full px-3 py-1 text-xs flex items-center gap-1 cursor-pointer hover:shadow ${
          isSplitEarMode 
            ? 'bg-gradient-to-r from-blue-100 to-red-100 text-blue-700 border border-blue-200 font-medium ring-1 ring-blue-300' 
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200'
        }`}
        aria-pressed={isSplitEarMode}
        aria-label="Switch to split ear mode"
      >
        <div className="flex gap-1">
          <span className={`h-2 w-2 rounded-full ${isSplitEarMode ? 'bg-blue-500' : 'bg-gray-300'}`}></span>
          <span className={`h-2 w-2 rounded-full ${isSplitEarMode ? 'bg-red-500' : 'bg-gray-300'}`}></span>
        </div>
        Split Ear Mode
      </button>
    </div>


</div>


          
          {/* Individual ear controls for split ear mode */}
          {isSplitEarMode && onLeftEarToggle && onRightEarToggle && (
            <div className="flex justify-between items-center gap-4 p-2 bg-slate-50 rounded-md">
              {/* Left ear toggle */}
              <div className="flex items-center gap-2">
                <Switch 
                  checked={leftEarEnabled} 
                  onCheckedChange={onLeftEarToggle} 
                  id="left-ear-toggle"
                />
                <label htmlFor="left-ear-toggle" className="text-xs font-medium flex items-center">
                  <Badge className="mr-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
                  Left Ear
                </label>
              </div>
              
              {/* Right ear toggle */}
              <div className="flex items-center gap-2">
                <Switch 
                  checked={rightEarEnabled} 
                  onCheckedChange={onRightEarToggle} 
                  id="right-ear-toggle"
                />
                <label htmlFor="right-ear-toggle" className="text-xs font-medium flex items-center">
                  <Badge className="mr-1 h-1.5 w-1.5 rounded-full bg-red-500" />
                  Right Ear
                </label>
              </div>
            </div>
          )}
          
          {/* Balance control */}
          <div className="space-y-2 mt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Balance</span>
              <Button 
                onClick={onResetEQ} 
                size="sm" 
                variant="outline" 
                className="h-7 text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset EQ
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs">L</span>
              <Slider 
                value={[splitEarConfig.balance]} 
                min={0} 
                max={1} 
                step={0.01} 
                onValueChange={onBalanceChange}
                disabled={!isEQEnabled}
              />
              <span className="text-xs">R</span>
            </div>
          </div>
          
          {/* Calibration button */}
          {showCalibration && onStartCalibration && (
            <div className="pt-3 mt-1 border-t border-gray-100">
<Button 
  variant="secondary" 
  className="flex-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 animate-subtle-pulse"
  onClick={onStartCalibration}
>
  <Headphones className="h-4 w-4 mr-2" />
  Calibrate for Tinnitus
</Button>

              
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
  <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg">
    <div className="bg-blue-50 text-blue-700 p-3 rounded-full mb-4">
      <Settings className="h-6 w-6" />
    </div>
    <h3 className="text-lg font-medium">Advanced Settings</h3>
    <p className="text-sm text-center text-gray-500 mt-2 mb-4">
      Additional settings like gain range, Q values, and more advanced controls are coming soon!
    </p>
    <p className="text-xs text-blue-600">
      We're working hard to bring you more customization options.
    </p>
  </div>
</TabsContent>
      </Tabs>
    </div>
  );
};

export default EQControls;