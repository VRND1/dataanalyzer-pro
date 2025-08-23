import { ChartData, ChartOptions } from 'chart.js';
import { DataField } from '@/types/data';

export class ChartFactory {
  private static readonly DEFAULT_OPTIONS: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: true
      }
    }
  };

  static createDistributionChart(fields: DataField[]): { data: ChartData; options: ChartOptions } {
    const numericFields = fields.filter(f => f.type === 'number');
    
    return {
      data: {
        labels: numericFields.map(f => f.name),
        datasets: [{
          label: 'Distribution',
          data: numericFields.map(f => {
            const values = f.value as number[];
            return values.reduce((a, b) => a + b, 0) / values.length;
          }),
          backgroundColor: 'rgba(99, 102, 241, 0.5)',
          borderColor: 'rgb(99, 102, 241)',
          borderWidth: 1
        }]
      },
      options: {
        ...this.DEFAULT_OPTIONS,
        plugins: {
          ...this.DEFAULT_OPTIONS.plugins,
          title: {
            display: true,
            text: 'Data Distribution'
          }
        }
      }
    };
  }

  static createTrendChart(fields: DataField[]): { data: ChartData; options: ChartOptions } {
    const numericFields = fields.filter(f => f.type === 'number');
    
    return {
      data: {
        labels: Array.from(
          { length: Math.max(...numericFields.map(f => f.value.length)) },
          (_, i) => i + 1
        ),
        datasets: numericFields.map((field, i) => ({
          label: field.name,
          data: field.value as number[],
          borderColor: `hsl(${i * 360 / numericFields.length}, 70%, 50%)`,
          backgroundColor: `hsla(${i * 360 / numericFields.length}, 70%, 50%, 0.1)`,
          fill: true
        }))
      },
      options: {
        ...this.DEFAULT_OPTIONS,
        plugins: {
          ...this.DEFAULT_OPTIONS.plugins,
          title: {
            display: true,
            text: 'Trend Analysis'
          }
        }
      }
    };
  }

  static createCorrelationChart(fields: DataField[]): { data: ChartData; options: ChartOptions } {
    const numericFields = fields.filter(f => f.type === 'number');
    if (numericFields.length < 2) return { data: { datasets: [] }, options: this.DEFAULT_OPTIONS };
    
    const [field1, field2] = numericFields;
    
    return {
      data: {
        datasets: [{
          label: `${field1.name} vs ${field2.name}`,
          data: (field1.value as number[]).map((x, i) => ({
            x,
            y: (field2.value as number[])[i]
          })),
          backgroundColor: 'rgba(99, 102, 241, 0.5)'
        }]
      },
      options: {
        ...this.DEFAULT_OPTIONS,
        plugins: {
          ...this.DEFAULT_OPTIONS.plugins,
          title: {
            display: true,
            text: 'Correlation Analysis'
          }
        }
      }
    };
  }

  static createRegressionChart(
    actual: number[],
    predicted: number[]
  ): { data: ChartData; options: ChartOptions } {
    return {
      data: {
        labels: Array.from({ length: actual.length }, (_, i) => i + 1),
        datasets: [
          {
            label: 'Actual',
            data: actual,
            borderColor: 'rgb(99, 102, 241)',
            backgroundColor: 'transparent',
            pointRadius: 2
          },
          {
            label: 'Predicted',
            data: predicted,
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            pointRadius: 0
          }
        ]
      },
      options: {
        ...this.DEFAULT_OPTIONS,
        plugins: {
          ...this.DEFAULT_OPTIONS.plugins,
          title: {
            display: true,
            text: 'Regression Analysis'
          }
        }
      }
    };
  }
}