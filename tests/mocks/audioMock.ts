class MockAudio {
  src: string = '';
  crossOrigin: string = '';
  volume: number = 0.7;
  currentTime: number = 0;
  duration: number = 0;
  paused: boolean = true;
  muted: boolean = false;
  playbackRate: number = 1;

  load = jest.fn();
  play = jest.fn().mockImplementation(() => Promise.resolve());
  pause = jest.fn();
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
}

export const mockAudio = new MockAudio();

// Mock the global Audio constructor
(global as any).Audio = jest.fn().mockImplementation(() => mockAudio); 