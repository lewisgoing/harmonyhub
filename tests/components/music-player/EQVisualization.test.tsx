// tests/components/music-player/EQVisualization.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import EQVisualization from '../../../components/music-player/EQVisualization';
import { FrequencyBand } from '../../../components/music-player/types';

// Mock the canvas and context
HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
  clearRect: jest.fn(),
  fillRect: jest.fn(),
  fill: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  arc: jest.fn(),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  font: '',
  textAlign: '',
  fillText: jest.fn(),
  setTransform: jest.fn(),
  bezierCurveTo: jest.fn(),
  globalAlpha: 1,
  canvas: {} as HTMLCanvasElement,
  globalCompositeOperation: 'source-over',
  drawImage: jest.fn(),
  clip: jest.fn(),
} as unknown as CanvasRenderingContext2D);

describe('EQVisualization', () => {
  // Default bands for testing
  const defaultBands: FrequencyBand[] = [
    { id: 'band1', frequency: 125, gain: 0, Q: 5.0 },
    { id: 'band2', frequency: 500, gain: 0, Q: 5.0 },
    { id: 'band3', frequency: 1000, gain: 0, Q: 5.0 },
    { id: 'band4', frequency: 4000, gain: 0, Q: 5.0 },
    { id: 'band5', frequency: 8000, gain: 0, Q: 5.0 },
  ];
  
  // Mock functions
  const mockOnBandChange = jest.fn();
  const mockOnFrequencyChange = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock ResizeObserver
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  test('renders in unified mode', () => {
    const { container } = render(
      <EQVisualization 
        isEQEnabled={true}
        isSplitEarMode={false}
        unifiedBands={defaultBands}
        leftEarBands={defaultBands}
        rightEarBands={defaultBands}
        onBandChange={mockOnBandChange}
        onFrequencyChange={mockOnFrequencyChange}
      />
    );
    
    // Check that canvases are rendered
    const canvases = container.querySelectorAll('canvas');
    expect(canvases.length).toBeGreaterThan(0);
  });

  test('renders in split ear mode', () => {
    const { container } = render(
      <EQVisualization 
        isEQEnabled={true}
        isSplitEarMode={true}
        unifiedBands={defaultBands}
        leftEarBands={defaultBands}
        rightEarBands={defaultBands}
        onBandChange={mockOnBandChange}
        onFrequencyChange={mockOnFrequencyChange}
      />
    );
    
    // Check that canvases are rendered
    const canvases = container.querySelectorAll('canvas');
    expect(canvases.length).toBeGreaterThan(0);
  });
});