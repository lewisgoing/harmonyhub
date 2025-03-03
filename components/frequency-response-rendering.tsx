import { debounce, smoothInterpolate, Easing, smoothAnimation } from '@/lib/frequency-response-utils';

// Optimized frequency response rendering with smoother transitions
function renderFrequencyResponse(
  canvas: HTMLCanvasElement, 
  options: {
    isEQEnabled: boolean;
    isSplitEarMode: boolean;
    unifiedPreset: PresetType;
    leftEarPreset: PresetType;
    rightEarPreset: PresetType;
    fromUnifiedPreset?: PresetType;
    fromLeftEarPreset?: PresetType;
    fromRightEarPreset?: PresetType;
    transitionProgress?: number;
  }
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear canvas with high-performance method
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Optimized background and grid drawing
  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Cached drawing parameters
  const gridColor = '#e9ecef';
  const gridLines = 12;
  const gridSpacingH = canvas.width / gridLines;
  const gridSpacingV = canvas.height / gridLines;
  const zeroDbY = canvas.height / 2;

  // Performant grid drawing
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  
  // Vertical lines
  for (let i = 0; i <= gridLines; i++) {
    const x = i * gridSpacingH;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
  }
  
  // Horizontal lines
  for (let i = 0; i <= gridLines; i++) {
    const y = i * gridSpacingV;
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
  }
  
  ctx.stroke();

  // Zero line
  ctx.strokeStyle = '#ced4da';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, zeroDbY);
  ctx.lineTo(canvas.width, zeroDbY);
  ctx.stroke();

  // Labels and text
  ctx.fillStyle = '#6c757d';
  ctx.font = '10px system-ui';
  ctx.textAlign = 'center';

  const freqLabels = ['20Hz', '100Hz', '1kHz', '5kHz', '20kHz'];
  const freqPositions = [0.05, 0.25, 0.5, 0.75, 0.95];

  freqLabels.forEach((label, i) => {
    const x = canvas.width * freqPositions[i];
    ctx.fillText(label, x, canvas.height - 5);
  });

  // Render EQ curve
  function drawEQCurve(
    preset: PresetType, 
    color: string, 
    fromPreset?: PresetType, 
    progress = 1
  ) {
    const fromValues = fromPreset 
      ? presetValues[fromPreset] 
      : presetValues[preset];
    const toValues = presetValues[preset];

    // Interpolate values based on transition progress
    const interpolatedValues = fromValues.map((fromValue, index) => 
      smoothInterpolate(fromValue, toValues[index], progress, Easing.easeOutQuad)
    );

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.globalAlpha = options.isEQEnabled ? 1 : 0.4;

    ctx.beginPath();
    
    // Start point
    const startY = zeroDbY - (interpolatedValues[0] / 15) * (canvas.height / 2) * 0.7;
    ctx.moveTo(0, startY);

    // Control points for smooth curve
    const points = [
      { x: canvas.width * 0.25, y: zeroDbY - (interpolatedValues[0] / 15) * (canvas.height / 2) * 0.7 },
      { x: canvas.width * 0.5, y: zeroDbY - (interpolatedValues[1] / 15) * (canvas.height / 2) * 0.7 },
      { x: canvas.width * 0.75, y: zeroDbY - (interpolatedValues[2] / 15) * (canvas.height / 2) * 0.7 }
    ];

    // Draw smooth curve
    points.forEach((point, i) => {
      if (i === 0) {
        ctx.lineTo(point.x, point.y);
      } else {
        const prevPoint = points[i - 1];
        const cpX = (prevPoint.x + point.x) / 2;
        ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, cpX, (prevPoint.y + point.y) / 2);
        ctx.lineTo(point.x, point.y);
      }
    });

    // End point
    ctx.lineTo(canvas.width, points[points.length - 1].y);
    ctx.stroke();

    // Draw points
    ctx.fillStyle = color;
    points.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1;
  }

  // Render curves based on mode
  if (options.isSplitEarMode) {
    // Split mode: Left (blue) and Right (red)
    drawEQCurve(
      options.leftEarPreset, 
      '#3b82f6', 
      options.fromLeftEarPreset, 
      options.transitionProgress
    );
    drawEQCurve(
      options.rightEarPreset, 
      '#ef4444', 
      options.fromRightEarPreset, 
      options.transitionProgress
    );

    // Legend
    ctx.font = '12px system-ui';
    ctx.fillStyle = '#3b82f6';
    ctx.fillText('Left', canvas.width - 60, 20);
    ctx.fillStyle = '#ef4444';
    ctx.fillText('Right', canvas.width - 60, 40);
  } else {
    // Unified mode: Orange
    drawEQCurve(
      options.unifiedPreset, 
      '#dd6b20', 
      options.fromUnifiedPreset, 
      options.transitionProgress
    );
  }
}

// Exported function for component to use
export function updateCanvasVisualization(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  options: Parameters<typeof renderFrequencyResponse>[1]
) {
  const canvas = canvasRef.current;
  if (!canvas) return;

  // Debounce to prevent too frequent renders
  const debouncedRender = debounce(() => {
    renderFrequencyResponse(canvas, options);
  }, 16); // ~60fps

  // Use requestAnimationFrame for smooth rendering
  requestAnimationFrame(debouncedRender);
}