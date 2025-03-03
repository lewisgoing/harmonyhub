"use client";

import React, { useRef, useEffect, useState } from 'react';
import { FrequencyBand } from './types';

interface EQVisualizationProps {
  // EQ state
  isEQEnabled: boolean;
  isSplitEarMode: boolean;
  
  // Band data
  unifiedBands: FrequencyBand[];
  leftEarBands: FrequencyBand[];
  rightEarBands: FrequencyBand[];
  
  // Optional frequency response data for precise visualization
  frequencyResponseData?: {
    frequencies: Float32Array;
    leftMagnitudes: Float32Array;
    rightMagnitudes: Float32Array;
  };
  
  // Callbacks for interactive adjustments
  onBandChange: (
    bandId: string, 
    newGain: number, 
    newQ?: number, 
    channel?: 'unified' | 'left' | 'right'
  ) => void;
  
  // Visual tweaks
  height?: number;
  showFrequencyLabels?: boolean;
  showDbLabels?: boolean;
  interactive?: boolean;
}

// Visual constants
const POINT_RADIUS = 6;
const ACTIVE_POINT_RADIUS = 8;
const UNIFIED_COLOR = '#dd6b20'; // Dark orange
const LEFT_EAR_COLOR = '#3b82f6'; // Blue
const RIGHT_EAR_COLOR = '#ef4444'; // Red
const DISABLED_OPACITY = 0.4;
const GRID_COLOR = '#e9ecef';
const ZERO_LINE_COLOR = '#ced4da';
const FREQUENCY_LABELS = ['60Hz', '125Hz', '250Hz', '500Hz', '1kHz', '2kHz', '4kHz', '8kHz', '16kHz'];
const FREQUENCY_POSITIONS = [60, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
const DB_RANGE = 24; // +/- 12dB

/**
 * Convert frequency to x position on canvas
 */
const freqToX = (freq: number, width: number): number => {
  // Logarithmic scale from 60Hz to 16kHz
  const minLog = Math.log10(60);
  const maxLog = Math.log10(16000);
  const logPos = (Math.log10(Math.max(60, freq)) - minLog) / (maxLog - minLog);
  return logPos * width;
};

/**
 * Convert x position on canvas to frequency
 */
const xToFreq = (x: number, width: number): number => {
  // Logarithmic scale from 60Hz to 16kHz
  const minLog = Math.log10(60);
  const maxLog = Math.log10(16000);
  const logPos = x / width;
  return Math.pow(10, minLog + logPos * (maxLog - minLog));
};

/**
 * Convert gain (dB) to y position on canvas
 */
const gainToY = (gain: number, height: number): number => {
  // Linear scale from -DB_RANGE/2 to +DB_RANGE/2 dB
  const zeroDbY = height / 2;
  return zeroDbY - (gain / DB_RANGE) * height;
};

/**
 * Convert y position on canvas to gain (dB)
 */
const yToGain = (y: number, height: number): number => {
  // Linear scale from -DB_RANGE/2 to +DB_RANGE/2 dB
  const zeroDbY = height / 2;
  return -((y - zeroDbY) / height) * DB_RANGE;
};

/**
 * EQ Visualization Component
 */
const EQVisualization: React.FC<EQVisualizationProps> = ({
  isEQEnabled,
  isSplitEarMode,
  unifiedBands,
  leftEarBands,
  rightEarBands,
  frequencyResponseData,
  onBandChange,
  height = 160,
  showFrequencyLabels = true,
  showDbLabels = true,
  interactive = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Track the currently dragged point
  const [draggedPoint, setDraggedPoint] = useState<{
    bandId: string;
    channel: 'unified' | 'left' | 'right';
    initialX: number;
    initialY: number;
  } | null>(null);
  
  // Track the point that's currently hovered over
  const [hoveredPoint, setHoveredPoint] = useState<{
    bandId: string;
    channel: 'unified' | 'left' | 'right';
  } | null>(null);

  // Redraw when props change
  useEffect(() => {
    drawEQCurve();
  }, [
    isEQEnabled, 
    isSplitEarMode, 
    unifiedBands, 
    leftEarBands, 
    rightEarBands,
    frequencyResponseData,
    height
  ]);
  
  // Resize canvas when container size changes
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  /**
   * Resize canvas to fit container
   */
  const resizeCanvas = () => {
    if (canvasRef.current && containerRef.current) {
      const { width } = containerRef.current.getBoundingClientRect();
      canvasRef.current.width = width;
      canvasRef.current.height = height;
      drawEQCurve();
    }
  };

  /**
   * Draw the EQ curve on the canvas
   */
  const drawEQCurve = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { width, height } = canvas;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    drawGrid(ctx, width, height);
    
    // Draw frequency response if available
    if (frequencyResponseData) {
      drawFrequencyResponse(ctx, width, height);
    } else {
      // Otherwise, draw EQ curve based on band points
      if (isSplitEarMode) {
        // Draw left ear curve
        drawBandCurve(ctx, leftEarBands, LEFT_EAR_COLOR, width, height);
        
        // Draw right ear curve
        drawBandCurve(ctx, rightEarBands, RIGHT_EAR_COLOR, width, height);
        
        // Add a legend
        drawLegend(ctx, width, height);
      } else {
        // Draw unified curve
        drawBandCurve(ctx, unifiedBands, UNIFIED_COLOR, width, height);
      }
    }
    
    // Draw interactive points
    if (interactive) {
      drawBandPoints(ctx, width, height);
    }
  };

  /**
   * Draw the grid on the canvas
   */
  const drawGrid = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    const gridLines = 8;
    const gridSpacingV = height / gridLines;
    
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= gridLines; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * gridSpacingV);
      ctx.lineTo(width, i * gridSpacingV);
      ctx.stroke();
    }
    
    // Vertical grid lines (logarithmic for frequencies)
    for (let freq of FREQUENCY_POSITIONS) {
      const x = freqToX(freq, width);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Draw zero line with a different color
    ctx.strokeStyle = ZERO_LINE_COLOR;
    ctx.lineWidth = 2;
    const zeroDbY = height / 2;
    ctx.beginPath();
    ctx.moveTo(0, zeroDbY);
    ctx.lineTo(width, zeroDbY);
    ctx.stroke();
    
    // Add frequency labels
    if (showFrequencyLabels) {
      ctx.fillStyle = '#6c757d';
      ctx.font = '10px system-ui';
      ctx.textAlign = 'center';
      
      FREQUENCY_LABELS.forEach((label, i) => {
        if (i < FREQUENCY_POSITIONS.length) {
          const x = freqToX(FREQUENCY_POSITIONS[i], width);
          ctx.fillText(label, x, height - 5);
        }
      });
    }
    
    // Add dB labels
    if (showDbLabels) {
      ctx.textAlign = 'left';
      ctx.fillText(`+${DB_RANGE/2}dB`, 5, 15);
      ctx.fillText('0dB', 5, height / 2 - 5);
      ctx.fillText(`-${DB_RANGE/2}dB`, 5, height - 15);
    }
  };

  /**
   * Draw a curve based on frequency bands
   */
  const drawBandCurve = (
    ctx: CanvasRenderingContext2D,
    bands: FrequencyBand[],
    color: string,
    width: number,
    height: number
  ) => {
    // Set up curve style
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    
    // If EQ is disabled, reduce opacity
    if (!isEQEnabled) {
      ctx.globalAlpha = DISABLED_OPACITY;
    } else {
      ctx.globalAlpha = 1.0;
    }
    
    // Sort bands by frequency
    const sortedBands = [...bands].sort((a, b) => a.frequency - b.frequency);
    
    // Check if we have enough points
    if (sortedBands.length < 2) {
      // Reset opacity and return
      ctx.globalAlpha = 1.0;
      return;
    }
    
    // Draw curve
    ctx.beginPath();
    
    // Start at left edge (lowest possible frequency)
    const startX = 0;
    const startY = gainToY(sortedBands[0].gain, height);
    ctx.moveTo(startX, startY);
    
    // Add points for each band
    const points = sortedBands.map(band => ({
      x: freqToX(band.frequency, width),
      y: gainToY(band.gain, height),
      frequency: band.frequency,
      gain: band.gain,
      Q: band.Q
    }));
    
    // Draw curve through points
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      
      if (i === 0) {
        // First point
        ctx.lineTo(point.x, point.y);
      } else {
        // Use quadratic curves between points for a smoother look
        const prevPoint = points[i - 1];
        const cpX = (prevPoint.x + point.x) / 2;
        ctx.quadraticCurveTo(
          prevPoint.x, prevPoint.y,
          cpX, (prevPoint.y + point.y) / 2
        );
        ctx.lineTo(point.x, point.y);
      }
    }
    
    // Continue to right edge
    const endX = width;
    const endY = gainToY(sortedBands[sortedBands.length - 1].gain, height);
    ctx.lineTo(endX, endY);
    
    // Stroke the path
    ctx.stroke();
    
    // Reset opacity
    ctx.globalAlpha = 1.0;
  };

  /**
   * Draw frequency response from audio engine data
   */
  const drawFrequencyResponse = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    if (!frequencyResponseData) return;
    
    const { frequencies, leftMagnitudes, rightMagnitudes } = frequencyResponseData;
    const zeroDbY = height / 2;
    
    // If EQ is disabled, reduce opacity
    if (!isEQEnabled) {
      ctx.globalAlpha = DISABLED_OPACITY;
    } else {
      ctx.globalAlpha = 1.0;
    }
    
    // Draw unified or left channel curve
    ctx.strokeStyle = isSplitEarMode ? LEFT_EAR_COLOR : UNIFIED_COLOR;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    let firstPointDrawn = false;
    
    for (let i = 0; i < frequencies.length; i++) {
      const x = freqToX(frequencies[i], width);
      
      // Clamp magnitude to our display range
      const magnitude = Math.max(Math.min(leftMagnitudes[i], DB_RANGE/2), -DB_RANGE/2);
      const y = zeroDbY - (magnitude / DB_RANGE) * height;
      
      if (!firstPointDrawn) {
        ctx.moveTo(x, y);
        firstPointDrawn = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
    
    // Draw right channel curve if in split mode
    if (isSplitEarMode) {
      ctx.strokeStyle = RIGHT_EAR_COLOR;
      ctx.beginPath();
      
      firstPointDrawn = false;
      
      for (let i = 0; i < frequencies.length; i++) {
        const x = freqToX(frequencies[i], width);
        
        // Clamp magnitude to our display range
        const magnitude = Math.max(Math.min(rightMagnitudes[i], DB_RANGE/2), -DB_RANGE/2);
        const y = zeroDbY - (magnitude / DB_RANGE) * height;
        
        if (!firstPointDrawn) {
          ctx.moveTo(x, y);
          firstPointDrawn = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.stroke();
    }
    
    // Reset opacity
    ctx.globalAlpha = 1.0;
  };

  /**
   * Draw draggable points for each band
   */
  const drawBandPoints = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    if (!interactive) return;
    
    if (isSplitEarMode) {
      // Draw left ear points
      leftEarBands.forEach(band => {
        const isHovered = hoveredPoint?.bandId === band.id && 
                          hoveredPoint?.channel === 'left';
        const isDragged = draggedPoint?.bandId === band.id && 
                          draggedPoint?.channel === 'left';
        
        drawBandPoint(
          ctx, band, LEFT_EAR_COLOR, width, height, 
          isHovered || isDragged, 'left'
        );
      });
      
      // Draw right ear points
      rightEarBands.forEach(band => {
        const isHovered = hoveredPoint?.bandId === band.id && 
                          hoveredPoint?.channel === 'right';
        const isDragged = draggedPoint?.bandId === band.id && 
                          draggedPoint?.channel === 'right';
        
        drawBandPoint(
          ctx, band, RIGHT_EAR_COLOR, width, height, 
          isHovered || isDragged, 'right'
        );
      });
    } else {
      // Draw unified points
      unifiedBands.forEach(band => {
        const isHovered = hoveredPoint?.bandId === band.id && 
                          hoveredPoint?.channel === 'unified';
        const isDragged = draggedPoint?.bandId === band.id && 
                          draggedPoint?.channel === 'unified';
        
        drawBandPoint(
          ctx, band, UNIFIED_COLOR, width, height, 
          isHovered || isDragged, 'unified'
        );
      });
    }
  };

  /**
   * Draw a single band point
   */
  const drawBandPoint = (
    ctx: CanvasRenderingContext2D,
    band: FrequencyBand,
    color: string,
    width: number,
    height: number,
    isActive: boolean,
    channel: 'unified' | 'left' | 'right'
  ) => {
    const x = freqToX(band.frequency, width);
    const y = gainToY(band.gain, height);
    const radius = isActive ? ACTIVE_POINT_RADIUS : POINT_RADIUS;
    
    // If EQ is disabled, reduce opacity
    if (!isEQEnabled) {
      ctx.globalAlpha = DISABLED_OPACITY;
    } else {
      ctx.globalAlpha = 1.0;
    }
    
    // Draw point
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw point border
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Reset opacity
    ctx.globalAlpha = 1.0;
    
    // If active, show frequency and gain
    if (isActive && canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      
      // Show tooltip with frequency and gain
      const tooltip = document.createElement('div');
      tooltip.className = 'absolute z-10 bg-black/80 text-white text-xs rounded px-2 py-1';
      tooltip.style.left = `${rect.left + x}px`;
      tooltip.style.top = `${rect.top + y - 30}px`;
      tooltip.style.transform = 'translateX(-50%)';
      tooltip.textContent = `${band.frequency.toFixed(0)} Hz: ${band.gain.toFixed(1)} dB`;
      
      // Remove any existing tooltips
      document.querySelectorAll('.eq-tooltip').forEach(el => el.remove());
      
      // Add class for easier removal
      tooltip.classList.add('eq-tooltip');
      
      // Add to document
      document.body.appendChild(tooltip);
    }
  };

  /**
   * Draw legend for split ear mode
   */
  const drawLegend = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    ctx.font = '12px system-ui';
    
    // Left ear legend
    ctx.fillStyle = LEFT_EAR_COLOR;
    ctx.fillText('Left', width - 60, 20);
    
    // Right ear legend
    ctx.fillStyle = RIGHT_EAR_COLOR;
    ctx.fillText('Right', width - 60, 40);
  };

  /**
   * Handle mouse down on canvas
   */
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive || !isEQEnabled || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Find the closest point
    const point = findClosestPoint(x, y);
    if (point) {
      setDraggedPoint({
        bandId: point.bandId,
        channel: point.channel,
        initialX: x,
        initialY: y
      });
      
      // Prevent text selection during drag
      e.preventDefault();
    }
  };

  /**
   * Handle mouse move on canvas
   */
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (draggedPoint) {
      // We're dragging a point - update its position
      const newGain = yToGain(y, canvas.height);
      
      // Clamp gain to reasonable range
      const clampedGain = Math.max(Math.min(newGain, DB_RANGE/2), -DB_RANGE/2);
      
      // Call the callback
      onBandChange(
        draggedPoint.bandId,
        clampedGain,
        undefined,
        draggedPoint.channel
      );
    } else {
      // Just hovering - find the closest point
      const point = findClosestPoint(x, y);
      setHoveredPoint(point);
    }
  };

  /**
   * Handle mouse up event
   */
  const handleMouseUp = () => {
    setDraggedPoint(null);
    
    // Remove any tooltips
    document.querySelectorAll('.eq-tooltip').forEach(el => el.remove());
  };

  /**
   * Handle mouse leave event
   */
  const handleMouseLeave = () => {
    setHoveredPoint(null);
    
    // Only release drag if we're not actually dragging
    // This allows the user to drag outside the canvas
    if (!draggedPoint) {
      setDraggedPoint(null);
    }
    
    // Remove any tooltips
    document.querySelectorAll('.eq-tooltip').forEach(el => el.remove());
  };

  /**
   * Find the closest point to the given coordinates
   */
  const findClosestPoint = (x: number, y: number): {
    bandId: string;
    channel: 'unified' | 'left' | 'right';
  } | null => {
    if (!canvasRef.current) return null;
    
    const canvas = canvasRef.current;
    const { width, height } = canvas;
    
    // Maximum distance to consider
    const maxDistance = 20;
    let closestDistance = maxDistance;
    let closestPoint = null;
    
    const checkBand = (
      band: FrequencyBand,
      channel: 'unified' | 'left' | 'right'
    ) => {
      const bandX = freqToX(band.frequency, width);
      const bandY = gainToY(band.gain, height);
      
      const distance = Math.sqrt(
        Math.pow(bandX - x, 2) + Math.pow(bandY - y, 2)
      );
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPoint = { bandId: band.id, channel };
      }
    };
    
    if (isSplitEarMode) {
      // Check left ear bands
      leftEarBands.forEach(band => checkBand(band, 'left'));
      
      // Check right ear bands
      rightEarBands.forEach(band => checkBand(band, 'right'));
    } else {
      // Check unified bands
      unifiedBands.forEach(band => checkBand(band, 'unified'));
    }
    
    return closestPoint;
  };

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full border border-gray-200 rounded-md p-2"
      style={{ height }}
    >
      <canvas
        ref={canvasRef}
        className={interactive && isEQEnabled ? "cursor-grab" : "cursor-default"}
        height={height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
};

export default EQVisualization;