import AIInsights from './AIInsights';
import AnalysisProgress from './AnalysisProgress';
import MLInsights from './categories/ml/MLInsights';
import NLPInsights from './categories/nlp/NLPInsights';
import { PredictiveInsights } from './PredictiveInsights';

interface AIAnalysisViewProps {
  analysis: any;
  isAnalyzing: boolean;
  progress: number;
}

export default function AIAnalysisView({ analysis, isAnalyzing, progress }: AIAnalysisViewProps) {
  if (isAnalyzing) {
    return <AnalysisProgress progress={progress} isAnalyzing={isAnalyzing} />;
  }

  if (!analysis) return null;

  return (
    <div className="space-y-6">
      {/* AI Insights */}
      {analysis.aiInsights && (
        <AIInsights insights={analysis.aiInsights} />
      )}

      {/* ML Analysis */}
      {analysis.mlAnalysis && (
        <MLInsights predictions={analysis.mlAnalysis.predictions || {}} 
                    actuals={[]}
                    confidence={analysis.mlAnalysis.confidence || 0} 
                    features={analysis.mlAnalysis.features || []} />
      )}

      {/* NLP Analysis */}
      {analysis.nlpAnalysis && (
        <NLPInsights sentiment={analysis.nlpAnalysis.sentiment || { score: 0, label: 'neutral', confidence: 0 }}
                     keywords={analysis.nlpAnalysis.keywords || []}
                     summary={analysis.nlpAnalysis.summary || ''}
                     categories={analysis.nlpAnalysis.categories || []} />
      )}

      {/* Predictive Analysis */}
      {analysis.predictiveAnalysis && (
        <PredictiveInsights data={{ fields: analysis.predictiveAnalysis.fields || [] }} />
      )}
    </div>
  );
}