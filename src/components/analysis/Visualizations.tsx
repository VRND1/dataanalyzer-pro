import { BarChart2, TrendingUp, PieChart, ScatterChart } from 'lucide-react';
import { DataField } from '@/types/data';
import { Line, Bar, Pie, Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ScatterController,
} from 'chart.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  ScatterController,
  Title,
  Tooltip,
  Legend
);

interface VisualizationsProps {
  data: {
    fields: DataField[];
  };
  showStats?: boolean;
  selectedFields?: string[];
  chartType?: 'bar' | 'line' | 'pie' | 'scatter';
}

export function Visualizations({ 
  data, 
  showStats = true, 
  selectedFields = [],
  chartType = 'bar' 
}: VisualizationsProps) {
  const fields = data?.fields || [];
  const numericFields = Array.isArray(fields) ? fields.filter(f => f.type === 'number') : [];
  
  // Use selected fields if provided, otherwise use all numeric fields
  const displayFields = selectedFields.length > 0 
    ? numericFields.filter(field => selectedFields.includes(field.name))
    : numericFields;

  if (displayFields.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <BarChart2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Numeric Data Available
            </h3>
            <p className="text-gray-600">
              Upload data with numeric fields to see visualizations.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Enhanced chart data with better statistics
  const chartData = {
    labels: displayFields.map(field => field.name),
    datasets: [{
      label: 'Mean Values',
      data: displayFields.map(field => {
        const values = field.value as number[];
        if (values.length === 0) return 0;
        
        if (showStats && field.stats?.mean !== undefined) {
          return field.stats.mean;
        }
        return values.reduce((sum, val) => sum + val, 0) / values.length;
      }),
      backgroundColor: 'rgba(99, 102, 241, 0.6)',
      borderColor: 'rgb(99, 102, 241)',
      borderWidth: 2,
      tension: chartType === 'line' ? 0.4 : 0,
    }]
  };

  // Add additional datasets for statistics if enabled
  if (showStats) {
    // Median dataset
    chartData.datasets.push({
      label: 'Median Values',
      data: displayFields.map(field => {
        const values = field.value as number[];
        if (values.length === 0) return 0;
        
        if (field.stats?.median !== undefined) {
          return field.stats.median;
        }
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0 
          ? (sorted[mid - 1] + sorted[mid]) / 2 
          : sorted[mid];
      }),
      backgroundColor: 'rgba(34, 197, 94, 0.6)',
      borderColor: 'rgb(34, 197, 94)',
      borderWidth: 2,
      tension: chartType === 'line' ? 0.4 : 0,
    });

    // Max values dataset
    chartData.datasets.push({
      label: 'Max Values',
      data: displayFields.map(field => {
        const values = field.value as number[];
        if (values.length === 0) return 0;
        
        if (field.stats?.max !== undefined) {
          return field.stats.max;
        }
        return Math.max(...values);
      }),
      backgroundColor: 'rgba(239, 68, 68, 0.6)',
      borderColor: 'rgb(239, 68, 68)',
      borderWidth: 2,
      tension: chartType === 'line' ? 0.4 : 0,
    });
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      title: {
        display: true,
        text: 'Data Overview',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: chartType !== 'pie' ? {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    } : undefined,
    interaction: {
      mode: 'nearest' as const,
      axis: 'xy' as const,
      intersect: false,
    },
  };

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return <Line data={chartData} options={options} />;
      case 'pie':
        return <Pie data={chartData} options={options} />;
      case 'scatter':
        return <Scatter data={chartData} options={options} />;
      default:
        return <Bar data={chartData} options={options} />;
    }
  };

  const getChartIcon = () => {
    switch (chartType) {
      case 'line':
        return <TrendingUp className="h-5 w-5 text-blue-600" />;
      case 'pie':
        return <PieChart className="h-5 w-5 text-green-600" />;
      case 'scatter':
        return <ScatterChart className="h-5 w-5 text-purple-600" />;
      default:
        return <BarChart2 className="h-5 w-5 text-indigo-600" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getChartIcon()}
          Data Visualization
          <Badge variant="secondary" className="ml-2">
            {displayFields.length} fields
          </Badge>
        </CardTitle>
        <CardDescription>
          Interactive {chartType} chart showing {showStats ? 'statistical' : 'raw'} data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          {renderChart()}
        </div>
        
        {/* Data Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-indigo-600">
              {displayFields.length}
            </div>
            <div className="text-sm text-gray-600">Fields Analyzed</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {displayFields.filter(f => f.stats?.trend === 'up').length}
            </div>
            <div className="text-sm text-gray-600">Upward Trends</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {displayFields.filter(f => f.stats?.outliers && f.stats.outliers.length > 0).length}
            </div>
            <div className="text-sm text-gray-600">Fields with Outliers</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}