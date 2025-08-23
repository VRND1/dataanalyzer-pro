import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Target, 
  AlertTriangle, 
  CheckCircle,
  BarChart3,
  Download,
  Share2,
  Eye,
  EyeOff
} from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import type { DataField } from '@/types/data';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface FunnelStage {
  name: string;
  value: number;
  conversionRate: number;
  dropoffRate: number;
  color: string;
  insights: string[];
}

interface FunnelAnalysisProps {
  data?: {
    fields: DataField[];
  };
}

interface FunnelMetrics {
  totalStages: number;
  overallConversionRate: number;
  totalDropoff: number;
  bestPerformingStage: string;
  worstPerformingStage: string;
  recommendations: string[];
}

export function FunnelAnalysis({ data }: FunnelAnalysisProps) {
  const [showInsights, setShowInsights] = useState(true);
  const [chartType, setChartType] = useState<'funnel' | 'conversion' | 'dropoff'>('funnel');
  const [timeRange, setTimeRange] = useState<'all' | 'month' | 'week'>('all');

  // Generate funnel data from numeric fields
  const funnelData = useMemo(() => {
    if (!data?.fields) return null;

    const numericFields = data.fields.filter(field => field.type === 'number');
    if (numericFields.length < 2) return null;

    // Sort fields by their average values to create a funnel effect
    const sortedFields = numericFields
      .map(field => {
        const values = field.value as number[];
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
        return { ...field, average: avg };
      })
      .sort((a, b) => b.average - a.average);

    // Create funnel stages
    const stages: FunnelStage[] = sortedFields.map((field, index) => {
      const currentValue = field.average;
      const previousValue = index > 0 ? sortedFields[index - 1].average : currentValue;
      const conversionRate = previousValue > 0 ? (currentValue / previousValue) * 100 : 100;
      const dropoffRate = 100 - conversionRate;

      // Generate insights based on conversion rate
      const insights: string[] = [];
      if (conversionRate < 50) {
        insights.push('Significant dropoff detected - consider optimizing this stage');
      } else if (conversionRate < 80) {
        insights.push('Moderate dropoff - review user experience');
      } else {
        insights.push('Good conversion rate - maintain current approach');
      }

      if (dropoffRate > 30) {
        insights.push('High dropoff rate - investigate user friction points');
      }

      return {
        name: field.name,
        value: currentValue,
        conversionRate,
        dropoffRate,
        color: `hsl(${240 - index * 30}, 70%, 50%)`,
        insights
      };
    });

    return stages;
  }, [data?.fields]);

  // Calculate funnel metrics
  const funnelMetrics = useMemo((): FunnelMetrics | null => {
    if (!funnelData) return null;

    const totalStages = funnelData.length;
    const overallConversionRate = funnelData.length > 1 
      ? (funnelData[funnelData.length - 1].value / funnelData[0].value) * 100 
      : 100;
    const totalDropoff = 100 - overallConversionRate;

    const bestPerformingStage = funnelData.reduce((best, current) => 
      current.conversionRate > best.conversionRate ? current : best
    ).name;

    const worstPerformingStage = funnelData.reduce((worst, current) => 
      current.conversionRate < worst.conversionRate ? current : worst
    ).name;

    const recommendations: string[] = [];
    if (overallConversionRate < 20) {
      recommendations.push('Overall conversion rate is very low - consider major UX improvements');
    }
    if (totalDropoff > 80) {
      recommendations.push('High total dropoff - focus on reducing friction across all stages');
    }
    if (funnelData.some(stage => stage.dropoffRate > 50)) {
      recommendations.push('Critical dropoff points detected - prioritize optimization of problematic stages');
    }

    return {
      totalStages,
      overallConversionRate,
      totalDropoff,
      bestPerformingStage,
      worstPerformingStage,
      recommendations
    };
  }, [funnelData]);

  // Chart data for funnel visualization
  const chartData = useMemo(() => {
    if (!funnelData) return null;

    switch (chartType) {
      case 'funnel':
        return {
          labels: funnelData.map(stage => stage.name),
          datasets: [{
            label: 'Funnel Values',
            data: funnelData.map(stage => stage.value),
            backgroundColor: funnelData.map(stage => stage.color),
            borderColor: funnelData.map(stage => stage.color),
            borderWidth: 2
          }]
        };

      case 'conversion':
        return {
          labels: funnelData.map(stage => stage.name),
          datasets: [{
            label: 'Conversion Rate (%)',
            data: funnelData.map(stage => stage.conversionRate),
            backgroundColor: 'rgba(34, 197, 94, 0.6)',
            borderColor: 'rgb(34, 197, 94)',
            borderWidth: 2,
            tension: 0.4
          }]
        };

      case 'dropoff':
        return {
          labels: funnelData.map(stage => stage.name),
          datasets: [{
            label: 'Dropoff Rate (%)',
            data: funnelData.map(stage => stage.dropoffRate),
            backgroundColor: 'rgba(239, 68, 68, 0.6)',
            borderColor: 'rgb(239, 68, 68)',
            borderWidth: 2,
            tension: 0.4
          }]
        };

      default:
        return null;
    }
  }, [funnelData, chartType]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: chartType === 'funnel' ? 'Funnel Analysis' : 
              chartType === 'conversion' ? 'Conversion Rates' : 'Dropoff Rates'
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      }
    },
    scales: chartType !== 'funnel' ? {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(tickValue: string | number) {
            return `${tickValue}%`;
          }
        }
      }
    } : undefined
  };

  if (!data?.fields) {
    return (
      <Card className="p-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Funnel Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Data Available
            </h3>
            <p className="text-gray-600">
              Upload data with numeric fields to perform funnel analysis.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!funnelData || !funnelMetrics) {
    return (
      <Card className="p-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Funnel Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Insufficient Data for Funnel Analysis
            </h3>
            <p className="text-gray-600">
              At least 2 numeric fields are required to create a funnel analysis.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              Funnel Analysis
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInsights(!showInsights)}
              >
                {showInsights ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showInsights ? 'Hide' : 'Show'} Insights
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Total Stages</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{funnelMetrics.totalStages}</p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">Overall Conversion</span>
              </div>
              <p className="text-2xl font-bold text-green-900">
                {funnelMetrics.overallConversionRate.toFixed(1)}%
              </p>
            </div>

            <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium text-red-800">Total Dropoff</span>
              </div>
              <p className="text-2xl font-bold text-red-900">
                {funnelMetrics.totalDropoff.toFixed(1)}%
              </p>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">Best Stage</span>
              </div>
              <p className="text-sm font-semibold text-purple-900 truncate">
                {funnelMetrics.bestPerformingStage}
              </p>
            </div>
          </div>

          {/* Chart Controls */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Chart Type:</span>
              <div className="flex border rounded-lg">
                {(['funnel', 'conversion', 'dropoff'] as const).map((type) => (
                  <Button
                    key={type}
                    variant={chartType === type ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setChartType(type)}
                    className="rounded-none first:rounded-l-lg last:rounded-r-lg"
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Time Range:</span>
              <div className="flex border rounded-lg">
                {(['all', 'month', 'week'] as const).map((range) => (
                  <Button
                    key={range}
                    variant={timeRange === range ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setTimeRange(range)}
                    className="rounded-none first:rounded-l-lg last:rounded-r-lg"
                  >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white p-6 rounded-lg border">
            <div className="h-80">
              {chartData && (
                <Bar data={chartData} options={chartOptions} />
              )}
            </div>
          </div>

          {/* Funnel Stages */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Funnel Stages</h3>
            <div className="space-y-4">
              {funnelData.map((stage, index) => (
                <div key={stage.name} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      <h4 className="font-medium">{stage.name}</h4>
                      <Badge variant="secondary">
                        Stage {index + 1}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{stage.value.toFixed(0)}</p>
                      <p className="text-sm text-gray-600">
                        {stage.conversionRate.toFixed(1)}% conversion
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Conversion Rate:</span>
                      <Progress 
                        value={stage.conversionRate} 
                        className="flex-1"
                        style={{
                          '--progress-color': stage.conversionRate > 80 ? '#22c55e' : 
                                             stage.conversionRate > 50 ? '#f59e0b' : '#ef4444'
                        } as React.CSSProperties}
                      />
                      <span className="text-sm font-medium">{stage.conversionRate.toFixed(1)}%</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Dropoff Rate:</span>
                      <Progress 
                        value={stage.dropoffRate} 
                        className="flex-1"
                        style={{
                          '--progress-color': stage.dropoffRate < 20 ? '#22c55e' : 
                                             stage.dropoffRate < 50 ? '#f59e0b' : '#ef4444'
                        } as React.CSSProperties}
                      />
                      <span className="text-sm font-medium">{stage.dropoffRate.toFixed(1)}%</span>
                    </div>
                  </div>

                  {showInsights && stage.insights.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Insights:</h5>
                      <ul className="space-y-1">
                        {stage.insights.map((insight, insightIndex) => (
                          <li key={insightIndex} className="text-sm text-gray-600 flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          {showInsights && funnelMetrics.recommendations.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                Recommendations
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <ul className="space-y-2">
                  {funnelMetrics.recommendations.map((recommendation, index) => (
                    <li key={index} className="text-sm text-blue-800 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      {recommendation}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 