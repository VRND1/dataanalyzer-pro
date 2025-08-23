import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState, useEffect, useMemo } from 'react';
import type { DataField } from '@/types/data';

interface DemandForecastingProps {
  data: {
    fields: DataField[];
  };
}

// Improved forecast generator that uses actual data patterns
const generateForecastData = (actualData: any[], periods: number, model: string) => {
  if (!actualData || actualData.length === 0) return [];
  
  // Filter out entries without dates or values
  const validData = actualData.filter(item => item.date && item.value !== undefined);
  if (validData.length === 0) return [];
  
  const forecastData = [...validData];
  const lastValue = validData[validData.length - 1].value;
  const avgValue = validData.reduce((sum, point) => sum + point.value, 0) / validData.length;
  const trend = validData.length > 1 ? 
    (validData[validData.length - 1].value - validData[0].value) / validData.length : 0;
  
  const today = new Date(validData[validData.length - 1].date);
  
  // Different forecasting models simulation
  const getForecastValue = (i: number) => {
    switch(model) {
      case 'prophet':
        // Simulate Prophet's seasonality + trend
        return lastValue + trend * (i + 1) + Math.sin(i / 2) * (avgValue * 0.1);
      case 'arima':
        // Simulate ARIMA's autoregressive nature
        return lastValue * 0.9 + avgValue * 0.1 + trend * i;
      case 'lstm':
        // Simulate neural network pattern recognition
        return avgValue + (Math.random() - 0.5) * avgValue * 0.2;
      case 'ensemble':
        // Combine multiple models
        return (lastValue + avgValue + trend * i) / 2;
      default:
        return lastValue;
    }
  };
  
  for (let i = 0; i < periods; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i + 1);
    
    if (isNaN(date.getTime())) {
      // Skip this forecast point or handle the error
      continue;
    }
    
    forecastData.push({
      date: date.toISOString().split('T')[0],
      value: Math.max(0, Math.round(getForecastValue(i))),
      isForecast: true,
    });
  }
  
  return forecastData;
};

export function DemandForecasting({ data }: DemandForecastingProps) {
  const [forecastPeriod, setForecastPeriod] = useState<number>(7);
  const [selectedModel, setSelectedModel] = useState<string>('prophet');
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [forecastData, setForecastData] = useState<any[]>([]);

  // Normalize the incoming data
  const normalizedData = useMemo(() => {
    if (!data?.fields) return [];
    
    // Convert DataField format to array of records
    const records: any[] = [];
    const dateField = data?.fields?.find(f => f.type === 'date');
    const numericFields = data?.fields?.filter(f => f.type === 'number') || [];
    
    if (!dateField || numericFields.length === 0) return [];
    
    // Get the length of the first field's values array
    const length = dateField.value?.length || 0;
    if (length === 0) return [];
    
    // Create records combining date and numeric values
    for (let i = 0; i < length; i++) {
      // Ensure date is a valid ISO string
      let dateValue = dateField.value[i];
      if (typeof dateValue === 'number') {
        dateValue = new Date(dateValue).toISOString().split('T')[0];
      } else if (typeof dateValue === 'string' && !dateValue.includes('-')) {
        // Try to parse as date string if not already ISO
        const parsed = new Date(dateValue);
        if (!isNaN(parsed.getTime())) {
          dateValue = parsed.toISOString().split('T')[0];
        }
      }
      const record: any = {
        date: dateValue
      };
      numericFields.forEach(field => {
        if (field.value && field.value[i] !== undefined) {
          record[field.name] = field.value[i];
        }
      });
      if (!isNaN(new Date(dateValue).getTime())) {
        records.push(record);
      }
    }
    return records;
  }, [data]);

  // Get all numeric columns from data
  const numericColumns = useMemo(() => {
    if (!data?.fields) return [];
    
    return data?.fields
      ?.filter(field => field.type === 'number')
      .map(field => field.name) || [];
  }, [data]);

  // Set default column if none selected
  useEffect(() => {
    if (numericColumns.length > 0 && !selectedColumn) {
      setSelectedColumn(numericColumns[0]);
    }
  }, [numericColumns, selectedColumn]);

  // Prepare actual data from selected column
  const actualData = useMemo(() => {
    if (!normalizedData || !selectedColumn) return [];
    return normalizedData
      .filter(record => record && record.date && !isNaN(Number(record[selectedColumn])))
      .map(record => ({
        date: record.date,
        value: Number(record[selectedColumn]),
        isForecast: false
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [normalizedData, selectedColumn]);

  // Generate forecast when dependencies change
  useEffect(() => {
    if (actualData.length > 0) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setForecastData(generateForecastData(actualData, forecastPeriod, selectedModel));
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [actualData, forecastPeriod, selectedModel]);
  
  const handleGenerateForecast = () => {
    if (actualData.length === 0) return;
    setIsLoading(true);
    setTimeout(() => {
      setForecastData(generateForecastData(actualData, forecastPeriod, selectedModel));
      setIsLoading(false);
    }, 1000);
  };
  
  // Calculate more sophisticated metrics - FIXED LOGIC
  const calculateMetrics = () => {
    if (actualData.length < 2 || forecastData.length === 0) return null;
    
    // For forecasting, we can't calculate accuracy metrics since we don't have future actual values
    // Instead, we'll calculate metrics based on the historical data patterns
    const historicalValues = actualData.map(point => point.value);
    const mean = historicalValues.reduce((sum, val) => sum + val, 0) / historicalValues.length;
    const variance = historicalValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historicalValues.length;
    const stdDev = Math.sqrt(variance);
    
    // Calculate trend strength
    const trendStrength = actualData.length > 1 ? 
      Math.abs(actualData[actualData.length - 1].value - actualData[0].value) / mean * 100 : 0;
    
    // Calculate volatility
    const volatility = (stdDev / mean) * 100;
    
    return {
      mean: mean.toFixed(2),
      stdDev: stdDev.toFixed(2),
      trendStrength: trendStrength.toFixed(2),
      volatility: volatility.toFixed(2),
    };
  };
  
  const metrics = calculateMetrics();
  
  // Prepare chart data combining actual and forecast
  const chartData = forecastData.map(point => ({
    date: point.date,
    actual: !point.isForecast ? point.value : null,
    forecast: point.isForecast ? point.value : null,
    value: point.value
  }));
  
  return (
    <Card className="p-6 text-black">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h3 className="text-lg font-semibold">Demand Forecasting</h3>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
          {/* Column Selector */}
          <Select value={selectedColumn} onValueChange={setSelectedColumn}>
            <SelectTrigger className="w-[180px] text-black bg-gray-400/10">
              <SelectValue placeholder="Select column" className="text-black" />
            </SelectTrigger>
            <SelectContent className="text-black">
              {numericColumns.map(column => (
                <SelectItem key={column} value={column} className="text-black">{column}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Model Selector */}
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-[180px] text-black bg-gray-100">
              <SelectValue placeholder="Select model" className="text-black" />
            </SelectTrigger>
            <SelectContent className="text-black">
              <SelectItem value="prophet" className="text-black">Prophet</SelectItem>
              <SelectItem value="arima" className="text-black">ARIMA</SelectItem>
              <SelectItem value="lstm" className="text-black">LSTM</SelectItem>
              <SelectItem value="ensemble" className="text-black">Ensemble</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center gap-2 text-black">
            <Label htmlFor="period">Forecast Period:</Label>
            <Input
              id="period"
              type="number"
              value={forecastPeriod}
              onChange={(e) => setForecastPeriod(Math.min(365, Math.max(1, Number(e.target.value))))}
              className="w-20"
              min="1"
              max="365"
            />
          </div>
          
          <Button 
            onClick={handleGenerateForecast} 
            disabled={isLoading || !selectedColumn || actualData.length === 0}
          >
            {isLoading ? 'Generating...' : 'Generate Forecast'}
          </Button>
        </div>
      </div>
      
      {actualData.length > 0 ? (
        <div className="space-y-6">
          {/* Main Chart */}
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }} 
                  name="Actual Demand"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="forecast" 
                  stroke="#82ca9d" 
                  name="Forecasted Demand"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Metrics */}
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <h4 className="text-sm font-medium text-black">Mean Value</h4>
                <p className="text-2xl font-bold mt-2 text-black">{metrics.mean}</p>
              </Card>
              <Card className="p-4">
                <h4 className="text-sm font-medium text-black">Standard Deviation</h4>
                <p className="text-2xl font-bold mt-2 text-black">{metrics.stdDev}</p>
              </Card>
              <Card className="p-4">
                <h4 className="text-sm font-medium text-black">Trend Strength</h4>
                <p className="text-2xl font-bold mt-2 text-black">{metrics.trendStrength}%</p>
              </Card>
              <Card className="p-4">
                <h4 className="text-sm font-medium text-black">Volatility</h4>
                <p className="text-2xl font-bold mt-2 text-black">{metrics.volatility}%</p>
              </Card>
            </div>
          )}
          
          {/* Data Table */}
          <div>
            <h4 className="text-md font-medium text-black mb-2">Forecast Details</h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-black uppercase">Actual</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-black uppercase">Forecast</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-black uppercase">Variance</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {forecastData.map((row, index) => (
                    <tr key={index} className={row.isForecast ? 'bg-blue-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {new Date(row.date).toLocaleDateString()}
                        {row.isForecast && <span className="ml-2 text-xs text-blue-600">(forecast)</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black text-right">
                        {!row.isForecast ? row.value : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black text-right">
                        {row.value}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        {!row.isForecast && index > 0 ? (
                          <span className={`${forecastData[index-1].value <= row.value ? 'text-green-600' : 'text-red-600'}`}>
                            {Math.round(((row.value - forecastData[index-1].value) / forecastData[index-1].value * 100))}%
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-black mb-4">
            {numericColumns.length > 0 
              ? "Please select a data column to forecast" 
              : "No numeric data columns found in uploaded file"}
          </p>
          {numericColumns.length === 0 && (
            <p className="text-sm text-black">
              Ensure your CSV contains at least one numeric column.
            </p>
          )}
        </div>
      )}
      
      <div className="mt-4 text-sm text-black">
        <p>Analyzing {actualData.length} historical data points.</p>
        {selectedModel && <p>Using {selectedModel.toUpperCase()} forecasting model.</p>}
        {selectedColumn && <p>Forecasting column: {selectedColumn}</p>}
      </div>
    </Card>
  );
} 