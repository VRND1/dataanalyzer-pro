import { useEffect, useState } from 'react';
import { Brain, FileUp, BarChart2, Loader2, AlertCircle } from 'lucide-react';
import type { DataField } from '@/types/data';
import { useAnalysis } from '@/hooks/analysis';

// UI Components
import { DataCard } from './cards/DataCard';
import InsightList from './InsightList';
import StatisticsSummary from './StatisticsSummary/index';
import { ChartView } from '../visualization';
import MLInsights from './categories/ml/MLInsights';
import NLPInsights from './categories/nlp/NLPInsights';
import { PredictiveInsights } from '../predictive/PredictiveInsights';
import RegressionView from './RegressionView/index';
import { DataHealthScore } from '../monitoring/DataHealthScore';
import TimeSeriesAnalysis from './TimeSeriesAnalysis/index';

// Utils and Services
import { DataCleaner } from '@/utils/analysis/preprocessing/cleaner';

interface DataAnalyzerProps {
  data: {
    fields: DataField[];
  };
}

interface NLPResult {
  field: string;
  analysis: {
    sentiment: {
      score: number;
      label: string;
      confidence: number;
    };
    keywords: string[];
    summary: string;
    categories: string[];
  };
}

export default function DataAnalyzer({ data }: DataAnalyzerProps) {
  // State from useAnalysis hook
  const { isAnalyzing, error: analysisError, results: analysisResults, analyze } = useAnalysis();
  
  // Local state
  const [cleanedData, setCleanedData] = useState<{
    fields: DataField[];
    results: Array<{
      field: DataField;
      fixes: Array<{
        type: string;
        count: number;
        description: string;
      }>;
      healthScore: number;
    }>;
    overallHealth: number;
  } | null>(null);

  useEffect(() => {
    const processData = async () => {
      try {
        // Clean and preprocess data
        const cleanedResult = await DataCleaner.cleanData(data.fields);
        setCleanedData(cleanedResult);

        // Trigger analysis through the hook
        analyze(cleanedResult.fields);
      } catch (err) {
        console.error('Error in data processing:', err);
      }
    };

    processData();
  }, [data, analyze]);

  if (isAnalyzing) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <span className="ml-2 text-gray-600">Analyzing data...</span>
      </div>
    );
  }

  if (analysisError) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-red-600 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>Error: {analysisError.message}</span>
        </div>
      </div>
    );
  }

  if (!analysisResults || !cleanedData) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-gray-500">No data available for analysis</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Data Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <DataHealthScore
          score={cleanedData.overallHealth}
          results={cleanedData.results}
        />
        <DataCard
          icon={<FileUp className="w-5 h-5 text-indigo-600" />}
          title="Total Fields"
          value={data.fields.length}
        />
        <DataCard
          icon={<BarChart2 className="w-5 h-5 text-indigo-600" />}
          title="Numeric Fields"
          value={Array.isArray(analysisResults?.fields) ? analysisResults.fields.filter((f: DataField) => f.type === 'number').length : 0}
        />
        <DataCard
          icon={<Brain className="w-5 h-5 text-indigo-600" />}
          title="Text Fields"
          value={Array.isArray(analysisResults?.fields) ? analysisResults.fields.filter((f: DataField) => f.type === 'string').length : 0}
        />
      </div>

      {/* Key Insights */}
      {analysisResults.insights && analysisResults.insights.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <InsightList insights={analysisResults.insights} />
        </div>
      )}

      {/* Data Visualization */}
      {analysisResults.hasNumericData && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Data Visualization</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartView data={analysisResults.fields} type="bar" title="Overview" />
            <ChartView data={analysisResults.fields} type="line" title="Trends" />
          </div>
        </div>
      )}

      {/* Statistics Summary */}
      {analysisResults.hasNumericData && analysisResults.statistics && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <StatisticsSummary statistics={analysisResults.statistics} />
        </div>
      )}

      {/* ML Insights */}
      {analysisResults.mlAnalysis && (
        <MLInsights 
          predictions={analysisResults.mlAnalysis.predictions}
          actuals={[]}
          confidence={analysisResults.mlAnalysis.confidence}
          features={analysisResults.mlAnalysis.features}
        />
      )}

      {/* NLP Insights */}
      {analysisResults.hasTextData && analysisResults.nlpResults && analysisResults.nlpResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {analysisResults.nlpResults.map((result: NLPResult, index: number) => (
            <NLPInsights 
              key={index} 
              {...result.analysis}
              keywords={result.analysis.keywords.map(text => ({ text, relevance: 1 }))}
              categories={result.analysis.categories.map(label => ({ label, confidence: 1 }))}
            />
          ))}
        </div>
      )}

      {/* Regression Analysis */}
      {analysisResults.regressionResults && analysisResults.regressionResults.length > 0 && (
        <RegressionView results={analysisResults.regressionResults} />
      )}

      {/* Time Series Analysis */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Time Series Analysis</h2>
        <TimeSeriesAnalysis 
          data={[]} 
        />
      </div>

      {/* Predictive Insights */}
      {analysisResults.predictions && analysisResults.predictions.length > 0 && (
        <PredictiveInsights predictions={analysisResults.predictions} />
      )}
    </div>
  );
}