// tests/components/music-player/SplitEarControls.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SplitEarControls from '../../../components/music-player/SplitEarControls';
import { Preset, UserPreset } from '../../../components/music-player/types';

describe('SplitEarControls', () => {
  // Mock presets
  const mockBuiltInPresets: Record<string, Preset> = {
    flat: {
      id: 'flat',
      name: 'Flat',
      description: 'No equalization',
      color: { active: { bg: '#fff', text: '#000' }, inactive: { bg: '#eee', text: '#333' } },
      bands: []
    },
    notchFilter: {
      id: 'notchFilter',
      name: 'Notch Filter',
      description: 'Tinnitus relief',
      color: { active: { bg: '#fff', text: '#000' }, inactive: { bg: '#eee', text: '#333' } },
      bands: []
    }
  };
  
  const mockUserPresets: Record<string, UserPreset> = {};
  
  const mockSplitEarConfig = {
    leftEarPreset: 'flat',
    rightEarPreset: 'notchFilter',
    balance: 0.5
  };
  
  const mockOnLeftEarPresetSelect = jest.fn();
  const mockOnRightEarPresetSelect = jest.fn();
  const mockOnDeletePreset = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders split ear controls correctly', () => {
    render(
      <SplitEarControls
        builtInPresets={mockBuiltInPresets}
        userPresets={mockUserPresets}
        splitEarConfig={mockSplitEarConfig}
        onLeftEarPresetSelect={mockOnLeftEarPresetSelect}
        onRightEarPresetSelect={mockOnRightEarPresetSelect}
        onDeletePreset={mockOnDeletePreset}
        isEQEnabled={true}
        leftEarEnabled={true}
        rightEarEnabled={true}
      />
    );
    
    // Check that both left and right ear sections are rendered
    expect(screen.getByText(/Left Ear/i)).toBeInTheDocument();
    expect(screen.getByText(/Right Ear/i)).toBeInTheDocument();
    
    // Check that tabs are rendered
    expect(screen.getAllByText(/Standard/i).length).toBe(2); // One for each ear
    expect(screen.getAllByText(/Tinnitus/i).length).toBe(2);
    expect(screen.getAllByText(/Custom/i).length).toBe(2);
    
    // Check preset buttons
    expect(screen.getAllByText(/Flat/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Notch Filter/i).length).toBeGreaterThan(0);
  });

  test('selects left ear preset', () => {
    render(
      <SplitEarControls
        builtInPresets={mockBuiltInPresets}
        userPresets={mockUserPresets}
        splitEarConfig={mockSplitEarConfig}
        onLeftEarPresetSelect={mockOnLeftEarPresetSelect}
        onRightEarPresetSelect={mockOnRightEarPresetSelect}
        onDeletePreset={mockOnDeletePreset}
        isEQEnabled={true}
        leftEarEnabled={true}
        rightEarEnabled={true}
      />
    );
    
    // Find left ear preset buttons - in this case Notch Filter for left ear
    const leftEarPresetButtons = screen.getAllByText('Notch Filter');
    
    // Click the first one (for left ear)
    fireEvent.click(leftEarPresetButtons[0]);
    
    // Check that the callback was called with the notch filter preset
    expect(mockOnLeftEarPresetSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'notchFilter' })
    );
  });
});