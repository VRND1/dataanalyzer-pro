import { useMemo } from 'react';
import { DataField } from '@/types/data';
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
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ChartProps {
  field: DataField;
}

export const Chart: React.FC<ChartProps> = ({ field }) => {
  if (field.type !== 'number') {
    return null;
  }

  const values = field.value as number[];
  if (!values || values.length === 0) {
    return null;
  }

  const labels = useMemo(() => values.map((_, index) => `Point ${index + 1}`), [values]);

  const barChartData = useMemo<ChartData<'bar'>>(() => ({
    labels,
    datasets: [
      {
        label: field.name,
        data: values,
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1,
      },
    ],
  }), [labels, values, field.name]);

  const lineChartData = useMemo<ChartData<'line'>>(() => ({
    labels,
    datasets: [
      {
        label: field.name,
        data: values,
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1,
        tension: 0.1,
      },
    ],
  }), [labels, values, field.name]);

  const barOptions = useMemo<ChartOptions<'bar'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: field.name,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#374151',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        ticks: {
          color: '#374151',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  }), [field.name]);

  const lineOptions = useMemo<ChartOptions<'line'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: field.name,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#374151',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        ticks: {
          color: '#374151',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  }), [field.name]);

  return (
    <div className="space-y-4">
      <div className="h-[300px]">
        <Bar data={barChartData} options={barOptions} />
      </div>
      <div className="h-[300px]">
        <Line data={lineChartData} options={lineOptions} />
      </div>
    </div>
  );
}; 