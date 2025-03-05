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

interface EQControlsProps {
  // EQ state
  isEQEnabled: boolean;
  isSplitEarMode: boolean;
  splitEarConfig: SplitEarConfig;
  leftEarEnabled?: boolean;
  rightEarEnabled?: boolean;
  
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
  onEQToggle,
  onSplitEarToggle,
  onLeftEarToggle,
  onRightEarToggle,
  onBalanceChange,
  onResetEQ,
  onSavePreset,
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
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="eq" className="space-y-4">
          {/* EQ toggle and mode selector */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Switch 
                checked={isEQEnabled} 
                onCheckedChange={onEQToggle} 
                id="eq-toggle"
              />
              <label htmlFor="eq-toggle" className="text-sm font-medium">
                EQ {isEQEnabled ? "On" : "Off"}
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={onSavePreset}
                      className="h-8 text-xs"
                    >
                      <Save className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Save current EQ as preset</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={onSplitEarToggle}
                className="text-xs h-8"
              >
                {isSplitEarMode ? "Unified Mode" : "Split Ear Mode"}
              </Button>
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
                className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                onClick={onStartCalibration}
              >
                <Headphones className="h-4 w-4 mr-2" />
                Calibrate for Tinnitus
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          {/* Mode settings */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Audio Mode</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={isSplitEarMode ? "outline" : "secondary"}
                size="sm"
                onClick={() => !isSplitEarMode || onSplitEarToggle()}
                className="justify-start"
              >
                <Ear className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium">Unified</div>
                  <div className="text-xs opacity-70">Same EQ for both ears</div>
                </div>
              </Button>
              
              <Button
                variant={isSplitEarMode ? "secondary" : "outline"}
                size="sm"
                onClick={() => isSplitEarMode || onSplitEarToggle()}
                className="justify-start"
              >
                <div className="relative mr-2">
                  <Ear className="h-4 w-4" />
                  <Ear className="h-4 w-4 absolute top-0.5 left-0.5 opacity-30" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Split Ear</div>
                  <div className="text-xs opacity-70">Separate EQ per ear</div>
                </div>
              </Button>
            </div>
          </div>
          
          {/* Info about EQ */}
          <div className="p-4 bg-gray-50 rounded-md">
            <h3 className="text-sm font-medium mb-2">About This App</h3>
            <div className="text-xs text-gray-500 space-y-2">
              <p>
                This app is designed to help people with hearing loss or tinnitus. 
                You can create custom EQ presets to enhance your music listening experience.
              </p>
              <p>
                <strong>Split Ear Mode</strong> lets you apply different EQ settings to each ear,
                which can be helpful for those with asymmetrical hearing loss or tinnitus.
              </p>
              <p>
                <strong>Calibration Wizard</strong> helps you create a personalized EQ preset based 
                on your specific tinnitus frequency.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EQControls;