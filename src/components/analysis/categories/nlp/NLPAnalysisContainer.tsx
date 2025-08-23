import type { DataField } from '@/types/data';
import { NLQuerySection } from './NLQuerySection';
import NLPInsights from './NLPInsights';
import { NLQueryResponse } from './NLQueryResponse';
import { NLQueryInput } from './NLQueryInput';

interface NLPAnalysisContainerProps {
  data: {
    fields: DataField[];
  };
  analysis?: {
    sentiment?: {
      score: number;
      label: string;
      confidence: number;
    };
    keywords?: {
      text: string;
      relevance: number;
    }[];
    summary?: string;
    categories?: {
      label: string;
      confidence: number;
    }[];
  };
  loading?: boolean;
  error?: string | null;
  queryResponse?: {
    answer: string;
    data?: DataField[];
    visualization?: {
      type: 'bar' | 'line' | 'scatter';
      title?: string;
    };
    error?: string;
  } | null;
  onQuery?: (query: string) => Promise<void>;
}

export function NLPAnalysisContainer({
  data,
  analysis,
  loading = false,
  error = null,
  queryResponse = null,
  onQuery
}: NLPAnalysisContainerProps) {
  return (
    <div className="space-y-6">
      {/* NLP Query Input */}
      {onQuery && (
        <div className="mb-6">
          <NLQueryInput
            onQuery={onQuery}
            isLoading={loading}
            placeholder="Ask a question about your data..."
          />
        </div>
      )}

      {/* NLP Query Section */}
      <NLQuerySection data={data} />

      {/* Query Response Section */}
      {queryResponse && <NLQueryResponse response={queryResponse} />}

      {/* NLP Insights Section */}
      {analysis && (
        <NLPInsights
          sentiment={analysis.sentiment || { score: 0, label: 'neutral', confidence: 0 }}
          keywords={analysis.keywords || []}
          summary={analysis.summary || ''}
          categories={analysis.categories || []}
          loading={loading}
          error={error}
        />
      )}
    </div>
  );
} 