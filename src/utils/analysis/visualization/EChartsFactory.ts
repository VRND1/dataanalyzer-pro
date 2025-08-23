import { EChartsOption } from 'echarts';
import { DataField } from '@/types/data';

export class EChartsFactory {
  static createDistributionChart(data: DataField[]): EChartsOption {
    const numericFields = data.filter(f => f.type === 'number');
    
    return {
      title: {
        text: 'Data Distribution'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: numericFields.map(f => f.name)
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: numericFields.map(f => f.name)
      },
      yAxis: {
        type: 'value'
      },
      series: numericFields.map(field => ({
        name: field.name,
        type: 'bar',
        data: [
          field.value && Array.isArray(field.value) 
            ? field.value.filter(v => typeof v === 'number').reduce((a, b) => a + b, 0) / field.value.filter(v => typeof v === 'number').length
            : 0
        ],
        itemStyle: {
          borderRadius: [4, 4, 0, 0]
        }
      }))
    };
  }

  static createTimeSeriesChart(data: DataField[]): EChartsOption {
    const numericFields = data.filter(f => f.type === 'number');
    
    return {
      title: {
        text: 'Time Series Analysis'
      },
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: numericFields.map(f => f.name)
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: Array.from({ length: Math.max(...numericFields.map(f => f.value.length)) }, (_, i) => i + 1)
      },
      yAxis: {
        type: 'value'
      },
      series: numericFields.map((field, index) => ({
        name: field.name,
        type: 'line',
        data: field.value,
        smooth: true,
        areaStyle: {
          opacity: 0.1
        },
        itemStyle: {
          color: `rgb(${Math.sin(index * 0.5) * 127 + 128}, ${Math.sin(index * 0.5 + 2) * 127 + 128}, ${Math.sin(index * 0.5 + 4) * 127 + 128})`
        }
      }))
    };
  }

  static createCorrelationHeatmap(data: DataField[]): EChartsOption {
    const numericFields = data.filter(f => f.type === 'number');
    const correlations: number[][] = [];
    const labels = numericFields.map(f => f.name);

    // Calculate correlations
    for (let i = 0; i < numericFields.length; i++) {
      correlations[i] = [];
      for (let j = 0; j < numericFields.length; j++) {
        const values1 = numericFields[i].value as number[];
        const values2 = numericFields[j].value as number[];
        
        // Calculate correlation
        const mean1 = values1.reduce((a, b) => a + b, 0) / values1.length;
        const mean2 = values2.reduce((a, b) => a + b, 0) / values2.length;
        
        let num = 0, den1 = 0, den2 = 0;
        for (let k = 0; k < values1.length; k++) {
          const diff1 = values1[k] - mean1;
          const diff2 = values2[k] - mean2;
          num += diff1 * diff2;
          den1 += diff1 * diff1;
          den2 += diff2 * diff2;
        }
        
        correlations[i][j] = num / Math.sqrt(den1 * den2);
      }
    }

    return {
      title: {
        text: 'Correlation Heatmap'
      },
      tooltip: {
        position: 'top'
      },
      grid: {
        height: '50%',
        top: '10%'
      },
      xAxis: {
        type: 'category',
        data: labels,
        splitArea: {
          show: true
        }
      },
      yAxis: {
        type: 'category',
        data: labels,
        splitArea: {
          show: true
        }
      },
      visualMap: {
        min: -1,
        max: 1,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '15%',
        inRange: {
          color: ['#d73027', '#f46d43', '#fdae61', '#fee090', '#ffffbf', '#e0f3f8', '#abd9e9', '#74add1', '#4575b4']
        }
      },
      series: [{
        name: 'Correlation',
        type: 'heatmap',
        data: correlations.flatMap((row, i) => 
          row.map((value, j) => [i, j, value.toFixed(2)])
        ),
        label: {
          show: true
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    };
  }
}