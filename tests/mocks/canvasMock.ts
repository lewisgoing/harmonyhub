const mockCanvasContext = {
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
  font: '',
  textAlign: 'left' as CanvasTextAlign,
  textBaseline: 'alphabetic' as CanvasTextBaseline,
  
  beginPath: jest.fn(),
  closePath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  stroke: jest.fn(),
  fillText: jest.fn(),
  measureText: jest.fn().mockReturnValue({ width: 50 }),
  clearRect: jest.fn(),
  setLineDash: jest.fn(),
  getLineDash: jest.fn().mockReturnValue([]),
  save: jest.fn(),
  restore: jest.fn(),
  scale: jest.fn(),
  translate: jest.fn(),
  rotate: jest.fn(),
  createLinearGradient: jest.fn().mockReturnValue({
    addColorStop: jest.fn()
  }),
};

const mockCanvas = {
  getContext: jest.fn().mockReturnValue(mockCanvasContext),
  toDataURL: jest.fn(),
  width: 800,
  height: 600,
};

// Mock the HTMLCanvasElement
(global as any).HTMLCanvasElement.prototype.getContext = mockCanvas.getContext;
Object.defineProperty(HTMLCanvasElement.prototype, 'width', {
  writable: true,
  value: mockCanvas.width
});
Object.defineProperty(HTMLCanvasElement.prototype, 'height', {
  writable: true,
  value: mockCanvas.height
});

export { mockCanvas, mockCanvasContext }; 