import { TrendingUp, TrendingDown, Minus, Info, AlertCircle } from 'lucide-react';
import type { DataField } from '@/types/data';
import { useState, useEffect } from 'react';

interface FieldStatsProps {
  field: DataField;
  showAdvanced?: boolean;
  onAnalysisRequest?: (fieldName: string, analysisType: string) => void;
}

export function FieldStats({ field, showAdvanced = false, onAnalysisRequest }: FieldStatsProps) {
  const values = field.value as number[];
  const [stats, setStats] = useState(analyzeField(values));
  const [isLoading, setIsLoading] = useState(false);
  const [analysisNote, setAnalysisNote] = useState('');

  useEffect(() => {
    setStats(analyzeField(values));
  }, [values]);

  const TrendIcon = getTrendIcon(stats.trend);
  const hasEnoughData = values.length >= 3; // Minimum for meaningful analysis

  const handleAdvancedAnalysis = async (type: string) => {
    if (!onAnalysisRequest) return;
    setIsLoading(true);
    setAnalysisNote('');
    try {
      await onAnalysisRequest(field.name, type);
    } catch (error) {
      setAnalysisNote('Analysis failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-medium text-gray-900">{field.name}</h4>
        {!hasEnoughData && (
          <span className="flex items-center text-xs text-yellow-600">
            <AlertCircle className="w-3 h-3 mr-1" />
            Limited data
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-2 mb-4">
        <TrendIcon className={`w-5 h-5 ${getTrendColor(stats.trend)}`} />
        <span className="text-sm font-medium text-gray-700">
          {getTrendLabel(stats.trend)}
          {stats.confidence && stats.confidence < 0.7 && (
            <span className="text-xs text-gray-500 ml-1">(low confidence)</span>
          )}
        </span>
      </div>

      <div className="space-y-2 text-gray-800 mb-4">
        <StatRow label="Sample Size" value={values.length.toString()} />
        <StatRow 
          label="Mean (Avg)" 
          value={formatNumber(stats.mean)} 
          tooltip="The average of all values"
        />
        <StatRow 
          label="Median" 
          value={formatNumber(stats.median)} 
          tooltip="The middle value when all numbers are sorted"
        />
        <StatRow 
          label="Std Deviation" 
          value={formatNumber(stats.stdDev)} 
          tooltip="Measures how spread out the numbers are"
        />
        <StatRow label="Range" value={`${formatNumber(stats.min)} - ${formatNumber(stats.max)}`} />
        {stats.iqr && (
          <StatRow 
            label="IQR (Middle 50%)" 
            value={`${formatNumber(stats.iqr.q1)} - ${formatNumber(stats.iqr.q3)}`}
            tooltip="Interquartile range shows where the middle 50% of values fall"
          />
        )}
      </div>

      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Advanced Analysis</h5>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => handleAdvancedAnalysis('outliers')}
              disabled={isLoading}
              className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1 rounded"
            >
              {isLoading ? 'Processing...' : 'Detect Outliers'}
            </button>
            <button 
              onClick={() => handleAdvancedAnalysis('seasonality')}
              disabled={isLoading}
              className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 px-3 py-1 rounded"
            >
              Check Seasonality
            </button>
            <button 
              onClick={() => handleAdvancedAnalysis('forecast')}
              disabled={isLoading}
              className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1 rounded"
            >
              Forecast Trend
            </button>
          </div>
          {analysisNote && (
            <p className="text-xs mt-2 text-gray-600">{analysisNote}</p>
          )}
        </div>
      )}

      {stats.notes && (
        <div className="mt-3 text-xs text-gray-500 flex items-start">
          <Info className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
          <span>{stats.notes}</span>
        </div>
      )}
    </div>
  );
}

interface StatRowProps {
  label: string;
  value: string;
  tooltip?: string;
}

function StatRow({ label, value, tooltip }: StatRowProps) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center">
        <span className="text-sm text-gray-600">{label}</span>
        {tooltip && (
          <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Info className="w-3 h-3 text-gray-400" />
          </span>
        )}
      </div>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

interface FieldAnalysis {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  trend: 'up' | 'down' | 'stable';
  confidence?: number;
  iqr?: {
    q1: number;
    q3: number;
  };
  notes?: string;
}

function analyzeField(values: number[]): FieldAnalysis {
  if (values.length === 0) {
    return {
      mean: 0,
      median: 0,
      stdDev: 0,
      min: 0,
      max: 0,
      trend: 'stable',
      notes: 'No data available for analysis'
    };
  }

  // Basic statistics
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sorted = [...values].sort((a, b) => a - b);
  const median = getMedian(sorted);
  
  // Standard deviation
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  // Trend analysis with confidence
  const trendAnalysis = analyzeTrend(values);
  
  // Interquartile range
  let iqr;
  if (values.length >= 4) {
    iqr = {
      q1: getPercentile(sorted, 25),
      q3: getPercentile(sorted, 75)
    };
  }

  // Generate helpful notes
  const notes = generateAnalysisNotes(values, mean, stdDev, iqr);

  return {
    mean,
    median,
    stdDev,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    ...trendAnalysis,
    iqr,
    notes
  };
}

function getMedian(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 
    ? sorted[mid] 
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function getPercentile(sorted: number[], percentile: number): number {
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const fraction = index - lower;
  
  if (lower + 1 >= sorted.length) return sorted[lower];
  return sorted[lower] + fraction * (sorted[lower + 1] - sorted[lower]);
}

function analyzeTrend(values: number[]): { trend: 'up' | 'down' | 'stable', confidence?: number } {
  if (values.length < 3) {
    return { trend: 'stable', confidence: 0 };
  }

  // Use linear regression for more accurate trend detection
  let xSum = 0, ySum = 0, xySum = 0, xxSum = 0;
  const n = values.length;
  
  for (let i = 0; i < n; i++) {
    xSum += i;
    ySum += values[i];
    xySum += i * values[i];
    xxSum += i * i;
  }
  
  const slope = (n * xySum - xSum * ySum) / (n * xxSum - xSum * xSum);
  const yIntercept = (ySum - slope * xSum) / n;
  
  // Calculate R-squared for confidence
  let ssTot = 0, ssRes = 0;
  const yMean = ySum / n;
  
  for (let i = 0; i < n; i++) {
    const yPred = slope * i + yIntercept;
    ssTot += Math.pow(values[i] - yMean, 2);
    ssRes += Math.pow(values[i] - yPred, 2);
  }
  
  const rSquared = 1 - (ssRes / ssTot);
  const confidence = Math.min(Math.max(rSquared, 0), 1); // Clamp between 0 and 1
  
  // Determine trend based on slope and confidence
  const relativeSlope = slope / Math.abs(yMean || 1); // Normalize slope
  const threshold = 0.05; // 5% change is considered significant
  
  if (Math.abs(relativeSlope) < threshold || confidence < 0.5) {
    return { trend: 'stable', confidence };
  }
  
  return {
    trend: slope > 0 ? 'up' : 'down',
    confidence
  };
}

function generateAnalysisNotes(
  values: number[],
  mean: number,
  stdDev: number,
  iqr?: { q1: number; q3: number }
): string | undefined {
  const notes = [];
  
  if (values.length < 5) {
    notes.push('Very small dataset - results may not be reliable');
  } else if (values.length < 30) {
    notes.push('Small dataset - consider collecting more data');
  }
  
  if (stdDev / (mean || 1) > 0.5) {
    notes.push('High variability in data points');
  }
  
  if (iqr) {
    const iqrRange = iqr.q3 - iqr.q1;
    const lowerOutlierBound = iqr.q1 - 1.5 * iqrRange;
    const upperOutlierBound = iqr.q3 + 1.5 * iqrRange;
    
    const outliers = values.filter(v => v < lowerOutlierBound || v > upperOutlierBound);
    if (outliers.length > 0) {
      notes.push(`Potential outliers detected (${outliers.length} points)`);
    }
  }
  
  return notes.length > 0 ? notes.join('. ') + '.' : undefined;
}

function getTrendIcon(trend: 'up' | 'down' | 'stable') {
  switch (trend) {
    case 'up': return TrendingUp;
    case 'down': return TrendingDown;
    default: return Minus;
  }
}

function getTrendColor(trend: 'up' | 'down' | 'stable'): string {
  switch (trend) {
    case 'up': return 'text-green-500';
    case 'down': return 'text-red-500';
    default: return 'text-gray-500';
  }
}

function getTrendLabel(trend: 'up' | 'down' | 'stable'): string {
  switch (trend) {
    case 'up': return 'Upward Trend';
    case 'down': return 'Downward Trend';
    default: return 'Stable Trend';
  }
}

function formatNumber(value: number): string {
  if (!isFinite(value)) return 'N/A';
  
  // Format very small numbers
  if (Math.abs(value) < 0.0001 && value !== 0) {
    return value.toExponential(4);
  }
  
  // Format large numbers
  if (Math.abs(value) >= 1000000) {
    return (value / 1000000).toFixed(2) + 'M';
  }
  if (Math.abs(value) >= 1000) {
    return (value / 1000).toFixed(2) + 'K';
  }
  
  // Format regular numbers with appropriate precision
  const absValue = Math.abs(value);
  if (absValue >= 100) return value.toFixed(0);
  if (absValue >= 1) return value.toFixed(2);
  if (absValue >= 0.01) return value.toFixed(4);
  return value.toFixed(6);
}