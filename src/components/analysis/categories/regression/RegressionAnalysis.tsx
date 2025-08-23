import { useState } from 'react';
import { DataField } from '@/types/data';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { LineChart, ScatterChart } from '@/components/charts';
import { RegressionType } from '@/utils/analysis/regression/types';
import { calculateLinearRegression } from '@/utils/analysis/regression/linear';
import { calculatePolynomialRegression } from '@/utils/analysis/regression/polynomial';
import { calculateRidgeRegression } from '@/utils/analysis/regression/ridge';
import { calculateLassoRegression } from '@/utils/analysis/regression/lasso';
import { calculateElasticNetRegression } from '@/utils/analysis/regression/elastic-net';
import { calculateLogisticRegression } from '@/utils/analysis/regression/logistic';
import { calculateQuantileRegression } from '@/utils/analysis/regression/quantile';
import { calculateTimeSeriesRegression } from '@/utils/analysis/regression/time-series';
import { calculateLogLogRegression } from '@/utils/analysis/regression/log-log';

interface RegressionAnalysisProps {
  fields: DataField[];
}

interface RegressionResult {
  fieldName: string;
  metrics: {
    r2Score: number;
    rmse: number;
    mae: number;
    adjustedR2: number;
    aic: number;
    bic: number;
    crossValidationScore?: number;
    crossValidationDetails?: {
      foldScores: number[];
      meanScore: number;
      stdScore: number;
    };
    fStatistic?: number;
    pValue?: number;
  };
  coefficients: number[];
  predictions: number[];
  residuals: number[];
  actualValues: number[];
  confidenceIntervals?: Array<[number, number]>;
  diagnostics?: {
    residualPlotData: Array<{x: number, y: number}>;
    qqPlotData: Array<{x: number, y: number}>;
    leveragePlotData?: Array<{x: number, y: number}>;
  };
}

export function RegressionAnalysis({ fields }: RegressionAnalysisProps) {
  const [selectedModel, setSelectedModel] = useState<RegressionType>('linear');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [targetField, setTargetField] = useState<string>('');
  const [polynomialDegree, setPolynomialDegree] = useState<number>(2);
  const [regularizationStrength, setRegularizationStrength] = useState<number>(0.1);
  const [crossValidationFolds, setCrossValidationFolds] = useState<number>(5);
  const [confidenceLevel, setConfidenceLevel] = useState<number>(0.95);
  const [results, setResults] = useState<RegressionResult[] | null>(null);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('configuration');
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState<boolean>(false);
  const [selectedVisualization, setSelectedVisualization] = useState<string>('metrics');

  // Filter numeric fields with valid data
  const numericFields = fields.filter(f => 
    f.type === 'number' && 
    Array.isArray(f.value) && 
    f.value.length > 0 &&
    !f.value.some(isNaN)
  );

  console.log('Available fields:', fields.map(f => ({ name: f.name, type: f.type, length: Array.isArray(f.value) ? f.value.length : 'not array' })));
  console.log('Numeric fields:', numericFields.map(f => ({ name: f.name, length: f.value.length, sample: (f.value as number[]).slice(0, 3) })));

  const modelTypes: { type: string; label: string; description: string; regressionType: RegressionType }[] = [
    { type: 'linear', label: 'Linear', description: 'Simple linear regression for single predictor', regressionType: 'linear' },
    { type: 'multiple-linear', label: 'Multiple Linear', description: 'Multiple predictors linear regression', regressionType: 'linear' },
    { type: 'logistic', label: 'Logistic', description: 'For binary classification problems', regressionType: 'logistic' },
    { type: 'polynomial', label: 'Polynomial', description: 'Non-linear relationships with polynomial terms', regressionType: 'polynomial' },
    { type: 'ridge', label: 'Ridge (L2)', description: 'L2 regularization for multicollinearity', regressionType: 'ridge' },
    { type: 'lasso', label: 'Lasso (L1)', description: 'L1 regularization for feature selection', regressionType: 'lasso' },
    { type: 'elastic-net', label: 'Elastic Net', description: 'Combined L1 and L2 regularization', regressionType: 'elastic-net' },
    { type: 'stepwise', label: 'Stepwise', description: 'Automated feature selection', regressionType: 'linear' },
    { type: 'time-series', label: 'Time Series', description: 'For temporal data analysis', regressionType: 'time-series' },
    { type: 'quantile', label: 'Quantile', description: 'For robust regression', regressionType: 'quantile' },
    { type: 'log-log', label: 'Log-Log', description: 'For power law relationships', regressionType: 'log-log' }
  ];

  const handleAnalysis = async () => {
    try {
      setError('');
      console.log('Starting analysis with:', { selectedModel, targetField, selectedFeatures });
      
      // Validate inputs
      if (!targetField) {
        setError('Please select a target field');
        return;
      }
      
      if (selectedFeatures.length === 0) {
        setError('Please select at least one feature field');
        return;
      }
      
      const targetFieldData = numericFields.find(f => f.name === targetField);
      if (!targetFieldData) {
        setError('Selected target field not found');
        return;
      }
      
      const y = targetFieldData.value as number[];
      if (y.length < 3) {
        setError('Not enough data points for analysis');
        return;
      }
      
      console.log('Target field data:', { name: targetField, length: y.length, sample: y.slice(0, 5) });
      
      // Perform regression for each selected feature
      const analysisResults: RegressionResult[] = [];
      
      for (const featureName of selectedFeatures) {
        console.log('Processing feature:', featureName);
        const feature = numericFields.find(f => f.name === featureName);
        if (!feature) {
          console.warn(`Feature ${featureName} not found`);
          continue;
        }
        
        const x = feature.value as number[];
        console.log('Feature data:', { name: featureName, length: x.length, sample: x.slice(0, 5) });
        
        // Validate data lengths match
        if (x.length !== y.length) {
          console.warn(`Skipping ${featureName}: length mismatch (x: ${x.length}, y: ${y.length})`);
          continue;
        }

        // Create feature field for regression
        const featureField: DataField = {
          name: featureName,
          type: 'number',
          value: x
        };
        
        const targetDataField: DataField = {
          name: targetField,
          type: 'number',
          value: y
        };
        
        console.log('Calling regression function for:', selectedModel);
        
        // Perform regression based on selected model using the proper regression functions
        let regressionResult;
        
        switch (selectedModel) {
          case 'linear':
            regressionResult = calculateLinearRegression(targetDataField, featureField, crossValidationFolds);
            break;
          case 'polynomial':
            regressionResult = calculatePolynomialRegression(targetDataField, featureField, polynomialDegree, crossValidationFolds);
            break;
          case 'ridge':
            regressionResult = calculateRidgeRegression(targetDataField, featureField, regularizationStrength, crossValidationFolds);
            break;
          case 'lasso':
            regressionResult = calculateLassoRegression(targetDataField, featureField, regularizationStrength, crossValidationFolds);
            break;
          case 'elastic-net':
            regressionResult = calculateElasticNetRegression(targetDataField, featureField, regularizationStrength, 0.5, crossValidationFolds);
            break;
          case 'logistic':
            regressionResult = calculateLogisticRegression(targetDataField, featureField, 1000, 1e-4, 0.01, crossValidationFolds);
            break;
          case 'quantile':
            regressionResult = calculateQuantileRegression(targetDataField, featureField, 0.5, crossValidationFolds);
            break;
          case 'time-series':
            regressionResult = calculateTimeSeriesRegression(targetDataField, featureField, 1, crossValidationFolds);
            break;
          case 'log-log':
            regressionResult = calculateLogLogRegression(targetDataField, featureField, crossValidationFolds);
            break;
          default:
            console.warn('Unknown model type, using linear:', selectedModel);
            regressionResult = calculateLinearRegression(targetDataField, featureField);
        }
        
        console.log('Regression result:', regressionResult);
        
        // Convert the regression result to match our interface
        const convertedResult: RegressionResult = {
          fieldName: featureName,
          metrics: {
            r2Score: regressionResult.metrics.r2Score,
            rmse: regressionResult.metrics.rmse,
            mae: regressionResult.metrics.mae,
            adjustedR2: regressionResult.metrics.adjustedR2,
            aic: regressionResult.metrics.aic,
            bic: regressionResult.metrics.bic,
            crossValidationScore: regressionResult.metrics.crossValidationScore,
            crossValidationDetails: regressionResult.metrics.crossValidationDetails,
            fStatistic: regressionResult.metrics.fStatistic,
            pValue: regressionResult.metrics.pValue
          },
          coefficients: regressionResult.coefficients,
          predictions: regressionResult.predictions,
          residuals: regressionResult.actualValues.map((actual, i) => actual - regressionResult.predictions[i]),
          actualValues: regressionResult.actualValues,
          confidenceIntervals: regressionResult.confidence ? [
            regressionResult.confidence.lower,
            regressionResult.confidence.upper
          ].reduce((acc, curr, i) => {
            acc[i] = [curr[i], regressionResult.confidence!.upper[i]];
            return acc;
          }, [] as Array<[number, number]>) : undefined,
          diagnostics: {
            residualPlotData: regressionResult.actualValues.map((actual, i) => ({
              x: regressionResult.predictions[i],
              y: actual - regressionResult.predictions[i]
            })),
            qqPlotData: regressionResult.actualValues.map((actual, i) => ({
              x: i / regressionResult.actualValues.length,
              y: actual
            }))
          }
        };
        
        analysisResults.push(convertedResult);
      }
      
      console.log('Analysis completed, results:', analysisResults);
      
      if (analysisResults.length === 0) {
        setError('No valid results could be calculated. Please check your data and selections.');
        return;
      }
      
      setResults(analysisResults);
      setActiveTab('results'); // Automatically switch to results tab
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
    }
  };

  // Helper function for QQ plot (commented out as unused)
  // function erfInv(x: number): number {
  //   const a = 0.147;
  //   const sign = x < 0 ? -1 : 1;
  //   const temp = 2 / (Math.PI * a) + Math.log(1 - x * x) / 2;
  //   return sign * Math.sqrt(Math.sqrt(temp * temp - Math.log(1 - x * x) / a) - temp);
  // }

  const renderRSquared = (value: number) => {
    let className = 'text-2xl font-bold';
    let warning = null;
    
    if (value < 0.3) {
      className += ' text-yellow-600';
      warning = ' (Weak fit)';
    } else if (value < 0.6) {
      className += ' text-blue-600';
      warning = ' (Moderate fit)';
    } else {
      className += ' text-green-600';
      warning = ' (Strong fit)';
    }

    return (
      <div>
        <span className={className}>
          {typeof value === 'number' && !isNaN(value) 
            ? `${(value * 100).toFixed(2)}%` 
            : 'N/A'}
        </span>
        {warning && <span className="text-sm text-gray-500 ml-2">{warning}</span>}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="configuration" className="text-black">Configuration</TabsTrigger>
          <TabsTrigger value="results" disabled={!results} className="text-black">Results</TabsTrigger>
          <TabsTrigger value="diagnostics" disabled={!results} className="text-black">Diagnostics</TabsTrigger>
          <TabsTrigger value="visualizations" disabled={!results} className="text-black">Visualizations</TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="text-black">
          <Card>
            <CardContent className="pt-6 space-y-6 text-black">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-black">
                <div className="space-y-4 text-black">
                  <div>
                    <Label className="text-black">Target Field</Label>
                    <Select value={targetField} onValueChange={setTargetField}>
                      <SelectTrigger className="text-black bg-gray-100">
                        <SelectValue placeholder="Select target field" className="text-black"/>
                      </SelectTrigger>
                      <SelectContent className="bg-gray-100">
                        {numericFields.map(field => (
                          <SelectItem key={field.name} value={field.name} className="text-black hover:bg-gray-200">
                            {field.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Features</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-black">
                      {numericFields.map(field => (
                        <div key={field.name} className="flex items-center space-x-2">
                          <Checkbox
                            id={field.name}
                            checked={selectedFeatures.includes(field.name)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedFeatures([...selectedFeatures, field.name]);
                              } else {
                                setSelectedFeatures(selectedFeatures.filter(f => f !== field.name));
                              }
                            }}
                          />
                          <Label htmlFor={field.name} className="cursor-pointer">
                            {field.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label>Model Type</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {modelTypes.map(model => (
                        <div
                          key={model.type}
                          className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                            selectedModel === model.regressionType
                              ? 'bg-blue-50 border-blue-500'
                              : 'hover:bg-gray-50 border-gray-200'
                          }`}
                          onClick={() => setSelectedModel(model.regressionType)}
                        >
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${
                              selectedModel === model.regressionType ? 'bg-blue-500' : 'bg-gray-200'
                            }`} />
                            <span className="text-sm font-medium text-black">{model.label}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{model.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedModel === 'polynomial' && (
                    <div>
                      <Label className="text-black">Polynomial Degree: {polynomialDegree}</Label>
                      <Slider
                        value={[polynomialDegree]}
                        onValueChange={(values) => setPolynomialDegree(values[0])}
                        min={2}
                        max={5}
                        step={1}
                      />
                    </div>
                  )}

                  {(selectedModel === 'ridge' || selectedModel === 'lasso' || selectedModel === 'elastic-net') && (
                    <div>
                      <Label className="text-black">Regularization Strength: {typeof regularizationStrength === 'number' && !isNaN(regularizationStrength) ? regularizationStrength.toFixed(2) : 'N/A'}</Label>
                      <Slider
                        value={[regularizationStrength]}
                        onValueChange={([value]) => setRegularizationStrength(value)}
                        min={0}
                        max={1}
                        step={0.01}
                      />
                    </div>
                  )}

                  <div>
                    <Label className="text-black">Cross-Validation Folds: {crossValidationFolds}</Label>
                    <Slider
                      value={[crossValidationFolds]}
                      onValueChange={([value]) => setCrossValidationFolds(value)}
                      min={2}
                      max={10}
                      step={1}
                    />
                  </div>

                  <div>
                    <Label className="text-black">Confidence Level: {typeof confidenceLevel === 'number' && !isNaN(confidenceLevel) ? `${(confidenceLevel * 100).toFixed(0)}%` : 'N/A'}</Label>
                    <Slider
                      value={[confidenceLevel]}
                      onValueChange={([value]) => setConfidenceLevel(value)}
                      min={0.8}
                      max={0.99}
                      step={0.01}
                    />
                  </div>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button onClick={handleAnalysis} className="w-full bg-black text-white hover:bg-gray-800" >
                Run Analysis
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          {results && (
            <Card>
              <CardContent className="pt-6 space-y-6 text-black">
                <div className="flex items-center space-x-2 text-black">
                  <Checkbox
                    id="advanced-metrics"
                    checked={showAdvancedMetrics}
                    onCheckedChange={(checked) => setShowAdvancedMetrics(checked as boolean)}
                  />
                  <Label htmlFor="advanced-metrics" className="text-black">Show Advanced Metrics</Label>
                </div>

                {results.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-black mb-4">{result.fieldName}</h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-black">R² Score</h4>
                        {renderRSquared(result.metrics.r2Score)}
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-black">Adjusted R²</h4>
                        {renderRSquared(result.metrics.adjustedR2)}
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-black">RMSE</h4>
                        <p className="text-2xl font-bold text-black">
                          {typeof result.metrics.rmse === 'number' && !isNaN(result.metrics.rmse) 
                            ? result.metrics.rmse.toFixed(4) 
                            : 'N/A'}
                        </p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-black">MAE</h4>
                        <p className="text-2xl font-bold text-black">
                          {typeof result.metrics.mae === 'number' && !isNaN(result.metrics.mae) 
                            ? result.metrics.mae.toFixed(4) 
                            : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {showAdvancedMetrics && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-black mb-2">Model Information</h4>
                          <div className="bg-gray-50 p-3 rounded-lg text-black">
                            <p>AIC: {typeof result.metrics.aic === 'number' && !isNaN(result.metrics.aic) 
                              ? result.metrics.aic.toFixed(2) 
                              : 'N/A'}</p>
                            <p>BIC: {typeof result.metrics.bic === 'number' && !isNaN(result.metrics.bic) 
                              ? result.metrics.bic.toFixed(2) 
                              : 'N/A'}</p>
                            {result.metrics.fStatistic && typeof result.metrics.fStatistic === 'number' && !isNaN(result.metrics.fStatistic) && (
                              <p>F-Statistic: {result.metrics.fStatistic.toFixed(2)}</p>
                            )}
                            {result.metrics.pValue && typeof result.metrics.pValue === 'number' && !isNaN(result.metrics.pValue) && (
                              <p>P-Value: {result.metrics.pValue.toExponential(2)}</p>
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-black mb-2">Cross-Validation</h4>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-black">Score: {typeof result.metrics.crossValidationScore === 'number' && !isNaN(result.metrics.crossValidationScore) ? result.metrics.crossValidationScore.toFixed(4) : 'N/A'}</p>
                            {result.metrics.crossValidationDetails && (
                              <div className="mt-4">
                                <h5 className="font-medium text-black mb-2">{crossValidationFolds}-Fold CV Metrics ({targetField} ~ {result.fieldName})</h5>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm border-collapse border border-gray-300">
                                    <thead>
                                      <tr className="bg-gray-100">
                                        <th className="border border-gray-300 px-2 py-1 text-left">Fold</th>
                                        <th className="border border-gray-300 px-2 py-1 text-left">R²</th>
                                        <th className="border border-gray-300 px-2 py-1 text-left">RMSE</th>
                                        <th className="border border-gray-300 px-2 py-1 text-left">MAE</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {result.metrics.crossValidationDetails.foldScores.map((score, i) => (
                                        <tr key={i} className="hover:bg-gray-50">
                                          <td className="border border-gray-300 px-2 py-1">{i + 1}</td>
                                          <td className="border border-gray-300 px-2 py-1">{score.toFixed(6)}</td>
                                          <td className="border border-gray-300 px-2 py-1">{(result.metrics.crossValidationDetails as any)?.foldRMSE?.[i]?.toFixed(6) || 'N/A'}</td>
                                          <td className="border border-gray-300 px-2 py-1">{(result.metrics.crossValidationDetails as any)?.foldMAE?.[i]?.toFixed(6) || 'N/A'}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                
                                <h5 className="font-medium text-black mb-2 mt-4">{crossValidationFolds}-Fold CV Summary (Mean ± Std)</h5>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm border-collapse border border-gray-300">
                                    <thead>
                                      <tr className="bg-gray-100">
                                        <th className="border border-gray-300 px-2 py-1 text-left">Metric</th>
                                        <th className="border border-gray-300 px-2 py-1 text-left">Mean</th>
                                        <th className="border border-gray-300 px-2 py-1 text-left">Std</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr className="hover:bg-gray-50">
                                        <td className="border border-gray-300 px-2 py-1">R²</td>
                                        <td className="border border-gray-300 px-2 py-1">{result.metrics.crossValidationDetails.meanScore.toFixed(6)}</td>
                                        <td className="border border-gray-300 px-2 py-1">{result.metrics.crossValidationDetails.stdScore.toFixed(6)}</td>
                                      </tr>
                                      <tr className="hover:bg-gray-50">
                                        <td className="border border-gray-300 px-2 py-1">RMSE</td>
                                        <td className="border border-gray-300 px-2 py-1">{(result.metrics.crossValidationDetails as any)?.meanRMSE?.toFixed(6) || 'N/A'}</td>
                                        <td className="border border-gray-300 px-2 py-1">{(result.metrics.crossValidationDetails as any)?.stdRMSE?.toFixed(6) || 'N/A'}</td>
                                      </tr>
                                      <tr className="hover:bg-gray-50">
                                        <td className="border border-gray-300 px-2 py-1">MAE</td>
                                        <td className="border border-gray-300 px-2 py-1">{(result.metrics.crossValidationDetails as any)?.meanMAE?.toFixed(6) || 'N/A'}</td>
                                        <td className="border border-gray-300 px-2 py-1">{(result.metrics.crossValidationDetails as any)?.stdMAE?.toFixed(6) || 'N/A'}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="diagnostics">
          {results && (
            <Card>
              <CardContent className="pt-6 space-y-6">
                {results.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-black mb-4">{result.fieldName}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-2 text-black">Residual Plot</h4>
                        {result.diagnostics?.residualPlotData && (
                          <ScatterChart
                            data={result.diagnostics.residualPlotData}
                            xField="x"
                            yField="y"
                            height={300}
                          />
                        )}
                        <div className="text-sm text-gray-500 text-center mt-1">
                          Predicted Values vs Residuals
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2 text-black">Q-Q Plot</h4>
                        {result.diagnostics?.qqPlotData && (
                          <ScatterChart
                            data={result.diagnostics.qqPlotData}
                            xField="x"
                            yField="y"
                            height={300}
                          />
                        )}
                        <div className="text-sm text-gray-500 text-center mt-1">
                          Theoretical Quantiles vs Sample Quantiles
                        </div>
                      </div>
                      
                      <div className="md:col-span-2">
                        <h4 className="font-medium mb-2 text-black">Actual vs Predicted</h4>
                        <ScatterChart
                          data={result.actualValues.map((actual, i) => ({
                            x: actual,
                            y: result.predictions[i]
                          }))}
                          xField="x"
                          yField="y"
                          height={300}
                        />
                        <div className="text-sm text-gray-500 text-center mt-1">
                          Actual Values vs Predicted Values
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="visualizations">
          {results && (
            <Card>
              <CardContent className="pt-6 space-y-6">
                {/* Visualization Summary Metrics */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-black mb-4">Visualization Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-black">Model Comparison</h4>
                          <p className="text-xs text-gray-500">R² Score</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-black">
                            {typeof results[0]?.metrics?.r2Score === 'number' && !isNaN(results[0].metrics.r2Score) 
                              ? (results[0].metrics.r2Score * 100).toFixed(1) 
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-black">Predictions vs Actual</h4>
                          <p className="text-xs text-gray-500">RMSE</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-black">
                            {typeof results[0]?.metrics?.rmse === 'number' && !isNaN(results[0].metrics.rmse) 
                              ? results[0].metrics.rmse.toFixed(2) 
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-orange-50 p-4 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-black">Residual Analysis</h4>
                          <p className="text-xs text-gray-500">MAE</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-black">
                            {typeof results[0]?.metrics?.mae === 'number' && !isNaN(results[0].metrics.mae) 
                              ? results[0].metrics.mae.toFixed(2) 
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-black">Model Performance</h4>
                          <p className="text-xs text-gray-500">Adjusted R²</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-black">
                            {typeof results[0]?.metrics?.adjustedR2 === 'number' && !isNaN(results[0].metrics.adjustedR2) 
                              ? (results[0].metrics.adjustedR2 * 100).toFixed(1) 
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <Select
                    value={selectedVisualization}
                    onValueChange={setSelectedVisualization}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select visualization" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="metrics" className="text-black">Model Comparison</SelectItem>
                      <SelectItem value="regularization" className="text-black">Regularization Path</SelectItem>
                      <SelectItem value="predictions" className="text-black">Predictions vs Actual</SelectItem>
                      <SelectItem value="residuals" className="text-black">Residual Analysis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {results.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-black mb-4">{result.fieldName}</h3>
                    
                    {selectedVisualization === 'metrics' && (
                      <div className="h-[400px]">
                        <LineChart
                          data={[
                            { name: 'R²', value: result.metrics.r2Score },
                            { name: 'Adjusted R²', value: result.metrics.adjustedR2 },
                            { name: 'RMSE', value: result.metrics.rmse },
                            { name: 'MAE', value: result.metrics.mae }
                          ]}
                          xField="name"
                          yField="value"
                        />
                      </div>
                    )}

                    {selectedVisualization === 'predictions' && (
                      <div className="h-[400px]">
                        <ScatterChart
                          data={result.predictions.map((pred, i) => ({
                            actual: result.actualValues[i],
                            predicted: pred
                          }))}
                          xField="actual"
                          yField="predicted"
                        />
                      </div>
                    )}

                    {selectedVisualization === 'residuals' && (
                      <div className="h-[400px]">
                        <ScatterChart
                          data={result.residuals.map((res, i) => ({
                            predicted: result.predictions[i],
                            residual: res
                          }))}
                          xField="predicted"
                          yField="residual"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 
