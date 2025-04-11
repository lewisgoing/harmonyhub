// tests/hooks/useAudioContext.test.tsx
import { renderHook, act } from '@testing-library/react-hooks';
import { useAudioContext } from '../../components/music-player/hooks/useAudioContext';
import MockAudioEngine from '../mocks/AudioEngine.mock';

jest.mock('../../components/music-player/AudioEngine', () => {
  return jest.fn().mockImplementation(() => new MockAudioEngine());
});

describe('useAudioContext hook', () => {
  const mockSong = {
    name: 'Test Song',
    author: 'Test Artist',
    cover: 'test-cover.jpg',
    audio: 'test-audio.mp3'
  };
  
  // Mock HTMLAudioElement
  const originalCreateElement = document.createElement;
  let mockAudio: any;
  
  beforeAll(() => {
    // Mock Audio element
    mockAudio = {
      play: jest.fn().mockResolvedValue(undefined),
      pause: jest.fn(),
      load: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      src: '',
      volume: 1,
      currentTime: 0,
      duration: 180,
      preload: 'none',
      crossOrigin: '',
    };
    
    document.createElement = jest.fn((tagName) => {
      if (tagName === 'audio') {
        return mockAudio;
      }
      return originalCreateElement.call(document, tagName);
    });
  });
  
  afterAll(() => {
    document.createElement = originalCreateElement;
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('initializes with default playback state', () => {
    const { result } = renderHook(() => useAudioContext({ song: mockSong }));
    
    expect(result.current.playbackState).toEqual({
      isPlaying: false,
      progress: 0,
      currentTime: 0,
      duration: 0,
      isLoaded: false
    });
    
    expect(result.current.volume).toBe(0.7); // Default volume
  });

  test('loads song on initialization', () => {
    renderHook(() => useAudioContext({ song: mockSong }));
    
    expect(mockAudio.src).toBe(mockSong.audio);
    expect(mockAudio.crossOrigin).toBe('anonymous');
    expect(mockAudio.load).toHaveBeenCalled();
  });

  test('handles volume change', () => {
    const { result } = renderHook(() => useAudioContext({ song: mockSong }));
    
    // Initial volume
    expect(result.current.volume).toBe(0.7);
    
    // Change volume
    act(() => {
      result.current.setVolume(0.5);
    });
    
    expect(result.current.volume).toBe(0.5);
    expect(mockAudio.volume).toBe(0.5);
  });
});