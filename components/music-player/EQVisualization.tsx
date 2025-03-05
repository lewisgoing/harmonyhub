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
  
  // NEW: Callback for frequency changes (X-axis dragging)
  onFrequencyChange?: (
    bandId: string,
    newFrequency: number,
    channel: 'unified' | 'left' | 'right'
  ) => void;
  
  // Visual tweaks
  height?: number;
  showFrequencyLabels?: boolean;
  showDbLabels?: boolean;
  interactive?: boolean;
  
  // Drag constraints
  minFreq?: number;
  maxFreq?: number;
  minGain?: number;
  maxGain?: number;
  
  // NEW: Allow or disallow X/Y dragging
  allowXDragging?: boolean;
  allowYDragging?: boolean;
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
 * Round to nearest frequency increment for smoother experience
 */
const roundFrequency = (freq: number): number => {
  if (freq < 100) return Math.round(freq / 5) * 5;
  if (freq < 1000) return Math.round(freq / 10) * 10;
  if (freq < 4000) return Math.round(freq / 50) * 50;
  if (freq < 10000) return Math.round(freq / 100) * 100;
  return Math.round(freq / 500) * 500;
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
  onFrequencyChange,
  height = 160,
  showFrequencyLabels = true,
  showDbLabels = true,
  interactive = true,
  minFreq = 60,
  maxFreq = 16000,
  minGain = -12,
  maxGain = 12,
  allowXDragging = true,
  allowYDragging = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Track the currently dragged point
  const [draggedPoint, setDraggedPoint] = useState<{
    bandId: string;
    channel: 'unified' | 'left' | 'right';
    initialX: number;
    initialY: number;
    initialFreq: number;
    initialGain: number;
    isDraggingX: boolean;
    isDraggingY: boolean;
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
    
    // Initial resize
    resizeCanvas();
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  /**
   * Resize canvas to fit container
   */
  const resizeCanvas = () => {
    if (canvasRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const padding = 4; // Account for padding in container
      
      // Set canvas size to fit within the container
      canvasRef.current.width = rect.width - padding * 2;
      canvasRef.current.height = height - padding * 2;
      
      // Redraw after resize
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
      // Show tooltip with frequency and gain
      showTooltip(band.frequency, band.gain, x, y);
      
      // Draw direction indicators if we're allowing XY dragging
      if (allowXDragging && allowYDragging) {
        // Draw crosshair indicators
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        // Horizontal line
        ctx.moveTo(x - radius * 2, y);
        ctx.lineTo(x + radius * 2, y);
        
        // Vertical line
        ctx.moveTo(x, y - radius * 2);
        ctx.lineTo(x, y + radius * 2);
        
        ctx.stroke();
      } else if (allowXDragging) {
        // Draw horizontal arrow indicators
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        // Horizontal line
        ctx.moveTo(x - radius * 2, y);
        ctx.lineTo(x + radius * 2, y);
        
        ctx.stroke();
      } else if (allowYDragging) {
        // Draw vertical arrow indicators
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        // Vertical line
        ctx.moveTo(x, y - radius * 2);
        ctx.lineTo(x, y + radius * 2);
        
        ctx.stroke();
      }
    }
  };

  /**
   * Show tooltip with frequency and gain information
   */
  const showTooltip = (frequency: number, gain: number, x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    
    // Remove any existing tooltips
    document.querySelectorAll('.eq-tooltip').forEach(el => el.remove());
    
    const tooltip = document.createElement('div');
    tooltip.className = 'absolute z-10 bg-black/80 text-white text-xs rounded px-2 py-1 eq-tooltip';
    tooltip.style.left = `${rect.left + x}px`;
    tooltip.style.top = `${rect.top + y - 30}px`;
    tooltip.style.transform = 'translateX(-50%)';
    tooltip.textContent = `${frequency.toFixed(0)} Hz: ${gain.toFixed(1)} dB`;
    
    // Add to document
    document.body.appendChild(tooltip);
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
      // Get initial values for the point
      let initialFreq = 0;
      let initialGain = 0;
      
      if (point.channel === 'unified') {
        const band = unifiedBands.find(b => b.id === point.bandId);
        if (band) {
          initialFreq = band.frequency;
          initialGain = band.gain;
        }
      } else if (point.channel === 'left') {
        const band = leftEarBands.find(b => b.id === point.bandId);
        if (band) {
          initialFreq = band.frequency;
          initialGain = band.gain;
        }
      } else if (point.channel === 'right') {
        const band = rightEarBands.find(b => b.id === point.bandId);
        if (band) {
          initialFreq = band.frequency;
          initialGain = band.gain;
        }
      }
      
      setDraggedPoint({
        bandId: point.bandId,
        channel: point.channel,
        initialX: x,
        initialY: y,
        initialFreq,
        initialGain,
        isDraggingX: allowXDragging,
        isDraggingY: allowYDragging
      });
      
      // Detect if we should be only dragging in one direction (if both are allowed)
      if (allowXDragging && allowYDragging) {
        // We'll determine the primary drag direction on first movement
      }
      
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
      // We're dragging a point
      
      // Calculate new values based on drag direction
      if (!draggedPoint.isDraggingX && !draggedPoint.isDraggingY) {
        // If neither direction is set yet, determine based on initial movement
        const deltaX = Math.abs(x - draggedPoint.initialX);
        const deltaY = Math.abs(y - draggedPoint.initialY);
        
        // Set the direction that has more movement
        if (deltaX > deltaY && allowXDragging) {
          setDraggedPoint(prev => prev ? { ...prev, isDraggingX: true, isDraggingY: false } : null);
        } else if (deltaY >= deltaX && allowYDragging) {
          setDraggedPoint(prev => prev ? { ...prev, isDraggingX: false, isDraggingY: true } : null);
        }
        
        // Return early until direction is determined
        return;
      }
      
      // Calculate new values based on drag direction
      let newGain = draggedPoint.initialGain;
      let newFrequency = draggedPoint.initialFreq;
      
      // Update gain (Y position) if Y dragging is enabled
      if (draggedPoint.isDraggingY && allowYDragging) {
        newGain = yToGain(y, canvas.height);
        
        // Clamp gain to reasonable range
        newGain = Math.max(Math.min(newGain, maxGain), minGain);
        
        // Call the callback for gain change
        onBandChange(
          draggedPoint.bandId,
          newGain,
          undefined,
          draggedPoint.channel
        );
      }
      
      // Update frequency (X position) if X dragging is enabled
      if (draggedPoint.isDraggingX && allowXDragging && onFrequencyChange) {
        newFrequency = xToFreq(x, canvas.width);
        
        // Clamp frequency to reasonable range
        newFrequency = Math.max(Math.min(newFrequency, maxFreq), minFreq);
        
        // Round frequency to nearest increment
        newFrequency = roundFrequency(newFrequency);
        
        // Call the callback for frequency change
        onFrequencyChange(
          draggedPoint.bandId,
          newFrequency,
          draggedPoint.channel
        );
      }
      
      // Update tooltip to show current values
      showTooltip(newFrequency, newGain, x, y);
      
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

  // Update cursor when hover state changes
  useEffect(() => {
    if (!canvasRef.current) return;
    
    if (hoveredPoint) {
      canvasRef.current.style.cursor = "pointer";
    } else {
      canvasRef.current.style.cursor = "default";
    }
  }, [hoveredPoint]);

  // Update cursor when drag state changes
  useEffect(() => {
    if (!canvasRef.current || !draggedPoint) return;
    
    if (draggedPoint.isDraggingX && !draggedPoint.isDraggingY) {
      canvasRef.current.style.cursor = "ew-resize"; // Horizontal resize cursor
    } else if (!draggedPoint.isDraggingX && draggedPoint.isDraggingY) {
      canvasRef.current.style.cursor = "ns-resize"; // Vertical resize cursor
    } else if (draggedPoint.isDraggingX && draggedPoint.isDraggingY) {
      canvasRef.current.style.cursor = "move"; // Move cursor (both directions)
    }
  }, [draggedPoint]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full border border-gray-200 rounded-md overflow-hidden"
      style={{ height }}
    >
      <div className="p-2 w-full h-full">
        <canvas
          ref={canvasRef}
          style={{ display: "block" }} // Prevent extra space below canvas
          height={height - 4} // Account for container padding
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
      </div>
    </div>
  );
};

export default EQVisualization;