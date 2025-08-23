import React from 'react';

interface BarChartProps {
  data: Array<{ [key: string]: any }>;
  xField: string;
  yField: string;
  height?: number;
}

export function BarChart({ data, xField, yField, height = 300 }: BarChartProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Find min and max values
    const yValues = data.map(d => d[yField]);
    const yMin = 0;
    const yMax = Math.max(...yValues) * 1.1; // Add 10% padding

    // Calculate bar width and spacing
    const barWidth = (canvas.width - 100) / data.length;
    const barSpacing = barWidth * 0.2;

    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.moveTo(50, 0);
    ctx.lineTo(50, canvas.height - 30);
    ctx.lineTo(canvas.width - 20, canvas.height - 30);
    ctx.stroke();

    // Draw bars
    data.forEach((bar, i) => {
      const x = 50 + i * barWidth;
      const barHeight = ((bar[yField] - yMin) / (yMax - yMin)) * (canvas.height - 50);
      const y = canvas.height - 30 - barHeight;

      // Draw bar
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(x + barSpacing, y, barWidth - 2 * barSpacing, barHeight);

      // Draw value on top of bar
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(bar[yField].toFixed(2), x + barWidth / 2, y - 5);

      // Draw label
      ctx.fillText(bar[xField], x + barWidth / 2, canvas.height - 10);
    });

    // Draw y-axis labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    const yStep = (yMax - yMin) / 5;
    for (let i = 0; i <= 5; i++) {
      const y = canvas.height - 30 - (i * (canvas.height - 50) / 5);
      const value = yMin + i * yStep;
      ctx.fillText(value.toFixed(2), 45, y + 4);
    }
  }, [data, xField, yField, height]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full"
      style={{ height }}
    />
  );
} 