import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Line } from 'react-chartjs-2';
import { 
  TrendingUp, 
  LineChart, 
  Hash, 
  Minimize2, 
  Activity, 
  Clock, 
  BarChart, 
  Percent, 
  Calculator 
} from 'lucide-react';
import { formatNumber } from '@/utils/analysis/formatting';
import { RegressionResult, RegressionType } from '@/utils/analysis/regression/types';

// Model configurations with icons and descriptions
const modelConfigs: Record<RegressionType, {
  name: string;
  description: string;
  icon: React.ElementType;
  formula: string;
  assumptions: string[];
}> = {
  'linear': {
    name: 'Linear Regression',
    description: 'Models linear relationships between variables',
    icon: TrendingUp,
    formula: 'y = β₀ + β₁x + ε',
    assumptions: [
      'Linear relationship between variables',
      'Independence of observations',
      'Homoscedasticity (constant variance)',
      'Normally distributed residuals',
      'No multicollinearity'
    ]
  },
  'polynomial': {
    name: 'Polynomial Regression',
    description: 'Models non-linear relationships using polynomial terms',
    icon: LineChart,
    formula: 'y = β₀ + β₁x + β₂x² + ... + βₙxⁿ + ε',
    assumptions: [
      'Independence of observations',
      'Homoscedasticity',
      'Normally distributed residuals'
    ]
  },
  'ridge': {
    name: 'Ridge Regression (L2)',
    description: 'Linear regression with L2 regularization to prevent overfitting',
    icon: Hash,
    formula: 'min(||y - Xβ||² + α||β||²)',
    assumptions: [
      'Linear relationship between variables',
      'Independence of observations',
      'Homoscedasticity',
      'Normally distributed residuals'
    ]
  },
  'lasso': {
    name: 'Lasso Regression (L1)',
    description: 'Linear regression with L1 regularization for feature selection',
    icon: Minimize2,
    formula: 'min(||y - Xβ||² + α||β||₁)',
    assumptions: [
      'Linear relationship between variables',
      'Independence of observations',
      'Homoscedasticity',
      'Normally distributed residuals'
    ]
  },
  'elastic-net': {
    name: 'Elastic Net Regression',
    description: 'Combines L1 and L2 regularization',
    icon: Activity,
    formula: 'min(||y - Xβ||² + α(ρ||β||₁ + (1-ρ)||β||²))',
    assumptions: [
      'Linear relationship between variables',
      'Independence of observations',
      'Homoscedasticity',
      'Normally distributed residuals'
    ]
  },
  'logistic': {
    name: 'Logistic Regression',
    description: 'Models binary outcomes using logistic function',
    icon: Calculator,
    formula: 'p(y=1) = 1/(1 + e^(-β₀ - β₁x))',
    assumptions: [
      'Binary outcome variable',
      'Independence of observations',
      'No multicollinearity',
      'Linearity of independent variables and log odds'
    ]
  },
  'quantile': {
    name: 'Quantile Regression',
    description: 'Models conditional quantiles of the response variable',
    icon: Percent,
    formula: 'Q_y(τ|x) = β₀(τ) + β₁(τ)x',
    assumptions: [
      'Independence of observations',
      'No multicollinearity'
    ]
  },
  'time-series': {
    name: 'Time Series Regression',
    description: 'Models time-dependent data with lagged variables',
    icon: Clock,
    formula: 'y_t = β₀ + β₁y_{t-1} + β₂x_t + ε_t',
    assumptions: [
      'Stationarity of time series',
      'No autocorrelation in residuals',
      'Homoscedasticity',
      'Normally distributed residuals'
    ]
  },
  'log-log': {
    name: 'Log-Log Regression',
    description: 'Models multiplicative relationships using logarithms',
    icon: BarChart,
    formula: 'ln(y) = β₀ + β₁ln(x) + ε',
    assumptions: [
      'Multiplicative relationship between variables',
      'Independence of observations',
      'Homoscedasticity',
      'Normally distributed residuals',
      'Positive values for all variables'
    ]
  }
};

interface RegressionResultsDisplayProps {
  results: RegressionResult[];
}

export function RegressionResultsDisplay({ results }: RegressionResultsDisplayProps) {
  const [activeTab, setActiveTab] = useState<string>('overview');
  
  if (!results || results.length === 0) {
    return (
      <Card className="p-6">
        <CardHeader>
          <CardTitle>Regression Analysis</CardTitle>
          <CardDescription>No regression results available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Group results by regression type
  const resultsByType: Record<RegressionType, RegressionResult[]> = {} as Record<RegressionType, RegressionResult[]>;
  
  results.forEach(result => {
    if (!resultsByType[result.type]) {
      resultsByType[result.type] = [];
    }
    resultsByType[result.type].push(result);
  });

  // Calculate average metrics for each regression type
  const averageMetricsByType: Record<RegressionType, {
    rSquared: number;
    rmse: number;
    mae: number;
  }> = {} as Record<RegressionType, {
    rSquared: number;
    rmse: number;
    mae: number;
  }>;

  Object.entries(resultsByType).forEach(([type, typeResults]) => {
    const avgR2 = typeResults.reduce((sum, r) => sum + r.rSquared, 0) / typeResults.length;
    const avgRMSE = typeResults.reduce((sum, r) => sum + r.metrics.rmse, 0) / typeResults.length;
    const avgMAE = typeResults.reduce((sum, r) => sum + r.metrics.mae, 0) / typeResults.length;
    
    averageMetricsByType[type as RegressionType] = {
      rSquared: avgR2,
      rmse: avgRMSE,
      mae: avgMAE
    };
  });

  // Find the best performing model based on R-squared
  const bestModel = Object.entries(averageMetricsByType)
    .sort((a, b) => b[1].rSquared - a[1].rSquared)[0];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Regression Analysis Results</CardTitle>
        <CardDescription>
          Comprehensive analysis of different regression models
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="models">Models</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="visualizations">Visualizations</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Best Performing Model</CardTitle>
                </CardHeader>
                <CardContent>
                  {bestModel && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {React.createElement(modelConfigs[bestModel[0] as RegressionType].icon, { size: 24 })}
                        <h3 className="text-xl font-bold">{modelConfigs[bestModel[0] as RegressionType].name}</h3>
                      </div>
                      <p className="text-sm text-gray-500">{modelConfigs[bestModel[0] as RegressionType].description}</p>
                      <div className="mt-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">R² Score</span>
                          <span className="text-sm font-medium">{(bestModel[1].rSquared * 100).toFixed(2)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${bestModel[1].rSquared * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Model Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Model</TableHead>
                        <TableHead>R²</TableHead>
                        <TableHead>RMSE</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(averageMetricsByType)
                        .sort((a, b) => b[1].rSquared - a[1].rSquared)
                        .map(([type, metrics]) => (
                          <TableRow key={type}>
                            <TableCell className="font-medium">
                              {modelConfigs[type as RegressionType].name}
                            </TableCell>
                            <TableCell>{(metrics.rSquared * 100).toFixed(2)}%</TableCell>
                            <TableCell>{formatNumber(metrics.rmse)}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Models Tab */}
          <TabsContent value="models" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              {Object.entries(resultsByType).map(([type, typeResults]) => (
                <AccordionItem key={type} value={type}>
                  <AccordionTrigger className="text-lg font-medium">
                    <div className="flex items-center gap-2">
                      {React.createElement(modelConfigs[type as RegressionType].icon, { size: 20 })}
                      {modelConfigs[type as RegressionType].name}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Description</h4>
                          <p className="text-sm text-gray-600">{modelConfigs[type as RegressionType].description}</p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Formula</h4>
                          <code className="text-sm bg-gray-100 p-2 rounded block">{modelConfigs[type as RegressionType].formula}</code>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Assumptions</h4>
                        <ul className="list-disc pl-5 text-sm text-gray-600">
                          {modelConfigs[type as RegressionType].assumptions.map((assumption, i) => (
                            <li key={i}>{assumption}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Results</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Field</TableHead>
                              <TableHead>R²</TableHead>
                              <TableHead>Equation</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {typeResults.map((result, i) => (
                              <TableRow key={i}>
                                <TableCell>{result.field}</TableCell>
                                <TableCell>{(result.rSquared * 100).toFixed(2)}%</TableCell>
                                <TableCell className="max-w-xs truncate">
                                  <code className="text-xs">{result.equation}</code>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>
          
          {/* Metrics Tab */}
          <TabsContent value="metrics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(resultsByType).map(([type, typeResults]) => (
                <Card key={type}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {React.createElement(modelConfigs[type as RegressionType].icon, { size: 20 })}
                      {modelConfigs[type as RegressionType].name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Metric</TableHead>
                          <TableHead>Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>R²</TableCell>
                          <TableCell>{(averageMetricsByType[type as RegressionType].rSquared * 100).toFixed(2)}%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>RMSE</TableCell>
                          <TableCell>{formatNumber(averageMetricsByType[type as RegressionType].rmse)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>MAE</TableCell>
                          <TableCell>{formatNumber(averageMetricsByType[type as RegressionType].mae)}</TableCell>
                        </TableRow>
                        {typeResults[0] && (
                          <>
                            <TableRow>
                              <TableCell>Adjusted R²</TableCell>
                              <TableCell>{(typeResults[0].metrics.rSquaredAdj * 100).toFixed(2)}%</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>AIC</TableCell>
                              <TableCell>{formatNumber(typeResults[0].metrics.aic)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>BIC</TableCell>
                              <TableCell>{formatNumber(typeResults[0].metrics.bic)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Durbin-Watson</TableCell>
                              <TableCell>{formatNumber(typeResults[0].metrics.durbinWatson)}</TableCell>
                            </TableRow>
                          </>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* Visualizations Tab */}
          <TabsContent value="visualizations" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(resultsByType).map(([type, typeResults]) => (
                <Card key={type}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {React.createElement(modelConfigs[type as RegressionType].icon, { size: 20 })}
                      {modelConfigs[type as RegressionType].name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {typeResults.map((result, i) => (
                      <div key={i} className="mb-6 last:mb-0">
                        <h4 className="font-medium mb-2">{result.field}</h4>
                        <div className="h-64">
                          <Line
                            data={{
                              labels: Array.from({ length: result.predictions.length }, (_, i) => i + 1),
                              datasets: [
                                {
                                  label: 'Actual',
                                  data: result.actualValues,
                                  borderColor: 'rgb(99, 102, 241)',
                                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                  fill: false,
                                },
                                {
                                  label: 'Predicted',
                                  data: result.predictions,
                                  borderColor: 'rgb(234, 179, 8)',
                                  backgroundColor: 'rgba(234, 179, 8, 0.1)',
                                  fill: false,
                                },
                                {
                                  label: 'Upper CI',
                                  data: result.confidence.upper,
                                  borderColor: 'rgba(99, 102, 241, 0.3)',
                                  borderDash: [5, 5],
                                  fill: false,
                                },
                                {
                                  label: 'Lower CI',
                                  data: result.confidence.lower,
                                  borderColor: 'rgba(99, 102, 241, 0.3)',
                                  borderDash: [5, 5],
                                  fill: false,
                                }
                              ]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                title: {
                                  display: true,
                                  text: `${modelConfigs[type as RegressionType].name} - ${result.field}`
                                }
                              },
                              scales: {
                                y: {
                                  beginAtZero: true
                                }
                              }
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              {Object.entries(resultsByType).map(([type, typeResults]) => (
                <AccordionItem key={type} value={type}>
                  <AccordionTrigger className="text-lg font-medium">
                    <div className="flex items-center gap-2">
                      {React.createElement(modelConfigs[type as RegressionType].icon, { size: 20 })}
                      {modelConfigs[type as RegressionType].name}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 p-4">
                      {typeResults.map((result, i) => (
                        <Card key={i} className="mb-4">
                          <CardHeader>
                            <CardTitle>{result.field}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium mb-2">Equation</h4>
                                <code className="text-sm bg-gray-100 p-2 rounded block">{result.equation}</code>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">Coefficients</h4>
                                <div className="space-y-1">
                                  <div className="flex justify-between">
                                    <span>Intercept:</span>
                                    <span>{formatNumber(result.intercept)}</span>
                                  </div>
                                  {result.coefficients.map((coef, j) => (
                                    <div key={j} className="flex justify-between">
                                      <span>β{j+1}:</span>
                                      <span>{formatNumber(coef)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-4">
                              <h4 className="font-medium mb-2">Metrics</h4>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Metric</TableHead>
                                    <TableHead>Value</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  <TableRow>
                                    <TableCell>R²</TableCell>
                                    <TableCell>{(result.rSquared * 100).toFixed(2)}%</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell>Adjusted R²</TableCell>
                                    <TableCell>{(result.metrics.rSquaredAdj * 100).toFixed(2)}%</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell>MSE</TableCell>
                                    <TableCell>{formatNumber(result.metrics.mse)}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell>RMSE</TableCell>
                                    <TableCell>{formatNumber(result.metrics.rmse)}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell>MAE</TableCell>
                                    <TableCell>{formatNumber(result.metrics.mae)}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell>AIC</TableCell>
                                    <TableCell>{formatNumber(result.metrics.aic)}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell>BIC</TableCell>
                                    <TableCell>{formatNumber(result.metrics.bic)}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell>Durbin-Watson</TableCell>
                                    <TableCell>{formatNumber(result.metrics.durbinWatson)}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell>Standard Error</TableCell>
                                    <TableCell>{formatNumber(result.standardError)}</TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 