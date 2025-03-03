"use client";
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sliders, Headphones, RotateCcw } from 'lucide-react';
import { SplitEarConfig } from './types';

interface EQControlsProps {
  // EQ state
  isEQEnabled: boolean;
  isSplitEarMode: boolean;
  splitEarConfig: SplitEarConfig;
  
  // Callbacks
  onEQToggle: () => void;
  onSplitEarToggle: () => void;
  onBalanceChange: (value: number[]) => void;
  onResetEQ: () => void;
  
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
  onEQToggle,
  onSplitEarToggle,
  onBalanceChange,
  onResetEQ,
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
            <Headphones className="h-3 w-3 mr-1" />
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
            <div className="pt-4">
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={onStartCalibration}
              >
                <Headphones className="h-4 w-4 mr-2" />
                Calibrate for Tinnitus
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          {/* Channel mode (coming soon) */}
          <div className="p-4 bg-gray-50 rounded-md">
            <h3 className="text-sm font-medium">Coming Soon</h3>
            <p className="text-xs text-gray-500 mt-1">
              Additional settings for channel mode (mono/stereo) and solo mode
              will be available in a future update.
            </p>
          </div>
          
          {/* Info about EQ */}
          <div className="text-xs text-gray-500 space-y-2">
            <p>
              Split Ear Mode lets you apply different EQ settings to each ear,
              which can be helpful for those with asymmetrical hearing loss or tinnitus.
            </p>
            <p>
              Use the Calibration Wizard to create a personalized EQ preset based 
              on your specific tinnitus frequency.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EQControls;