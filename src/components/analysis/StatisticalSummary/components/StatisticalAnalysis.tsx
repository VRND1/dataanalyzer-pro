import type { DataField } from '../../../../types/data';
import { StatisticalSummary } from './StatisticalSummary';

interface StatisticalAnalysisProps {
  data: {
    fields: DataField[];
  };
}

export function StatisticalAnalysis({ data }: StatisticalAnalysisProps) {
  return <StatisticalSummary data={data} />;
}