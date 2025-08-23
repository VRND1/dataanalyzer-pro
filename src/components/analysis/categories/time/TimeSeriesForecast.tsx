import React, { useState } from 'react';
import { 
  runForecastFromCsv, 
   
  getTimeFields, 
  getNumericFields,
  type SeriesMode 
} from '../../../../utils/analysis/timeSeries';
import type { ForecastResult } from '../../../../utils/analysis/timeSeries/forecastAnyCsv';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Alert, AlertDescription } from '../../../../components/ui/alert';
import { Loader2, TrendingUp } from 'lucide-react';

interface TimeSeriesForecastProps {
  file?: File;
  onResult?: (result: ForecastResult) => void;
}

export function TimeSeriesForecast({ file, onResult }: TimeSeriesForecastProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ForecastResult | null>(null);
  const [csvData, setCsvData] = useState<Record<string, any>[]>([]);
  
  // Forecast options
  const [field, setField] = useState('sales');
  const [mode, setMode] = useState<SeriesMode>('row');
  const [horizon, setHorizon] = useState(5);
  const [useGrid] = useState(true);
  const [timeKey, setTimeKey] = useState<string>('');

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      
      const text = await file.text();
      const parsed = JSON.parse(JSON.stringify(
        // @ts-ignore - Papa.parse types
        (await import('papaparse')).default.parse(text, { header: true }).data
      )) as Record<string, any>[];
      
      setCsvData(parsed);
      
      // Auto-detect fields
      const timeFields = getTimeFields(parsed);
      const numericFields = getNumericFields(parsed);
      
      if (timeFields.length > 0) {
        setTimeKey(timeFields[0]);
      }
      
      if (numericFields.length > 0) {
        setField(numericFields[0]);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV');
    } finally {
      setLoading(false);
    }
  };

  const runForecast = async () => {
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      
      const forecastResult = await runForecastFromCsv(file, {
        field,
        mode,
        horizon,
        useGrid,
        timeKey: timeKey || undefined
      });
      
      setResult(forecastResult);
      onResult?.(forecastResult);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Forecast failed');
    } finally {
      setLoading(false);
    }
  };

  const timeFields = getTimeFields(csvData);
  const numericFields = getNumericFields(csvData);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Time Series Forecast
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="csv-file">Upload CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={loading}
            />
          </div>

          {/* Configuration Options */}
          {csvData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Time Field */}
              <div className="space-y-2">
                <Label>Time Field</Label>
                <Select value={timeKey} onValueChange={setTimeKey}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time field" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeFields.map((field: string) => (
                      <SelectItem key={field} value={field}>
                        {field}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Value Field */}
              <div className="space-y-2">
                <Label>Value Field</Label>
                <Select value={field} onValueChange={setField}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select value field" />
                  </SelectTrigger>
                  <SelectContent>
                    {numericFields.map((f: string) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mode */}
              <div className="space-y-2">
                <Label>Mode</Label>
                <Select value={mode} onValueChange={(value: SeriesMode) => setMode(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="row">Row-by-row</SelectItem>
                    <SelectItem value="date_sum">Sum by date</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Horizon */}
              <div className="space-y-2">
                <Label>Forecast Horizon</Label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={horizon}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHorizon(Number(e.target.value))}
                />
              </div>
            </div>
          )}

          {/* Run Forecast Button */}
          <Button 
            onClick={runForecast} 
            disabled={!file || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Forecast...
              </>
            ) : (
              <>
                <TrendingUp className="mr-2 h-4 w-4" />
                Run Forecast
              </>
            )}
          </Button>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results Display */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Forecast Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Series Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{result.meta.n}</div>
                <div className="text-sm text-muted-foreground">Data Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{result.meta.holdout}</div>
                <div className="text-sm text-muted-foreground">Holdout</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{result.used.alpha.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Alpha</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{result.used.beta.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Beta</div>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold">{result.metrics.MAE.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">MAE</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">{result.metrics.RMSE.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">RMSE</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {result.metrics.MAPE ? `${result.metrics.MAPE.toFixed(1)}%` : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">MAPE</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {result.metrics.sMAPE ? `${result.metrics.sMAPE.toFixed(1)}%` : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">sMAPE</div>
              </div>
            </div>

            {/* Forecast Values */}
            <div>
              <h4 className="font-semibold mb-2">Forecast Values</h4>
              <div className="grid grid-cols-5 gap-2">
                {result.forecast.map((value: number, index: number) => (
                  <div key={index} className="text-center p-2 bg-muted rounded">
                    <div className="font-mono text-sm">{value.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">t+{index + 1}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
