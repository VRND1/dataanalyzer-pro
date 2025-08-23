import { useEffect } from 'react';
import { BarChart2, Brain } from 'lucide-react';
import type { DataField } from '@/types/data';
import type { AnalyzedData } from '@/types/analysis';
import { ChartView } from '@/components/visualization';
import { useAnalysis } from '@/hooks/analysis/useAnalysis';
import { 
  AnalysisHeader, 
  ErrorMessage, 
  ProgressBar,
  AnalysisOverview,
  StatisticalSummary,
  CorrelationMatrix
} from './components';
import { BusinessMetrics } from '@/components/analysis/BusinessMetrics';

interface AnalysisSectionProps {
  data: {
    fields: DataField[];
  };
  category?: string | null;
  results?: AnalyzedData;
}

export function AnalysisSection({ data, category, results: initialResults }: AnalysisSectionProps) {
  const { analyze, isAnalyzing, error, progress, results: analysisResults } = useAnalysis();

  useEffect(() => {
    analyze(data.fields, category || undefined);
  }, [analyze, data.fields, category]);

  // Use either the initial results or the analysis results
  const results = initialResults || analysisResults;

  if (error) {
    return <ErrorMessage message={error.message} />;
  }
  
  if (isAnalyzing) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-6 h-6 text-indigo-600" />
          <h3 className="text-lg font-semibold text-black-500">Analyzing Data</h3>
        </div>
        <ProgressBar progress={progress} />
      </div>
    );
  }
  
  const numericFields = data.fields.filter(f => f.type === 'number');

  return (
    <div className="space-y-8">
      <AnalysisOverview data={data} results={results} />

      {numericFields.length > 0 && (
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <AnalysisHeader 
              title="Data Visualization" 
              icon={<BarChart2 className="w-5 h-5 text-indigo-600" />} 
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ChartView data={data.fields} type="bar" title="Overview" />
              <ChartView data={data.fields} type="line" title="Trends" />
            </div>
          </div>

          <CorrelationMatrix fields={data.fields} />
          <StatisticalSummary data={data} results={results} />
          <BusinessMetrics data={data} />
        </div>
      )}
    </div>
  );
}