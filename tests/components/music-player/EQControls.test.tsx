// tests/components/music-player/EQControls.test.tsx
import React from 'react';
import { render } from '@testing-library/react';
import EQControls from '@/components/music-player/EQControls';

// Mock required components
jest.mock('@/components/ui/switch', () => ({
  Switch: () => <div data-testid="mock-switch">Switch</div>
}));

jest.mock('@/components/ui/slider', () => ({
  Slider: () => <div data-testid="mock-slider">Slider</div>
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick }) => (
    <button onClick={onClick} data-testid="mock-button">{children}</button>
  )
}));

describe('EQControls - Basic Rendering', () => {
  test('renders without crashing', () => {
    const defaultProps = {
      isEQEnabled: true,
      isSplitEarMode: false,
      splitEarConfig: { leftEarPreset: 'flat', rightEarPreset: 'flat', balance: 0.5 },
      maxQValue: 10,
      maxGainRange: 48,
      onMaxGainRangeChange: jest.fn(),
      onMaxQValueChange: jest.fn(),
      onEQToggle: jest.fn(),
      onSplitEarToggle: jest.fn(),
      onBalanceChange: jest.fn(),
      onResetEQ: jest.fn(),
    };
    
    const { container } = render(<EQControls {...defaultProps} />);
    expect(container).toBeTruthy();
  });
});