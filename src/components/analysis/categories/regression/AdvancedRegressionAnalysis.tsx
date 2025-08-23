import { useState } from 'react';
import { DataField } from '@/types/data';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, BarChart } from '@/components/charts';

interface AdvancedRegressionAnalysisProps {
  fields: DataField[];
}

export function AdvancedRegressionAnalysis({ fields }: AdvancedRegressionAnalysisProps) {
  const [selectedModel, setSelectedModel] = useState('linear');
  const [target, setTarget] = useState<string>('');
  const [features, setFeatures] = useState<string[]>([]);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const numericFields = fields.filter(field => field.type === 'number');

  const handleAnalysis = async () => {
    if (!target || features.length === 0) {
      setError('Please select both target and feature variables');
      return;
    }

    try {
      setIsAnalyzing(true);
      setError('');

      // Prepare data for analysis
      const X = features.map(feature => {
        const field = numericFields.find(f => f.name === feature);
        return field?.value as number[];
      });

      const y = numericFields.find(f => f.name === target)?.value as number[];

      // Call backend API for regression analysis
      const response = await fetch('/api/regression/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          X,
          y,
          model_type: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to perform regression analysis');
      }

      const analysisResults = await response.json();
      setResults(analysisResults);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Advanced Regression Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Model Type</label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select model type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear Regression</SelectItem>
                  <SelectItem value="ridge">Ridge Regression</SelectItem>
                  <SelectItem value="lasso">Lasso Regression</SelectItem>
                  <SelectItem value="elastic_net">Elastic Net</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Select Target Variable</label>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target variable" />
                </SelectTrigger>
                <SelectContent>
                  {numericFields.map(field => (
                    <SelectItem key={field.name} value={field.name}>
                      {field.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Select Features</label>
              <Select
                value={features.join(',')}
                onValueChange={(value) => setFeatures(value.split(','))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select features" />
                </SelectTrigger>
                <SelectContent>
                  {numericFields
                    .filter(field => field.name !== target)
                    .map(field => (
                      <SelectItem key={field.name} value={field.name}>
                        {field.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleAnalysis}
              disabled={isAnalyzing}
              className="w-full"
            >
              {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {results && (
        <Tabs defaultValue="metrics">
          <TabsList>
            <TabsTrigger value="metrics">Model Metrics</TabsTrigger>
            <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics">
            <Card>
              <CardHeader>
                <CardTitle>Model Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">R² Score</h4>
                    <p className="text-2xl font-bold">{results.metrics.r2.toFixed(4)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">RMSE</h4>
                    <p className="text-2xl font-bold">{results.metrics.rmse.toFixed(4)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">MAE</h4>
                    <p className="text-2xl font-bold">{results.metrics.mae.toFixed(4)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Adjusted R²</h4>
                    <p className="text-2xl font-bold">{results.metrics.adjusted_r2.toFixed(4)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="diagnostics">
            <Card>
              <CardHeader>
                <CardTitle>Model Diagnostics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.diagnostics && (
                    <>
                      <div>
                        <h4 className="font-medium mb-2">Residuals Plot</h4>
                        <div className="h-64">
                          <LineChart
                            data={results.diagnostics.residuals}
                            xField="predicted"
                            yField="residuals"
                          />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Q-Q Plot</h4>
                        <div className="h-64">
                          <LineChart
                            data={results.diagnostics.qq_plot}
                            xField="theoretical"
                            yField="sample"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="predictions">
            <Card>
              <CardHeader>
                <CardTitle>Model Predictions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Actual vs Predicted</h4>
                    <div className="h-64">
                      <LineChart
                        data={results.predictions}
                        xField="actual"
                        yField="predicted"
                      />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Feature Importance</h4>
                    <div className="h-64">
                      <BarChart
                        data={results.feature_importance}
                        xField="feature"
                        yField="importance"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
} 