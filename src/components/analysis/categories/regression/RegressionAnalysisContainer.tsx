import { RegressionAnalysis } from './RegressionAnalysis';
import { DataField } from '@/types/data';

interface RegressionAnalysisContainerProps {
  data: {
    fields: DataField[];
  };
}

export function RegressionAnalysisContainer({ data }: RegressionAnalysisContainerProps) {
  return <RegressionAnalysis fields={data.fields} />;
} 