import React from 'react';

interface ScatterChartProps {
  data: Array<{ [key: string]: any }>;
  xField: string;
  yField: string;
  height?: number;
}

export function ScatterChart({ data, xField, yField, height = 300 }: ScatterChartProps) {
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
    const xValues = data.map(d => d[xField]);
    const yValues = data.map(d => d[yField]);
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);

    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.moveTo(50, 0);
    ctx.lineTo(50, canvas.height - 30);
    ctx.lineTo(canvas.width - 20, canvas.height - 30);
    ctx.stroke();

    // Draw points
    data.forEach(point => {
      const x = 50 + ((point[xField] - xMin) / (xMax - xMin)) * (canvas.width - 70);
      const y = canvas.height - 30 - ((point[yField] - yMin) / (yMax - yMin)) * (canvas.height - 50);

      // Draw point
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';

    // X-axis labels
    const xStep = (xMax - xMin) / 5;
    for (let i = 0; i <= 5; i++) {
      const x = 50 + (i * (canvas.width - 70) / 5);
      const value = xMin + i * xStep;
      ctx.fillText(value.toFixed(2), x, canvas.height - 10);
    }

    // Y-axis labels
    ctx.textAlign = 'right';
    const yStep = (yMax - yMin) / 5;
    for (let i = 0; i <= 5; i++) {
      const y = canvas.height - 30 - (i * (canvas.height - 50) / 5);
      const value = yMin + i * yStep;
      ctx.fillText(value.toFixed(2), 45, y + 4);
    }

    // Draw axis titles
    ctx.fillStyle = '#374151';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(xField, canvas.width / 2, canvas.height - 5);
    ctx.save();
    ctx.translate(20, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yField, 0, 0);
    ctx.restore();
  }, [data, xField, yField, height]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full"
      style={{ height }}
    />
  );
} 