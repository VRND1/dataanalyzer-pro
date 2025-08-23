// eslint-disable-next-line @typescript-eslint/no-unused-vars
// import React from 'react';
import { Line, Bar, Scatter } from 'react-chartjs-2';
import { ChartConfig, ChartDimensions } from '../../utils/visualization/types';
import { defaultChartOptions } from '../../utils/visualization/config';
import { createBarChartConfig, createLineChartConfig, createScatterChartConfig } from '../../utils/visualization/charts';
import { ChartData, ChartOptions } from 'chart.js';
import { DataField } from '@/types/data';

interface ChartContainerProps {
  config: ChartConfig;
  dimensions?: ChartDimensions;
  className?: string;
}

export default function ChartContainer({ config, dimensions, className }: ChartContainerProps) {
  const chartProps = {
    options: {
      ...defaultChartOptions,
      plugins: {
        ...defaultChartOptions.plugins,
        title: {
          display: !!config.options?.title,
          text: config.options?.title
        }
      }
    },
    width: dimensions?.width,
    height: dimensions?.height,
    className
  };

  switch (config.type) {
    case 'bar': {
      const { data, options } = createBarChartConfig(config.data as DataField[]);
      return <Bar {...chartProps} data={data as ChartData<'bar'>} options={options as ChartOptions<'bar'>} />;
    }
    case 'line': {
      const { data, options } = createLineChartConfig(config.data as DataField[]);
      return <Line {...chartProps} data={data as ChartData<'line'>} options={options as ChartOptions<'line'>} />;
    }
    case 'scatter': {
      if (config.data.length < 2) return null;
      const { data, options } = createScatterChartConfig(config.data[0] as DataField, config.data[1] as DataField);
      return <Scatter {...chartProps} data={data as ChartData<'scatter'>} options={options as ChartOptions<'scatter'>} />;
    }
    default:
      return null;
  }
}