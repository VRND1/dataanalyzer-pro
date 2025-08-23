import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DataField {
  name: string;
  type: string;
  value: number[] | string[] | any[];
}

interface AttributionProps {
  data: {
    fields: DataField[];
  };
}

// Enhanced statistical functions
const calculateMean = (values: number[]): number => {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
};

const calculateVariance = (values: number[]): number => {
  if (values.length < 2) return 0;
  const mean = calculateMean(values);
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / (values.length - 1);
};

const calculateStandardDeviation = (values: number[]): number => {
  return Math.sqrt(calculateVariance(values));
};

const calculateCoefficientOfVariation = (values: number[]): number => {
  if (values.length === 0) return 0;
  const mean = calculateMean(values);
  if (Math.abs(mean) < 1e-10) return 0; // Handle near-zero means
  const stdDev = calculateStandardDeviation(values);
  return stdDev / Math.abs(mean);
};

// Calculate correlation coefficient
const calculateCorrelation = (x: number[], y: number[]): number => {
  if (x.length !== y.length || x.length < 2) return 0;
  
  const meanX = calculateMean(x);
  const meanY = calculateMean(y);
  
  let numerator = 0;
  let sumSqX = 0;
  let sumSqY = 0;
  
  for (let i = 0; i < x.length; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    numerator += diffX * diffY;
    sumSqX += diffX * diffX;
    sumSqY += diffY * diffY;
  }
  
  const denominator = Math.sqrt(sumSqX * sumSqY);
  return denominator === 0 ? 0 : numerator / denominator;
};

// Calculate information gain (entropy-based measure)
const calculateInformationGain = (values: number[]): number => {
  if (values.length === 0) return 0;
  
  // Discretize continuous values into bins for entropy calculation
  const numBins = Math.min(10, Math.max(3, Math.floor(Math.sqrt(values.length))));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const binWidth = (max - min) / numBins;
  
  if (binWidth === 0) return 0;
  
  const bins = new Array(numBins).fill(0);
  values.forEach(val => {
    const binIndex = Math.min(numBins - 1, Math.floor((val - min) / binWidth));
    bins[binIndex]++;
  });
  
  // Calculate entropy
  let entropy = 0;
  const total = values.length;
  bins.forEach(count => {
    if (count > 0) {
      const probability = count / total;
      entropy -= probability * Math.log2(probability);
    }
  });
  
  return entropy;
};

// Calculate feature importance using multiple methods
const calculateFeatureImportance = (field: DataField, allFields: DataField[]): number => {
  const values = field.value as number[];
  const numericFields = allFields.filter(f => f.type === 'number' && f.value && f.value.length > 0);
  
  if (numericFields.length <= 1) return 1;
  
  // 1. Variance-based importance
  const variance = calculateVariance(values);
  const maxVariance = Math.max(...numericFields.map(f => calculateVariance(f.value as number[])));
  const varianceScore = maxVariance > 0 ? variance / maxVariance : 0;
  
  // 2. Correlation-based importance (average absolute correlation with other features)
  let totalCorrelation = 0;
  let correlationCount = 0;
  
  numericFields.forEach(otherField => {
    if (otherField.name !== field.name) {
      const correlation = Math.abs(calculateCorrelation(values, otherField.value as number[]));
      totalCorrelation += correlation;
      correlationCount++;
    }
  });
  
  const avgCorrelation = correlationCount > 0 ? totalCorrelation / correlationCount : 0;
  
  // 3. Information gain
  const infoGain = calculateInformationGain(values);
  const maxInfoGain = Math.max(...numericFields.map(f => calculateInformationGain(f.value as number[])));
  const infoGainScore = maxInfoGain > 0 ? infoGain / maxInfoGain : 0;
  
  // 4. Range-based importance (normalized)
  const range = Math.max(...values) - Math.min(...values);
  const maxRange = Math.max(...numericFields.map(f => {
    const vals = f.value as number[];
    return Math.max(...vals) - Math.min(...vals);
  }));
  const rangeScore = maxRange > 0 ? range / maxRange : 0;
  
  // Weighted combination of all importance measures
  return (
    varianceScore * 0.3 +        // 30% weight to variance
    avgCorrelation * 0.25 +      // 25% weight to correlation
    infoGainScore * 0.25 +       // 25% weight to information gain
    rangeScore * 0.2             // 20% weight to range
  );
};

// Calculate Shapley-like attribution values
const calculateShapleyAttribution = (fields: DataField[]): number[] => {
  const numericFields = fields.filter(f => f.type === 'number' && f.value && f.value.length > 0);
  
  if (numericFields.length === 0) return [];
  
  const attributions = numericFields.map(field => {
    const importance = calculateFeatureImportance(field, numericFields);
    return importance;
  });
  
  // Normalize to sum to 100%
  const total = attributions.reduce((sum, attr) => sum + attr, 0);
  return total > 0 ? attributions.map(attr => (attr / total) * 100) : attributions;
};

// Enhanced attribution metrics calculation
const calculateAttributionMetrics = (fields: DataField[]) => {
  const numericFields = fields.filter(field => field.type === 'number' && field.value && field.value.length > 0);
  
  if (numericFields.length === 0) {
    return [];
  }

  const shapleyAttributions = calculateShapleyAttribution(numericFields);

  return numericFields.map((field, index) => {
    const values = field.value as number[];
    
    // Basic statistics
    const mean = calculateMean(values);
    const variance = calculateVariance(values);
    const stdDev = calculateStandardDeviation(values);
    const coefficientOfVariation = calculateCoefficientOfVariation(values);
    const range = Math.max(...values) - Math.min(...values);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Advanced metrics
    const infoGain = calculateInformationGain(values);
    const importance = calculateFeatureImportance(field, numericFields);
    const attribution = shapleyAttributions[index] || 0;
    
    // Calculate skewness
    const skewness = values.length > 2 && stdDev > 0 ? 
      values.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 3), 0) / values.length : 0;
    
    // Calculate kurtosis
    const kurtosis = values.length > 3 && stdDev > 0 ? 
      (values.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 4), 0) / values.length) - 3 : 0;
    
    // Calculate correlation with other fields
    let totalCorrelation = 0;
    let correlationCount = 0;
    let maxCorrelation = 0;
    
    numericFields.forEach(otherField => {
      if (otherField.name !== field.name) {
        const correlation = calculateCorrelation(values, otherField.value as number[]);
        const absCorrelation = Math.abs(correlation);
        totalCorrelation += absCorrelation;
        maxCorrelation = Math.max(maxCorrelation, absCorrelation);
        correlationCount++;
      }
    });
    
    const avgCorrelation = correlationCount > 0 ? totalCorrelation / correlationCount : 0;
    
    return {
      name: field.name,
      attribution: Math.max(0, attribution),
      importance: Math.max(0, importance * 100), // Scale to 0-100
      variance: variance,
      standardDeviation: stdDev,
      coefficientOfVariation: coefficientOfVariation,
      mean: mean,
      range: range,
      min: min,
      max: max,
      avgCorrelation: avgCorrelation,
      maxCorrelation: maxCorrelation,
      informationGain: infoGain,
      skewness: skewness,
      kurtosis: kurtosis,
      sampleSize: values.length
    };
  });
};

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#ffb347', '#87ceeb'];

// Simple Card component
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
    {children}
  </div>
);

// Simple Table components
const Table = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`w-full overflow-auto ${className}`}>
    <table className="w-full border-collapse border border-gray-300">
      {children}
    </table>
  </div>
);

const TableHeader = ({ children }: { children: React.ReactNode }) => (
  <thead className="bg-gray-50">{children}</thead>
);

const TableBody = ({ children }: { children: React.ReactNode }) => (
  <tbody>{children}</tbody>
);

const TableRow = ({ children }: { children: React.ReactNode }) => (
  <tr className="border-b border-gray-200 hover:bg-gray-50">{children}</tr>
);

const TableHead = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <th className={`px-4 py-2 text-left font-medium text-gray-700 border-b border-gray-300 ${className}`}>
    {children}
  </th>
);

const TableCell = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <td className={`px-4 py-2 border-b border-gray-200 ${className}`}>
    {children}
  </td>
);

export default function Attribution({ data }: AttributionProps) {
  const fieldCount = data.fields.length;
  const metrics = calculateAttributionMetrics(data.fields);
  
  // Sort by attribution for display
  const sortedByAttribution = [...metrics].sort((a, b) => b.attribution - a.attribution);
  const sortedByImportance = [...metrics].sort((a, b) => b.importance - a.importance);
  
  // Prepare pie chart data
  const pieData = sortedByAttribution.slice(0, 8).map((metric, index) => ({
    name: metric.name,
    value: metric.attribution,
    color: COLORS[index % COLORS.length]
  }));
  
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-black mb-4">Enhanced Attribution Analysis</h3>
      
      {fieldCount > 0 && metrics.length > 0 ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-black">
            <Card className="p-4">
              <h4 className="text-sm font-medium text-gray-500">Top Contributors</h4>
              <p className="text-sm font-bold text-black mt-2">
                {sortedByAttribution.slice(0, 2).map(m => m.name).join(', ')}
              </p>
            </Card>
            <Card className="p-4">
              <h4 className="text-sm font-medium text-gray-500">Highest Attribution</h4>
              <p className="text-xl font-bold text-black mt-2">
                {Math.round(Math.max(...metrics.map(m => m.attribution)))}%
              </p>
            </Card>
            <Card className="p-4">
              <h4 className="text-sm font-medium text-gray-500">Avg. Correlation</h4>
              <p className="text-xl font-bold text-black mt-2">
                {(metrics.reduce((sum, m) => sum + m.avgCorrelation, 0) / metrics.length).toFixed(2)}
              </p>
            </Card>
            <Card className="p-4">
              <h4 className="text-sm font-medium text-gray-500">Features Analyzed</h4>
              <p className="text-xl font-bold text-black mt-2">
                {metrics.length}
              </p>
            </Card>
          </div>
          
          {/* Visualization Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attribution Bar Chart */}
            <div className="h-80">
              <h4 className="text-md font-medium text-black mb-2">Feature Attribution</h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sortedByAttribution.slice(0, 6)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [`${Number(value).toFixed(2)}${String(name).includes('Attribution') ? '%' : ''}`, name]} />
                  <Legend />
                  <Bar dataKey="attribution" fill="#8884d8" name="Attribution (%)" />
                  <Bar dataKey="importance" fill="#82ca9d" name="Importance Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Attribution Pie Chart */}
            <div className="h-80">
              <h4 className="text-md font-medium text-black mb-2">Attribution Distribution</h4>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}%`, 'Attribution']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Detailed Statistics Table */}
          <div>
            <h4 className="text-md font-medium text-black mb-2">Comprehensive Attribution Metrics</h4>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field</TableHead>
                    <TableHead className="text-right">Attribution</TableHead>
                    <TableHead className="text-right">Importance</TableHead>
                    <TableHead className="text-right">Mean</TableHead>
                    <TableHead className="text-right">Std Dev</TableHead>
                    <TableHead className="text-right">CV</TableHead>
                    <TableHead className="text-right">Avg Corr</TableHead>
                    <TableHead className="text-right">Info Gain</TableHead>
                    <TableHead className="text-right">Skewness</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedByAttribution.map((metric) => (
                    <TableRow key={metric.name}>
                      <TableCell className="font-medium text-black">{metric.name}</TableCell>
                      <TableCell className="text-right text-black font-semibold">{metric.attribution.toFixed(1)}%</TableCell>
                      <TableCell className="text-right text-black">{metric.importance.toFixed(1)}</TableCell>
                      <TableCell className="text-right text-black">{metric.mean.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-black">{metric.standardDeviation.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-black">{metric.coefficientOfVariation.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-black">{metric.avgCorrelation.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-black">{metric.informationGain.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-black">{metric.skewness.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          
          {/* Insights Section */}
          <Card className="p-4 bg-blue-50">
            <h4 className="text-md font-medium text-black mb-2">Key Insights</h4>
            <div className="space-y-2 text-sm text-gray-700">
              <p>• <strong>Primary Driver:</strong> {sortedByAttribution[0]?.name} contributes {sortedByAttribution[0]?.attribution.toFixed(1)}% to the total variation</p>
              <p>• <strong>Most Variable:</strong> {sortedByImportance[0]?.name} shows the highest importance score ({sortedByImportance[0]?.importance.toFixed(1)})</p>
              <p>• <strong>Correlation Pattern:</strong> Average inter-feature correlation is {(metrics.reduce((sum, m) => sum + m.avgCorrelation, 0) / metrics.length).toFixed(2)}</p>
              {metrics.some(m => Math.abs(m.skewness) > 1) && (
                <p>• <strong>Distribution Alert:</strong> Some features show significant skewness, consider transformation</p>
              )}
            </div>
          </Card>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-2">
            {fieldCount === 0 
              ? "No data fields available for attribution analysis." 
              : "No numeric fields available for attribution analysis."
            }
          </p>
          <p className="text-sm text-gray-500">
            Please ensure your dataset contains numeric columns for comprehensive analysis.
          </p>
        </div>
      )}
      
      <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
        <p><strong>Methodology:</strong> Attribution calculated using Shapley-inspired values combining variance, correlation, information gain, and range measures. 
        Importance scores reflect multi-dimensional feature significance including statistical distribution properties.</p>
      </div>
    </Card>
  );
} 