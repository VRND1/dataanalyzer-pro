interface RegressionMetricsProps {
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
}

export function RegressionMetrics({ fieldName, metrics }: RegressionMetricsProps) {
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
    <div className="w-full p-4">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-700">{fieldName}</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* R² Score */}
        <div className="flex flex-col">
          <div className="bg-blue-600 text-white px-3 py-1 text-sm font-medium rounded-t-md">
            R² Score
          </div>
          <div className="bg-blue-600 text-white px-3 py-2 text-lg font-bold rounded-b-md">
            {formatPercentage(metrics.r2Score)}
          </div>
        </div>

        {/* RMSE */}
        <div className="flex flex-col">
          <div className="bg-blue-600 text-white px-3 py-1 text-sm font-medium rounded-t-md">
            RMSE
          </div>
          <div className="bg-blue-600 text-white px-3 py-2 text-lg font-bold rounded-b-md">
            {formatValue(metrics.rmse)}
          </div>
        </div>

        {/* MAE */}
        <div className="flex flex-col">
          <div className="bg-blue-600 text-white px-3 py-1 text-sm font-medium rounded-t-md">
            MAE
          </div>
          <div className="bg-blue-600 text-white px-3 py-2 text-lg font-bold rounded-b-md">
            {formatValue(metrics.mae)}
          </div>
        </div>

        {/* Adjusted R² */}
        <div className="flex flex-col">
          <div className="bg-blue-600 text-white px-3 py-1 text-sm font-medium rounded-t-md">
            Adj. R²
          </div>
          <div className="bg-blue-600 text-white px-3 py-2 text-lg font-bold rounded-b-md">
            {formatPercentage(metrics.adjustedR2)}
          </div>
        </div>

        {/* AIC */}
        <div className="flex flex-col">
          <div className="bg-blue-600 text-white px-3 py-1 text-sm font-medium rounded-t-md">
            AIC
          </div>
          <div className="bg-blue-600 text-white px-3 py-2 text-lg font-bold rounded-b-md">
            {formatValue(metrics.aic)}
          </div>
        </div>

        {/* BIC */}
        <div className="flex flex-col">
          <div className="bg-blue-600 text-white px-3 py-1 text-sm font-medium rounded-t-md">
            BIC
          </div>
          <div className="bg-blue-600 text-white px-3 py-2 text-lg font-bold rounded-b-md">
            {formatValue(metrics.bic)}
          </div>
        </div>

        {/* Cross-Validation Score */}
        <div className="flex flex-col">
          <div className="bg-blue-600 text-white px-3 py-1 text-sm font-medium rounded-t-md">
            CV Score
          </div>
          <div className="bg-blue-600 text-white px-3 py-2 text-lg font-bold rounded-b-md">
            {formatPercentage(metrics.crossValidation)}
          </div>
        </div>

        {/* F-Statistic */}
        <div className="flex flex-col">
          <div className="bg-blue-600 text-white px-3 py-1 text-sm font-medium rounded-t-md">
            F-Statistic
          </div>
          <div className="bg-blue-600 text-white px-3 py-2 text-lg font-bold rounded-b-md">
            {formatValue(metrics.fStatistic)}
          </div>
        </div>

        {/* P-Value */}
        <div className="flex flex-col">
          <div className="bg-blue-600 text-white px-3 py-1 text-sm font-medium rounded-t-md">
            P-Value
          </div>
          <div className="bg-blue-600 text-white px-3 py-2 text-lg font-bold rounded-b-md">
            {formatValue(metrics.pValue)}
          </div>
        </div>
      </div>
    </div>
  );
} 