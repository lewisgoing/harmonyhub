// tests/components/music-player/PlayerContainer.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PlayerContainer from '../../../components/music-player/PlayerContainer';
import { useAuth } from '../../../hooks/useAuth';
import { useEQPresets } from '../../../components/music-player/hooks/useEQPresets';
import useAudioContext from '../../../components/music-player/hooks/useAudioContext';
import MockAudioEngine from '../../../tests/mocks/AudioEngine.mock';

// Mock the hooks and components
jest.mock('../../../hooks/useAuth');
jest.mock('../../../components/music-player/hooks/useEQPresets');
jest.mock('../../../components/ui/use-toast', () => ({
  useToast: jest.fn().mockReturnValue({
    toast: jest.fn(),
  }),
}));
jest.mock('../../../components/music-player/hooks/useAudioContext');
jest.mock('../../../hooks/use-mobile', () => ({
  useIsMobile: jest.fn().mockReturnValue(false),
}));
jest.mock('../../../contexts/onboarding-context', () => ({
  useOnboardingContext: jest.fn().mockReturnValue({
    openOnboarding: jest.fn(),
  }),
}));

// Mock components that use canvas
jest.mock('../../../components/music-player/EQVisualization', () => {
  return jest.fn().mockImplementation(() => (
    <div data-testid="eq-visualization">EQ Visualization</div>
  ));
});

jest.mock('../../../components/music-player/PlayerControls', () => {
  return jest.fn().mockImplementation(({ onPlayPause }) => (
    <div data-testid="player-controls">
      <button onClick={onPlayPause}>Play/Pause</button>
    </div>
  ));
});

describe('PlayerContainer', () => {
  // Mock preset data
  const mockPresets = {
    flat: {
      id: 'flat',
      name: 'Flat',
      description: 'No equalization applied',
      color: { active: {}, inactive: {} },
      bands: [
        { id: 'band1', frequency: 125, gain: 0, Q: 5.0 },
        { id: 'band2', frequency: 500, gain: 0, Q: 5.0 },
      ]
    },
    notchFilter: {
      id: 'notchFilter',
      name: 'Notch Filter',
      description: 'Reduces tinnitus frequencies',
      color: { active: {}, inactive: {} },
      bands: [
        { id: 'band1', frequency: 125, gain: 0, Q: 5.0 },
        { id: 'band2', frequency: 500, gain: -10, Q: 5.0 },
      ]
    },
  };
  
  const mockTogglePlayPause = jest.fn();
  const mockAudioEngine = new MockAudioEngine();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock auth hook
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
    });
    
    // Mock presets hook
    (useEQPresets as jest.Mock).mockReturnValue({
      presets: mockPresets,
      userPresets: {},
      saveUserPreset: jest.fn(),
      deleteUserPreset: jest.fn(),
      getPresetById: jest.fn(id => mockPresets[id as keyof typeof mockPresets]),
      createCustomPreset: jest.fn(),
      isLoading: false,
    });
    
    // Mock audio context hook
    (useAudioContext as jest.Mock).mockReturnValue({
      playbackState: {
        isPlaying: false,
        progress: 0,
        currentTime: 0,
        duration: 180,
        isLoaded: true,
      },
      audioRef: { current: {} },
      audioEngine: mockAudioEngine,
      togglePlayPause: mockTogglePlayPause,
      handleSeek: jest.fn(),
      setVolume: jest.fn(),
      volume: 0.7,
    });
    
    // Mock ResizeObserver
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  test('renders player container', () => {
    render(<PlayerContainer />);
    
    // Check for main components
    expect(screen.getByTestId('player-controls')).toBeInTheDocument();
    expect(screen.getByTestId('eq-visualization')).toBeInTheDocument();
    expect(screen.getByText(/They Say It's Wonderful/i)).toBeInTheDocument();
  });

  test('toggles EQ on/off', () => {
    render(<PlayerContainer />);
    
    // Find and click the EQ toggle switch (implementation might vary)
    const eqToggleLabel = screen.getByText(/EQ On/i);
    fireEvent.click(eqToggleLabel);
    
    // Check that the audio engine method was called
    expect(mockAudioEngine.setEQEnabled).toHaveBeenCalledWith(false);
  });

  test('toggles split ear mode', () => {
    render(<PlayerContainer />);
    
    // Find the split ear toggle button (label might vary)
    const splitEarButton = screen.getByText(/Split Ear$/i);
    fireEvent.click(splitEarButton);
    
    // Check that the audio engine method was called
    expect(mockAudioEngine.setSplitEarMode).toHaveBeenCalledWith(true);
  });

  test('plays audio when play button is clicked', () => {
    render(<PlayerContainer />);
    
    // Find and click the play button
    const playButton = screen.getByText('Play/Pause');
    fireEvent.click(playButton);
    
    // Check if the play function was called
    expect(mockTogglePlayPause).toHaveBeenCalled();
  });
});