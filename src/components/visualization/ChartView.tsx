import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
  ScatterController,
  ArcElement,
  RadialLinearScale
} from 'chart.js';
import { Line, Bar, Scatter, Pie, Radar } from 'react-chartjs-2';
import type { DataField } from '@/types/data';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ScatterController,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend
);

interface ChartViewProps {
  data: DataField[];
  type: 'bar' | 'line' | 'scatter' | 'pie' | 'radar';
  title?: string;
  selectedFields?: string[];
  showStats?: boolean;
  colorScheme?: string;
  onError?: (error: string) => void;
}

export function ChartView({ 
  data, 
  type, 
  title, 
  selectedFields = [], 
  showStats = true,
  colorScheme = 'default',
  onError
}: ChartViewProps) {
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hoveredElement, setHoveredElement] = React.useState<{
    label?: string;
    value?: string | number;
    datasetLabel?: string;
  } | null>(null);

  // Color schemes
  const colorSchemes = {
    default: {
      backgroundColor: [
        'rgba(99, 102, 241, 0.5)',
        'rgba(168, 85, 247, 0.5)',
        'rgba(34, 197, 94, 0.5)',
        'rgba(239, 68, 68, 0.5)',
        'rgba(234, 179, 8, 0.5)',
        'rgba(6, 182, 212, 0.5)',
        'rgba(249, 115, 22, 0.5)',
        'rgba(107, 114, 128, 0.5)'
      ],
      borderColor: [
        'rgb(99, 102, 241)',
        'rgb(168, 85, 247)',
        'rgb(34, 197, 94)',
        'rgb(239, 68, 68)',
        'rgb(234, 179, 8)',
        'rgb(6, 182, 212)',
        'rgb(249, 115, 22)',
        'rgb(107, 114, 128)'
      ]
    },
    pastel: {
      backgroundColor: [
        'rgba(179, 205, 227, 0.7)',
        'rgba(204, 235, 197, 0.7)',
        'rgba(222, 203, 228, 0.7)',
        'rgba(254, 217, 166, 0.7)',
        'rgba(255, 179, 186, 0.7)',
        'rgba(207, 216, 220, 0.7)',
        'rgba(200, 230, 201, 0.7)',
        'rgba(255, 224, 178, 0.7)'
      ],
      borderColor: [
        'rgb(179, 205, 227)',
        'rgb(204, 235, 197)',
        'rgb(222, 203, 228)',
        'rgb(254, 217, 166)',
        'rgb(255, 179, 186)',
        'rgb(207, 216, 220)',
        'rgb(200, 230, 201)',
        'rgb(255, 224, 178)'
      ]
    },
    dark: {
      backgroundColor: [
        'rgba(63, 81, 181, 0.7)',
        'rgba(136, 14, 79, 0.7)',
        'rgba(27, 94, 32, 0.7)',
        'rgba(183, 28, 28, 0.7)',
        'rgba(245, 127, 23, 0.7)',
        'rgba(0, 131, 143, 0.7)',
        'rgba(230, 81, 0, 0.7)',
        'rgba(69, 90, 100, 0.7)'
      ],
      borderColor: [
        'rgb(48, 63, 159)',
        'rgb(103, 58, 183)',
        'rgb(27, 94, 32)',
        'rgb(198, 40, 40)',
        'rgb(245, 127, 23)',
        'rgb(0, 105, 92)',
        'rgb(230, 81, 0)',
        'rgb(69, 90, 100)'
      ]
    }
  };

  const colors = colorSchemes[colorScheme as keyof typeof colorSchemes] || colorSchemes.default;

  const calculateStatistics = (values: unknown[] | undefined) => {
    if (!values || !Array.isArray(values)) return null;
    
    // Filter and convert to numbers
    const numericValues = values
      .map(v => typeof v === 'number' ? v : parseFloat(String(v)))
      .filter(v => !isNaN(v));
    
    if (numericValues.length === 0) return null;
    
    const sum = numericValues.reduce((a, b) => a + b, 0);
    const mean = sum / numericValues.length;
    const variance = numericValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numericValues.length;
    const stdDev = Math.sqrt(variance);
    const min = Math.min(...numericValues);
    const max = Math.max(...numericValues);
    
    // Calculate median
    const sorted = [...numericValues].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : sorted[middle];
    
    // Calculate quartiles
    const q1 = calculatePercentile(numericValues, 25);
    const q3 = calculatePercentile(numericValues, 75);
    
    return { 
      mean, 
      stdDev, 
      min, 
      max, 
      median,
      q1,
      q3,
      iqr: q3 - q1,
      count: numericValues.length,
      sum
    };
  };

  const calculatePercentile = (values: number[], percentile: number) => {
    if (!values.length) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return sorted[lower];
    }
    
    return sorted[lower] + (index - lower) * (sorted[upper] - sorted[lower]);
  };

  // Refactored: chartData and error are returned from useMemo, not setError inside memo
  const chartDataResult = React.useMemo(() => {
    try {
      if (!data?.length) {
        return { error: 'No data available for visualization', chartData: null };
      }

      // Filter numeric fields and apply field selection if provided
      let numericFields = (data || []).filter(f => f.type === 'number');
      numericFields = (numericFields || []).filter(f => (selectedFields || []).includes(f.name) || selectedFields.length === 0);

      if (numericFields.length === 0) {
        return { error: 'No numeric fields available for visualization', chartData: null };
      }

      // For pie and radar charts, show aggregated data
      if (type === 'pie' || type === 'radar') {
        const processedData = numericFields.map(field => {
          const values = Array.isArray(field.value) ? field.value : [field.value];
          const stats = calculateStatistics(values);
          return stats ? stats.mean : 0;
        });

        return {
          error: null,
          chartData: {
            labels: numericFields.map(field => field.name),
            datasets: [{
              label: 'Mean Values',
              data: processedData,
              backgroundColor: colors.backgroundColor,
              borderColor: colors.borderColor,
              borderWidth: 1
            }]
          } as ChartData<'pie' | 'radar'>
        };
      }

      // For scatter plots, handle pairwise comparison
      if (type === 'scatter') {
        if (numericFields.length < 2) {
          return { error: 'Scatter plot requires at least two numeric fields', chartData: null };
        }

        const xField = numericFields[0];
        const yField = numericFields.length > 1 ? numericFields[1] : numericFields[0];
        const xValues = Array.isArray(xField.value) ? xField.value : [xField.value];
        const yValues = Array.isArray(yField.value) ? yField.value : [yField.value];
        const minLength = Math.min(xValues.length, yValues.length);
        const truncatedX = xValues.slice(0, minLength);
        const truncatedY = yValues.slice(0, minLength);
        const scatterData = {
          datasets: [{
            label: `${yField.name} vs ${xField.name}`,
            data: truncatedX.map((x, i) => ({
              x: typeof x === 'number' ? x : 0,
              y: typeof truncatedY[i] === 'number' ? truncatedY[i] : 0
            })),
            backgroundColor: colors.backgroundColor[0],
            borderColor: colors.borderColor[0],
            pointRadius: 4,
            pointHoverRadius: 6,
          }]
        };
        return { error: null, chartData: scatterData as ChartData<'scatter'> };
      }

      // For line and bar charts, show statistical breakdown
      const processedData = numericFields.map(field => {
        const values = Array.isArray(field.value) ? field.value : [field.value];
        return calculateStatistics(values) || {
          mean: 0, stdDev: 0, min: 0, max: 0, median: 0, q1: 0, q3: 0, iqr: 0, count: 0, sum: 0
        };
      });
      const baseDatasets = [];
      baseDatasets.push({
        label: 'Mean Values',
        data: processedData.map(d => d.mean),
        backgroundColor: colors.backgroundColor[0],
        borderColor: colors.borderColor[0],
        borderWidth: 1,
        pointRadius: type === 'line' ? 4 : 0,
        pointHoverRadius: type === 'line' ? 6 : 0,
        tension: type === 'line' ? 0.4 : 0,
        order: 1
      });
      if (showStats) {
        baseDatasets.push(
          {
            label: 'Median Values',
            data: processedData.map(d => d.median),
            backgroundColor: colors.backgroundColor[1],
            borderColor: colors.borderColor[1],
            borderWidth: 1,
            pointRadius: type === 'line' ? 3 : 0,
            pointHoverRadius: type === 'line' ? 5 : 0,
            tension: type === 'line' ? 0.4 : 0,
            order: 2
          },
          {
            label: 'Q1 (25th Percentile)',
            data: processedData.map(d => d.q1),
            backgroundColor: colors.backgroundColor[2],
            borderColor: colors.borderColor[2],
            borderWidth: 1,
            pointRadius: type === 'line' ? 3 : 0,
            pointHoverRadius: type === 'line' ? 5 : 0,
            tension: type === 'line' ? 0.4 : 0,
            order: 3,
            hidden: true
          },
          {
            label: 'Q3 (75th Percentile)',
            data: processedData.map(d => d.q3),
            backgroundColor: colors.backgroundColor[3],
            borderColor: colors.borderColor[3],
            borderWidth: 1,
            pointRadius: type === 'line' ? 3 : 0,
            pointHoverRadius: type === 'line' ? 5 : 0,
            tension: type === 'line' ? 0.4 : 0,
            order: 3,
            hidden: true
          },
          {
            label: 'Min Values',
            data: processedData.map(d => d.min),
            backgroundColor: colors.backgroundColor[4],
            borderColor: colors.borderColor[4],
            borderWidth: 1,
            pointRadius: type === 'line' ? 3 : 0,
            pointHoverRadius: type === 'line' ? 5 : 0,
            tension: type === 'line' ? 0.4 : 0,
            order: 4
          },
          {
            label: 'Max Values',
            data: processedData.map(d => d.max),
            backgroundColor: colors.backgroundColor[5],
            borderColor: colors.borderColor[5],
            borderWidth: 1,
            pointRadius: type === 'line' ? 3 : 0,
            pointHoverRadius: type === 'line' ? 5 : 0,
            tension: type === 'line' ? 0.4 : 0,
            order: 4
          }
        );
      }
      return {
        error: null,
        chartData: {
          labels: numericFields.map(field => field.name),
          datasets: baseDatasets
        } as ChartData<'line' | 'bar'>
      };
    } catch (err: unknown) {
      console.error('Chart generation error:', err);
      return { error: err instanceof Error ? err.message : 'Chart generation failed', chartData: null };
    }
  }, [data, type, selectedFields, showStats, colors]);

  // Set error state only in effect, not in memo
  React.useEffect(() => {
    setError(chartDataResult.error);
  }, [chartDataResult.error]);

  const chartData = chartDataResult.chartData;

  const options = React.useMemo<ChartOptions<'bar' | 'line' | 'scatter' | 'pie' | 'radar'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 750,
      easing: 'easeInOutQuart'
    },
    interaction: {
      mode: 'nearest',
      intersect: false,
      axis: 'xy'
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          color: '#374151',
          font: {
            size: 12,
            weight: 'bold'
          },
          boxWidth: 12,
          boxHeight: 12
        },
        onClick: (_, legendItem, legend) => {
          const index = legendItem.datasetIndex;
          if (typeof index === 'number') {
            const ci = legend.chart;
            if (ci.getDatasetMeta(index).hidden === null) {
              ci.setDatasetVisibility(index, false);
            } else {
              ci.setDatasetVisibility(index, true);
            }
            ci.update();
          }
        },
        onHover: (_, legendItem, legend) => {
          const chart = legend.chart;
          setHoveredElement({
            datasetLabel: legendItem.text
          });
          chart.update();
        },
        onLeave: () => {
          setHoveredElement(null);
        }
      },
      title: {
        display: !!title,
        text: title || '',
        color: '#374151',
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: {
          top: 10,
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: (context) => {
            // Handle undefined or null values
            if (context.parsed === undefined || context.parsed === null) {
              return 'No data';
            }

            // For scatter plots
            if (type === 'scatter') {
              const x = typeof context.parsed.x === 'number' ? context.parsed.x.toFixed(2) : 'N/A';
              const y = typeof context.parsed.y === 'number' ? context.parsed.y.toFixed(2) : 'N/A';
              return [
                `X: ${x}`,
                `Y: ${y}`
              ];
            }
            
            // For other chart types
            const value = context.parsed.y ?? context.parsed;
            if (typeof value !== 'number') {
              return `${context.label || ''}: Invalid data`;
            }

            const fieldName = context.label || '';
            const datasetLabel = context.dataset.label || '';
            
            // For pie/radar charts
            if (type === 'pie' || type === 'radar') {
              const total = (context.chart.data.datasets[0].data as number[]).reduce((a, b) => a + b, 0);
              const percentage = total !== 0 ? (context.raw as number / total) * 100 : 0;
              return [
                `${fieldName}: ${value.toFixed(2)}`,
                `Percentage: ${percentage.toFixed(2)}%`
              ];
            }
            
            return `${datasetLabel}: ${value.toFixed(2)}`;
          },
          afterLabel: (context) => {
            if (type === 'pie' || type === 'radar') return '';
            
            const field = data.find(f => f.name === context.label);
            if (!field || field.type !== 'number') return '';
            
            const values = Array.isArray(field.value) ? field.value : [field.value];
            const stats = calculateStatistics(values);
            if (!stats) return '';
            
            return [
              `Count: ${stats.count}`,
              `Sum: ${stats.sum.toFixed(2)}`,
              `Std Dev: ${stats.stdDev.toFixed(2)}`,
              `Range: ${stats.min.toFixed(2)} - ${stats.max.toFixed(2)}`,
              `IQR: ${stats.iqr.toFixed(2)}`
            ].join('\n');
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: type !== 'scatter',
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          display: true
        },
        ticks: {
          color: '#374151',
          font: {
            size: 11
          },
          padding: 8,
          callback: (value) => {
            if (typeof value === 'number') {
              return value.toFixed(2);
            }
            return value;
          }
        },
        title: {
          display: type === 'scatter',
          text: type === 'scatter' ? (chartData as ChartData<'scatter'>)?.datasets[0]?.label?.split(' vs ')[0] || 'Y' : '',
          color: '#374151',
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          display: true
        },
        ticks: {
          color: '#374151',
          font: {
            size: 11
          },
          padding: 8,
          maxRotation: 45,
          minRotation: 45
        },
        title: {
          display: type === 'scatter',
          text: type === 'scatter' ? (chartData as ChartData<'scatter'>)?.datasets[0]?.label?.split(' vs ')[1] || 'X' : '',
          color: '#374151',
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      }
    },
    onHover: (event: any, elements: any[]) => {
      if (!elements?.length || !event?.chart) {
        setHoveredElement(null);
        return;
      }

      const element = elements[0];
      const chart = event.chart;
      const datasetIndex = element?.datasetIndex;
      const dataIndex = element?.index;
      
      if (typeof datasetIndex !== 'number' || typeof dataIndex !== 'number') {
        setHoveredElement(null);
        return;
      }

      const dataset = chart.data.datasets[datasetIndex];
      if (!dataset) {
        setHoveredElement(null);
        return;
      }

      const label = chart.data.labels?.[dataIndex] || dataset.label || '';
      const rawValue = dataset.data[dataIndex];
      
      // Safely format the value
      let displayValue: string | number = '';
      try {
        if (typeof rawValue === 'number' && !isNaN(rawValue)) {
          displayValue = rawValue.toFixed(2);
        } else if (typeof rawValue === 'object' && rawValue !== null) {
          // Handle scatter plot data points {x, y}
          if ('x' in rawValue && 'y' in rawValue) {
            const x = typeof rawValue.x === 'number' ? rawValue.x.toFixed(2) : 'N/A';
            const y = typeof rawValue.y === 'number' ? rawValue.y.toFixed(2) : 'N/A';
            displayValue = `X: ${x}, Y: ${y}`;
          } else {
            displayValue = JSON.stringify(rawValue);
          }
        } else if (rawValue !== undefined && rawValue !== null) {
          displayValue = String(rawValue);
        }
      } catch (err) {
        console.error('Error formatting hover value:', err);
        displayValue = 'Error';
      }

      setHoveredElement({
        label: String(label),
        value: displayValue,
        datasetLabel: dataset.label
      });
    }
  }), [title, type, chartData, data]);

  React.useEffect(() => {
    setIsLoading(false);
  }, [chartData]);

  // Update error handling to use onError prop
  React.useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  if (!chartData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-red-500/10 text-red-400 p-4 rounded-lg max-w-md text-center">
          <p className="text-sm font-medium break-words">{error}</p>
          {error?.includes('numeric fields') && (
            <p className="text-xs mt-2">
              Tip: Only numeric fields can be visualized. Ensure your data contains numeric values.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[400px]">
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Processing data...</span>
        </div>
      ) : error ? (
        <div className="absolute inset-0 flex items-center justify-center text-red-500">
          {error}
        </div>
      ) : chartData ? (
        <>
          <div className="absolute top-2 right-2 z-10 bg-white/80 p-1 rounded text-xs">
            {hoveredElement && (
              <div className="text-gray-700">
                {hoveredElement.datasetLabel && <div>Dataset: {hoveredElement.datasetLabel}</div>}
                {hoveredElement.label && <div>Label: {hoveredElement.label}</div>}
                {hoveredElement.value && <div>Value: {hoveredElement.value}</div>}
              </div>
            )}
          </div>
          
          {type === 'line' && <Line data={chartData as ChartData<'line'>} options={options as ChartOptions<'line'>} />}
          {type === 'bar' && <Bar data={chartData as ChartData<'bar'>} options={options as ChartOptions<'bar'>} />}
          {type === 'scatter' && <Scatter data={chartData as ChartData<'scatter'>} options={options as ChartOptions<'scatter'>} />}
          {type === 'pie' && <Pie data={chartData as ChartData<'pie'>} options={options as ChartOptions<'pie'>} />}
          {type === 'radar' && <Radar data={chartData as ChartData<'radar'>} options={options as ChartOptions<'radar'>} />}
          
          <div className="mt-2 text-xs text-gray-500 text-center">
            {type === 'scatter' && 'Click and drag to zoom. Double-click to reset.'}
            {type !== 'scatter' && 'Click on legend items to toggle visibility.'}
          </div>
        </>
      ) : null}
    </div>
  );
}