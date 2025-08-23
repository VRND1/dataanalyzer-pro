import type { DataField } from '../../../../types/data';

export interface StatisticalSummaryProps {
  data: {
    fields: DataField[];
  };
}

export interface StatsSummaryProps {
  fields: DataField[];
}

export interface StatRowProps {
  label: string;
  value: string;
}

export interface FieldStatsProps {
  field: DataField;
}

export type TrendIndicatorProps = {
  trend: 'up' | 'down' | 'stable';
  className?: string;
};