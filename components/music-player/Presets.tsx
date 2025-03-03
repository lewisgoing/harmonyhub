"use client";
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Preset, UserPreset, PresetType } from './types';
import { Trash2, Edit, Calendar } from 'lucide-react';

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
    if (ear === 'left') return 'border-l-4 border-blue-500 pl-2';
    if (ear === 'right') return 'border-l-4 border-red-500 pl-2';
    return '';
  };
  
  return (
    <div className={`space-y-3 ${className}`}>
      {showLabel && (
        <div className={`flex items-center ${getEarClass()}`}>
          <p className="text-sm font-medium">{getLabel()}</p>
        </div>
      )}
      
      {/* Built-in presets */}
      <div className="flex flex-wrap gap-2">
        {Object.values(presets).map((preset) => {
          const isActive = activePresetId === preset.id;
          const style = preset.color;
          
          return (
            <Button
              key={preset.id}
              className="text-sm font-medium rounded-md shadow-sm transition-colors"
              style={{
                backgroundColor: isActive ? style.active.bg : style.inactive.bg,
                color: isActive ? style.active.text : style.inactive.text,
                padding: "8px 12px",
                border: "none",
              }}
              onClick={() => onPresetSelect(preset)}
              title={preset.description}
            >
              {preset.name}
            </Button>
          );
        })}
      </div>
      
      {/* User presets (optional) */}
      {showUserPresets && Object.keys(userPresets).length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center">
            <Badge variant="outline" className="text-xs">Custom</Badge>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {Object.values(userPresets).map((preset) => {
              const isActive = activePresetId === preset.id;
              const style = preset.color;
              
              return (
                <div key={preset.id} className="relative group">
                  <Button
                    className="text-sm font-medium rounded-md shadow-sm transition-colors"
                    style={{
                      backgroundColor: isActive ? style.active.bg : style.inactive.bg,
                      color: isActive ? style.active.text : style.inactive.text,
                      padding: "8px 12px",
                      border: "none",
                    }}
                    onClick={() => onPresetSelect(preset)}
                    title={preset.description}
                  >
                    {preset.name}
                    
                    {/* Show tinnitus frequency if available */}
                    {preset.tinnitusCenterFreq && (
                      <span className="ml-1 opacity-70 text-xs">
                        ({preset.tinnitusCenterFreq.toFixed(0)}Hz)
                      </span>
                    )}
                  </Button>
                  
                  {/* Delete button (only shows on hover) */}
                  {showDeleteButton && onDeletePreset && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-white shadow border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePreset(preset.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  )}
                  
                  {/* Date badge */}
                  <div className="absolute -bottom-2 right-2 text-[10px] bg-white/80 rounded-full px-1.5 py-0.5 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Calendar className="h-2 w-2 mr-0.5" />
                    {formatDate(preset.dateCreated)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Presets;