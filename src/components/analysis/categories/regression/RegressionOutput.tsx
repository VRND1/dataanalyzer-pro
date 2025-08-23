import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface RegressionOutputProps {
  results: {
    fieldName: string;
    metrics: {
      r2Score: number;
      rmse: number;
      mae: number;
      adjustedR2: number;
      aic: number;
      bic: number;
      crossValidation: number;
      fStatistic: number;
      pValue: number;
    };
    coefficients: number[];
    predictions: number[];
    residuals: number[];
    confidenceIntervals: Array<[number, number]>;
  };
  actualValues: number[];
}

export function RegressionOutput({ results, actualValues }: RegressionOutputProps) {
  const formatValue = (value: number): string => {
    if (isNaN(value)) return 'NaN';
    if (value === 0) return '0.00';
    return value.toFixed(4);
  };

  const formatPercentage = (value: number): string => {
    if (isNaN(value)) return 'NaN';
    return (value * 100).toFixed(2) + '%';
  };

  return (
    <Tabs defaultValue="summary" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="summary">Model Summary</TabsTrigger>
        <TabsTrigger value="coefficients">Coefficients</TabsTrigger>
        <TabsTrigger value="predictions">Predictions</TabsTrigger>
        <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
      </TabsList>

      {/* Model Summary */}
      <TabsContent value="summary">
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900">R² Score</h3>
                <p className="text-2xl font-bold text-blue-700">
                  {formatPercentage(results.metrics.r2Score)}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900">Adjusted R²</h3>
                <p className="text-2xl font-bold text-blue-700">
                  {formatPercentage(results.metrics.adjustedR2)}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900">RMSE</h3>
                <p className="text-2xl font-bold text-blue-700">
                  {formatValue(results.metrics.rmse)}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900">MAE</h3>
                <p className="text-2xl font-bold text-blue-700">
                  {formatValue(results.metrics.mae)}
                </p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900">AIC</h3>
                <p className="text-2xl font-bold text-gray-700">
                  {formatValue(results.metrics.aic)}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900">BIC</h3>
                <p className="text-2xl font-bold text-gray-700">
                  {formatValue(results.metrics.bic)}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900">F-Statistic</h3>
                <p className="text-2xl font-bold text-gray-700">
                  {formatValue(results.metrics.fStatistic)}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900">P-Value</h3>
                <p className="text-2xl font-bold text-gray-700">
                  {formatValue(results.metrics.pValue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Coefficients */}
      <TabsContent value="coefficients">
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Term</TableHead>
                  <TableHead>Coefficient</TableHead>
                  <TableHead>Confidence Interval</TableHead>
                  <TableHead>Standard Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.coefficients.map((coef, index) => (
                  <TableRow key={index}>
                    <TableCell>{index === 0 ? 'Intercept' : `X${index}`}</TableCell>
                    <TableCell>{formatValue(coef)}</TableCell>
                    <TableCell>
                      {results.confidenceIntervals[index] 
                        ? `[${formatValue(results.confidenceIntervals[index][0])}, ${formatValue(results.confidenceIntervals[index][1])}]`
                        : '-'}
                    </TableCell>
                    <TableCell>-</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Predictions */}
      <TabsContent value="predictions">
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Index</TableHead>
                  <TableHead>Actual</TableHead>
                  <TableHead>Predicted</TableHead>
                  <TableHead>Residual</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.predictions.slice(0, 10).map((pred, i) => (
                  <TableRow key={i}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{formatValue(actualValues[i])}</TableCell>
                    <TableCell>{formatValue(pred)}</TableCell>
                    <TableCell>{formatValue(results.residuals[i])}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Diagnostics */}
      <TabsContent value="diagnostics">
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900">Cross-Validation Score</h3>
                <p className="text-2xl font-bold text-blue-700">
                  {formatPercentage(results.metrics.crossValidation)}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900">Model Complexity</h3>
                <p className="text-2xl font-bold text-blue-700">
                  {results.coefficients.length - 1}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
} 