import { Brain, CheckCircle, Lightbulb, TrendingUp, AlertTriangle } from 'lucide-react';

interface InsightsAnalysis {
  overview: {
    totalFields: number;
    numericFields: number;
    textFields: number;
    recordCount: number;
  };
  keyTrends: Array<{
    field: string;
    trend: string;
    changePercent: number;
    significance: 'high' | 'medium' | 'low';
  }>;
  anomalies: Array<{
    field: string;
    value: number;
    threshold: number;
    type: 'high' | 'low';
  }>;
  correlations: Array<{
    fields: [string, string];
    coefficient: number;
    strength: 'strong' | 'moderate' | 'weak';
  }>;
  recommendations: string[];
}

interface InsightsPanelProps {
  analysis: InsightsAnalysis;
}

export default function InsightsPanel({ analysis }: InsightsPanelProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Key Insights */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-black-600" />
          <h3 className="text-lg font-semibold text-black">Key Insights</h3>
        </div>
        <ul className="space-y-2">
          {analysis.keyTrends.map((trend, index) => (
            <li key={index} className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-black-500 mt-1 flex-shrink-0" />
              <span className="text-black-700">
                {trend.field} shows a {trend.significance} {trend.trend} trend ({trend.changePercent.toFixed(1)}% change)
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Anomalies */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-semibold text-black-500">Anomalies</h3>
        </div>
        <ul className="space-y-2">
          {analysis.anomalies.map((anomaly, index) => (
            <li key={index} className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 mt-1 flex-shrink-0" />
              <span className="text-gray-700">
                {anomaly.field} has an unusually {anomaly.type} value of {anomaly.value}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Correlations */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-black-500">Correlations</h3>
        </div>
        <ul className="space-y-2">
          {analysis.correlations.map((correlation, index) => (
            <li key={index} className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
              <span className="text-gray-700">
                {correlation.fields[0]} and {correlation.fields[1]} show a {correlation.strength} correlation (r = {correlation.coefficient.toFixed(2)})
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Recommendations */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-black-500">Recommendations</h3>
        </div>
        <ul className="space-y-2">
          {analysis.recommendations.map((recommendation, index) => (
            <li key={index} className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <span className="text-gray-700">{recommendation}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}