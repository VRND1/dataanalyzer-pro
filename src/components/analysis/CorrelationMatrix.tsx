import { useState, useMemo } from 'react';
import { 
  BarChart2, 
  Info, 
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowLeftRight,
  Target,
} from 'lucide-react';
import { Scatter, Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  LinearScale,
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  CategoryScale
} from 'chart.js';
import type { DataField } from '@/types/data';
import { calculateCorrelation } from '@/utils/analysis/statistics/correlation';
import { calculateFieldStats } from '@/utils/analysis/statistics/calculations';
import { formatNumber } from '@/utils/analysis/formatting';

// Register ChartJS components
ChartJS.register(
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  CategoryScale
);

interface CorrelationMatrixProps {
  data: {
    fields: DataField[];
  };
  onFieldSelectionChange?: (selectedFields: string[]) => void;
}

interface CellProps {
  value: number;
  field1: string;
  field2: string;
  isSelected: boolean;
  onClick: () => void;
  pValue?: number;
  hasOutliers?: boolean;
}

export function CorrelationMatrix({ data, onFieldSelectionChange }: CorrelationMatrixProps) {
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [selectedPair, setSelectedPair] = useState<[string, string] | null>(null);
  
  const numericFields = useMemo(() => 
    data?.fields?.filter(f => f.type === 'number') || [], 
    [data.fields]
  );

  // Calculate all correlations, statistics, and trends
  const { correlations, fieldStats, trends } = useMemo(() => {
    const corr: Record<string, { r: number; p: number; hasOutliers: boolean }> = {};
    const stats: Record<string, ReturnType<typeof calculateFieldStats>> = {};
    const trnds: Record<string, 'up' | 'down' | 'stable'> = {};

    numericFields.forEach(field => {
      stats[field.name] = calculateFieldStats(field);
      trnds[field.name] = determineTrend(field.value as number[]);
    });

    numericFields.forEach((field1, i) => {
      numericFields.forEach((field2, j) => {
        const key = `${field1.name}_${field2.name}`;
        
        if (i === j) {
          corr[key] = { r: 1, p: 0, hasOutliers: false };
          return;
        }
        
        if (i < j) {
          try {
            const values1 = field1.value as number[];
            const values2 = field2.value as number[];
            const r = calculateCorrelation(values1, values2);
            
            // Approximate p-value
            const n = values1.length;
            const t = r * Math.sqrt((n - 2) / (1 - r * r));
            const p = 2 * (1 - Math.abs(t) / Math.sqrt(n - 2 + t * t));
            const hasOutliers = checkOutliers(values1, values2);
            
            corr[key] = { r, p, hasOutliers };
            corr[`${field2.name}_${field1.name}`] = { r, p, hasOutliers };
          } catch (error) {
            console.warn(`Correlation calculation failed for ${field1.name} vs ${field2.name}:`, error);
            corr[key] = { r: 0, p: 1, hasOutliers: false };
            corr[`${field2.name}_${field1.name}`] = { r: 0, p: 1, hasOutliers: false };
          }
        }
      });
    });

    return { correlations: corr, fieldStats: stats, trends: trnds };
  }, [numericFields]);

  // Strongest correlations for quick insights
  const strongestCorrelations = useMemo(() => {
    const pairs = [];
    
    for (let i = 0; i < numericFields.length; i++) {
      for (let j = i + 1; j < numericFields.length; j++) {
        const field1 = numericFields[i].name;
        const field2 = numericFields[j].name;
        const key = `${field1}_${field2}`;
        const { r, p, hasOutliers } = correlations[key] || { r: 0, p: 1, hasOutliers: false };
        
        pairs.push({
          field1,
          field2,
          value: r,
          pValue: p,
          hasOutliers,
          significance: p < 0.05 ? 'significant' : 'not significant',
          trend1: trends[field1],
          trend2: trends[field2]
        });
      }
    }
    
    return pairs
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .slice(0, 5);
  }, [correlations, numericFields, trends]);

  // Helper functions
  function checkOutliers(x: number[], y: number[]): boolean {
    if (x.length < 10) return false;
    
    // Normalize values
    const normalize = (arr: number[]) => {
      const min = Math.min(...arr);
      const max = Math.max(...arr);
      return arr.map(v => (v - min) / (max - min));
    };
    
    const normX = normalize(x);
    const normY = normalize(y);
    
    // Calculate distances from centroid
    const centroidX = normX.reduce((sum, val) => sum + val, 0) / normX.length;
    const centroidY = normY.reduce((sum, val) => sum + val, 0) / normY.length;
    
    const distances = normX.map((xVal, i) => 
      Math.sqrt(Math.pow(xVal - centroidX, 2) + Math.pow(normY[i] - centroidY, 2))
    );
    
    // Identify outliers (top 5% farthest points)
    const threshold = distances.sort((a, b) => b - a)[Math.floor(distances.length * 0.05)];
    return distances.some(d => d > threshold * 1.5);
  }

  function determineTrend(values: number[]): 'up' | 'down' | 'stable' {
    if (values.length < 2) return 'stable';
    
    // Simple linear trend detection
    const x = Array.from({ length: values.length }, (_, i) => i);
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((a, _, i) => a + (i * values[i]), 0);
    const sumXX = x.reduce((a, b) => a + b * b, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    if (slope > 0.1) return 'up';
    if (slope < -0.1) return 'down';
    return 'stable';
  }

  function getCorrelationColor(value: number): string {
    const absValue = Math.abs(value);
    const opacity = Math.min(0.9, absValue * 0.9 + 0.1);
    
    if (value > 0) {
      return `rgba(59, 130, 246, ${opacity})`; // Blue
    } else if (value < 0) {
      return `rgba(239, 68, 68, ${opacity})`; // Red
    }
    return 'rgba(229, 231, 235, 0.7)'; // Light gray
  }

  function toggleFieldSelection(fieldName: string) {
    setSelectedFields(prev => {
      const newSelection = prev.includes(fieldName)
        ? prev.filter(f => f !== fieldName)
        : [...prev, fieldName];
      
      if (onFieldSelectionChange) {
        onFieldSelectionChange(newSelection);
      }
      
      return newSelection;
    });
  }

  function interpretCorrelation(value: number, pValue?: number, hasOutliers?: boolean): { description: string; implication: string } {
    const strength = Math.abs(value);
    const direction = value > 0 ? 'positive' : 'negative';
    const isSignificant = pValue !== undefined && pValue < 0.05;
    
    let description = '';
    let implication = '';
    
    if (strength > 0.8) {
      description = `Very strong ${direction} correlation`;
      implication = direction === 'positive' 
        ? 'These variables tend to increase together' 
        : 'As one variable increases, the other tends to decrease';
    } else if (strength > 0.6) {
      description = `Strong ${direction} correlation`;
      implication = direction === 'positive'
        ? 'There is a clear relationship between these variables'
        : 'There is an inverse relationship between these variables';
    } else if (strength > 0.4) {
      description = `Moderate ${direction} correlation`;
      implication = 'This suggests some relationship, but other factors may be involved';
    } else if (strength > 0.2) {
      description = `Weak ${direction} correlation`;
      implication = 'The relationship is slight and may not be meaningful';
    } else {
      description = 'Very weak or no correlation';
      implication = 'These variables appear to have little to no linear relationship';
    }

    if (pValue !== undefined) {
      description += ` (${isSignificant ? 'statistically significant' : 'not significant'})`;
    }
    
    if (hasOutliers) {
      implication += ' However, this relationship is strongly influenced by outliers.';
    }
    
    return { description, implication };
  }

  function CorrelationCell({ value, field1, field2, isSelected, onClick, pValue, hasOutliers }: CellProps) {
    const [showTooltip, setShowTooltip] = useState(false);
    const { description, implication } = interpretCorrelation(value, pValue, hasOutliers);

    return (
      <td 
        className={`relative px-4 py-2 text-center transition-all group
          ${isSelected ? 'ring-2 ring-yellow-400 ring-opacity-80 z-10' : ''}
          ${value > 0 ? 'hover:bg-blue-600/20' : 'hover:bg-red-600/20'}
        `}
        style={{
          backgroundColor: getCorrelationColor(value || 0),
          color: Math.abs(value) > 0.5 ? 'white' : 'black',
          cursor: 'pointer'
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={onClick}
      >
        {(value || 0).toFixed(2)}
        {pValue !== undefined && (
          <span className="block text-xs">{pValue < 0.05 ? "sig" : "ns"}</span>
        )}
        {hasOutliers && <span className="block text-red-600 text-xs">!</span>}
        {showTooltip && (
          <div className="absolute z-20 w-72 p-3 bg-white rounded-lg shadow-xl border border-gray-200 -translate-x-1/2 left-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="font-medium text-gray-900 mb-1">{field1} ↔ {field2}</p>
            <p className="text-sm font-medium text-gray-700 mb-1">{description}</p>
            <p className="text-xs text-gray-600 mb-1">{implication}</p>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Correlation: {value.toFixed(3)}</span>
              {pValue !== undefined && <span>p-value: {pValue.toFixed(3)}</span>}
            </div>
          </div>
        )}
      </td>
    );
  }

  function renderPairComparison() {
    if (!selectedPair) return null;
    
    const [field1Name, field2Name] = selectedPair;
    const field1 = numericFields.find(f => f.name === field1Name);
    const field2 = numericFields.find(f => f.name === field2Name);
    
    if (!field1 || !field2) return null;
    
    const { r, p, hasOutliers } = correlations[`${field1Name}_${field2Name}`] || { r: 0, p: 1, hasOutliers: false };
    const stats1 = fieldStats[field1Name];
    const stats2 = fieldStats[field2Name];
    const trend1 = trends[field1Name];
    const trend2 = trends[field2Name];
    
    return (
      <div className="mt-6 p-4 rounded-lg bg-white shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold text-gray-900">
            <ArrowLeftRight className="inline mr-2 w-5 h-5 text-indigo-600" />
            {field1Name} vs {field2Name}
          </h4>
          <button 
            onClick={() => setSelectedPair(null)} 
            className="text-gray-500 hover:text-gray-700"
          >
            Close
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Feature Statistics */}
          <div className="space-y-4">
            <h5 className="font-medium text-gray-800">Feature Statistics</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h6 className="font-medium text-gray-900 mb-2">{field1Name}</h6>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mean</span>
                    <span className="font-medium text-black">{formatNumber(stats1.mean)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Median</span>
                    <span className="font-medium text-black">{formatNumber(stats1.median)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Std Dev</span>
                    <span className="font-medium text-black">{formatNumber(stats1.standardDeviation)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trend</span>
                    <span className={`font-medium ${
                      trend1 === 'up' ? 'text-green-600' :
                      trend1 === 'down' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {trend1 === 'up' ? (
                        <span className="flex items-center"><TrendingUp className="w-4 h-4 mr-1" /> Increasing</span>
                      ) : trend1 === 'down' ? (
                        <span className="flex items-center"><TrendingDown className="w-4 h-4 mr-1" /> Decreasing</span>
                      ) : (
                        <span className="flex items-center"><Activity className="w-4 h-4 mr-1" /> Stable</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h6 className="font-medium text-gray-900 mb-2">{field2Name}</h6>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mean</span>
                    <span className="font-medium text-black">{formatNumber(stats2.mean)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Median</span>
                    <span className="font-medium text-black">{formatNumber(stats2.median)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Std Dev</span>
                    <span className="font-medium text-black">{formatNumber(stats2.standardDeviation)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trend</span>
                    <span className={`font-medium text-black ${
                      trend2 === 'up' ? 'text-green-600' :
                      trend2 === 'down' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {trend2 === 'up' ? (
                        <span className="flex items-center"><TrendingUp className="w-4 h-4 mr-1" /> Increasing</span>
                      ) : trend2 === 'down' ? (
                        <span className="flex items-center"><TrendingDown className="w-4 h-4 mr-1" /> Decreasing</span>
                      ) : (
                        <span className="flex items-center"><Activity className="w-4 h-4 mr-1" /> Stable</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Relationship Metrics */}
          <div className="space-y-4">
            <h5 className="font-medium text-gray-800">Relationship Metrics</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Correlation</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatNumber(r)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {interpretCorrelation(r, p).description}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Significance</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {p < 0.05 ? 'Significant' : 'Not Significant'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  p-value: {p.toFixed(4)}
                </p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Data Quality</p>
              <p className="text-xl font-semibold text-gray-900">
                {hasOutliers ? 'Outliers Detected' : 'Clean'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {hasOutliers 
                  ? 'This relationship may be influenced by outliers' 
                  : 'No significant outliers detected'}
              </p>
            </div>
          </div>
        </div>

        {/* Visualizations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="h-64">
            <Line
              data={{
                labels: Array.from({ length: Math.max(field1.value.length, field2.value.length) }, (_, i) => i + 1),
                datasets: [
                  {
                    label: field1Name,
                    data: field1.value,
                    borderColor: 'hsl(220, 70%, 50%)',
                    backgroundColor: 'hsla(220, 70%, 50%, 0.1)',
                    tension: 0.1,
                    fill: true
                  },
                  {
                    label: field2Name,
                    data: field2.value,
                    borderColor: 'hsl(120, 70%, 50%)',
                    backgroundColor: 'hsla(120, 70%, 50%, 0.1)',
                    tension: 0.1,
                    fill: true
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  title: {
                    display: true,
                    text: 'Time Series Comparison'
                  }
                }
              }}
            />
          </div>
          <div className="h-64">
            <Scatter
              data={{
                datasets: [{
                  label: `${field1Name} vs ${field2Name}`,
                  data: field1.value.map((x: any, i: number) => ({ x, y: field2.value[i] })),
                  backgroundColor: 'rgba(99, 102, 241, 0.5)'
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  title: {
                    display: true,
                    text: 'Feature Correlation'
                  }
                },
                scales: {
                  x: {
                    title: {
                      display: true,
                      text: field1Name
                    }
                  },
                  y: {
                    title: {
                      display: true,
                      text: field2Name
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Insights */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-blue-600" />
            <h5 className="font-medium text-blue-800">Key Insights</h5>
          </div>
          <ul className="text-sm text-blue-700 space-y-1 list-disc pl-5">
            {generatePairInsights(field1Name, field2Name, r, p, hasOutliers, trend1, trend2).map((insight, i) => (
              <li key={i}>{insight}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  function generatePairInsights(
    field1: string,
    field2: string,
    r: number,
    p: number,
    hasOutliers: boolean,
    trend1?: 'up' | 'down' | 'stable',
    trend2?: 'up' | 'down' | 'stable'
  ): string[] {
    const insights: string[] = [];
    const absR = Math.abs(r);
    const direction = r > 0 ? 'positive' : 'negative';
    
    // Correlation strength
    if (absR > 0.8) {
      insights.push(`Very strong ${direction} correlation (r = ${r.toFixed(2)})`);
    } else if (absR > 0.6) {
      insights.push(`Strong ${direction} correlation (r = ${r.toFixed(2)})`);
    } else if (absR > 0.4) {
      insights.push(`Moderate ${direction} correlation (r = ${r.toFixed(2)})`);
    } else if (absR > 0.2) {
      insights.push(`Weak ${direction} correlation (r = ${r.toFixed(2)})`);
    } else {
      insights.push('Very weak or no correlation');
    }
    
    // Statistical significance
    insights.push(p < 0.05 
      ? 'Statistically significant relationship (p < 0.05)'
      : 'Not statistically significant (p > 0.05)'
    );
    
    // Outliers
    if (hasOutliers) {
      insights.push('Relationship may be influenced by outliers');
    }
    
    // Trend comparison
    if (trend1 && trend2) {
      if (trend1 === trend2) {
        insights.push(`Both features show ${trend1} trends`);
      } else {
        insights.push(`${field1} shows ${trend1} trend while ${field2} shows ${trend2} trend`);
      }
    }
    
    return insights;
  }

  if (!data?.fields?.length) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-center gap-2 text-gray-500 p-8 bg-gray-50 rounded-lg">
          <Info className="w-5 h-5" />
          <p>No data available for correlation analysis</p>
        </div>
      </div>
    );
  }

  if (numericFields.length < 2) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-center gap-2 text-gray-500 p-8 bg-gray-50 rounded-lg">
          <Info className="w-5 h-5" />
          <p>At least 2 numeric fields are required for correlation analysis</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">Correlation Matrix</h3>
              <button 
                onClick={() => setShowHelp(!showHelp)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Help"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Explore relationships between numeric variables
            </p>
          </div>
          {selectedFields.length > 0 && (
            <div className="text-sm bg-yellow-50 px-3 py-1 rounded-full text-yellow-800">
              {selectedFields.length} field{selectedFields.length !== 1 ? 's' : ''} selected
            </div>
          )}
        </div>

        {showHelp && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h4 className="font-medium text-blue-800 mb-2">How to interpret correlations:</h4>
            <ul className="text-sm text-blue-700 space-y-1 list-disc pl-5">
              <li>Values range from -1 to 1, where 1 is perfect positive correlation, -1 is perfect negative correlation</li>
              <li>Click on cells to select pairs for detailed comparison</li>
              <li>Hover over cells for detailed interpretation</li>
              <li>Strong correlations (|r| &gt; 0.7) may indicate important relationships</li>
              <li>Correlation does not imply causation</li>
              <li>Statistical significance (p &lt; 0.05) indicates reliable relationships</li>
              <li>Outlier warnings (!) suggest the relationship may be driven by extreme values</li>
            </ul>
          </div>
        )}

        {/* Strongest Correlations */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Strongest Correlations:</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {strongestCorrelations.map((corr) => (
              <div 
                key={`${corr.field1}-${corr.field2}`}
                className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                  selectedPair && 
                  ((selectedPair[0] === corr.field1 && selectedPair[1] === corr.field2) ||
                  (selectedPair[0] === corr.field2 && selectedPair[1] === corr.field1))
                    ? 'ring-2 ring-indigo-500'
                    : ''
                }`}
                style={{
                  backgroundColor: getCorrelationColor(corr.value),
                  color: Math.abs(corr.value) > 0.5 ? 'white' : 'black'
                }}
                onClick={() => setSelectedPair([corr.field1, corr.field2])}
              >
                <p className="font-medium text-sm">
                  {corr.field1} ↔ {corr.field2}
                </p>
                <p className="text-sm">
                  r = {corr.value.toFixed(2)}
                </p>
                <p className="text-xs">
                  {corr.pValue < 0.05 ? 'Significant' : 'Not significant'}
                </p>
                {corr.hasOutliers && (
                  <p className="text-xs">Contains outliers</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Correlation Matrix */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead>
              <tr>
                <th className="px-4 py-2 bg-gray-100"></th>
                {numericFields.map(field => (
                  <th 
                    key={field.name} 
                    className={`px-4 py-2 bg-gray-100 font-medium text-gray-700 cursor-pointer transition-colors
                      ${selectedFields.includes(field.name) ? 'bg-yellow-100' : ''}
                    `}
                    onClick={() => toggleFieldSelection(field.name)}
                  >
                    <div className="transform -rotate-45 origin-left translate-y-6 whitespace-nowrap transition-transform hover:scale-110">
                      {field.name}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {numericFields.map((field1) => (
                <tr key={field1.name}>
                  <th 
                    className={`px-4 py-2 bg-gray-100 font-medium text-gray-700 text-left cursor-pointer transition-colors
                      ${selectedFields.includes(field1.name) ? 'bg-yellow-100' : ''}
                    `}
                    onClick={() => toggleFieldSelection(field1.name)}
                  >
                    {field1.name}
                  </th>
                  {numericFields.map((field2) => {
                    const key = `${field1.name}_${field2.name}`;
                    const { r, p, hasOutliers } = correlations[key] || { r: 0, p: 1, hasOutliers: false };
                    const isSelected = selectedFields.includes(field1.name) && selectedFields.includes(field2.name);
                    
                    return (
                      <CorrelationCell 
                        key={key}
                        value={r}
                        field1={field1.name}
                        field2={field2.name}
                        isSelected={isSelected}
                        onClick={() => {
                          if (field1.name !== field2.name) {
                            setSelectedPair([field1.name, field2.name]);
                          }
                        }}
                        pValue={p}
                        hasOutliers={hasOutliers}
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pair Comparison */}
      {selectedPair && renderPairComparison()}

      {/* Legend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h4 className="font-medium text-gray-800 mb-3">Color Legend</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-blue-600" />
              <div className="text-sm">
                <p className="font-medium text-black">Positive Correlation</p>
                <p className="text-xs text-gray-600">Darker = stronger positive relationship</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-gray-300" />
              <div className="text-sm">
                <p className="font-medium text-black">No Correlation</p>
                <p className="text-xs text-gray-600">Values near zero indicate no linear relationship</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-red-600" />
              <div className="text-sm">
                <p className="font-medium text-black">Negative Correlation</p>
                <p className="text-xs text-gray-600">Darker = stronger negative relationship</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h4 className="font-medium text-gray-800 mb-3">Interpretation Guide</h4>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-black">|r| ≥ 0.8</p>
              <p className="text-xs text-gray-600">Very strong relationship</p>
            </div>
            <div>
              <p className="text-sm font-medium text-black">0.6 ≤ |r| &lt; 0.8</p>
              <p className="text-xs text-gray-600">Strong relationship</p>
            </div>
            <div>
              <p className="text-sm font-medium text-black">0.4 ≤ |r| &lt; 0.6</p>
              <p className="text-xs text-gray-600">Moderate relationship</p>
            </div>
            <div>
              <p className="text-sm font-medium text-black">|r| &lt; 0.4</p>
              <p className="text-xs text-gray-600">Weak or no relationship</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}