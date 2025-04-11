// tests/mocks/AudioEngine.mock.ts
export default class MockAudioEngine {
    private eqEnabled = true;
    private splitEarMode = false;
    private unifiedBands: any[] = [];
    private leftEarBands: any[] = [];
    private rightEarBands: any[] = [];
    private balance = 0.5;
    private leftEarEnabled = true;
    private rightEarEnabled = true;
    private mockFrequencyResponse = {
      frequencies: new Float32Array(200),
      leftMagnitudes: new Float32Array(200),
      rightMagnitudes: new Float32Array(200)
    };
  
    public nodes = {
      context: {
        state: 'running',
        resume: jest.fn().mockResolvedValue(undefined),
      },
      source: {},
      filters: [],
      leftFilters: [],
      rightFilters: [],
      splitter: null,
      merger: null,
      leftGain: null,
      rightGain: null
    };
  
    public async initialize(): Promise<boolean> {
      return true;
    }
  
    public async ensureAudioContextReady(): Promise<boolean> {
      return true;
    }
  
    public setEQEnabled(enabled: boolean): void {
      this.eqEnabled = enabled;
    }
  
    public setSplitEarMode(enabled: boolean): void {
      this.splitEarMode = enabled;
    }
  
    public setUnifiedBands(bands: any[]): void {
      this.unifiedBands = [...bands];
    }
  
    public setLeftEarBands(bands: any[]): void {
      this.leftEarBands = [...bands];
    }
  
    public setRightEarBands(bands: any[]): void {
      this.rightEarBands = [...bands];
    }
  
    public setBalance(balance: number): void {
      this.balance = balance;
    }
  
    public setLeftEarEnabled(enabled: boolean): void {
      this.leftEarEnabled = enabled;
    }
  
    public setRightEarEnabled(enabled: boolean): void {
      this.rightEarEnabled = enabled;
    }
  
    public getFrequencyResponse(): any {
      return this.mockFrequencyResponse;
    }
  
    public refreshFrequencyResponse(): any {
      return this.mockFrequencyResponse;
    }
  
    public isEngineInitialized(): boolean {
      return true;
    }
  
    public dispose(): void {}
  }