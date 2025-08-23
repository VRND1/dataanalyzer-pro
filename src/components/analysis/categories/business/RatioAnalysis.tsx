import { Card } from '@/components/ui/card';
import type { DataField } from '@/types/data';

interface RatioAnalysisProps {
  data: {
    fields: DataField[];
  };
}

export const RatioAnalysis: React.FC<RatioAnalysisProps> = ({ data }) => {
  // Find relevant financial fields
  const revenueField = data.fields.find(f => f.name.toLowerCase().includes('revenue') || f.name.toLowerCase().includes('sales'));
  const profitField = data.fields.find(f => f.name.toLowerCase().includes('profit') || f.name.toLowerCase().includes('income'));
  const assetsField = data.fields.find(f => f.name.toLowerCase().includes('assets'));
  const liabilitiesField = data.fields.find(f => f.name.toLowerCase().includes('liabilities'));

  // Calculate ratios if we have the necessary data
  const calculateRatio = (numerator: number[], denominator: number[]) => {
    if (!numerator.length || !denominator.length) return null;
    const avgNumerator = numerator.reduce((a, b) => a + b, 0) / numerator.length;
    const avgDenominator = denominator.reduce((a, b) => a + b, 0) / denominator.length;
    return avgDenominator !== 0 ? avgNumerator / avgDenominator : null;
  };

  const profitMargin = profitField && revenueField ? 
    calculateRatio(profitField.value as number[], revenueField.value as number[]) : null;
  
  const assetTurnover = revenueField && assetsField ?
    calculateRatio(revenueField.value as number[], assetsField.value as number[]) : null;
  
  const debtToEquity = liabilitiesField && assetsField ?
    calculateRatio(liabilitiesField.value as number[], assetsField.value as number[]) : null;

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold text-black mb-4">Ratio Analysis</h3>
      <div className="space-y-4">
        {profitMargin !== null && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-black">Profit Margin</h4>
            <p className="text-2xl font-bold text-indigo-600">
              {(profitMargin * 100).toFixed(2)}%
            </p>
            <p className="text-sm text-gray-500">Net Profit / Revenue</p>
          </div>
        )}
        
        {assetTurnover !== null && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-black">Asset Turnover</h4>
            <p className="text-1xl font-bold text-indigo-600">
              {assetTurnover.toFixed(2)}x
            </p>
            <p className="text-sm text-gray-500">Revenue / Total Assets</p>
          </div>
        )}
        
        {debtToEquity !== null && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-black">Debt to Equity</h4>
            <p className="text-2xl font-bold text-indigo-600">
              {debtToEquity.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500">Total Liabilities / Total Assets</p>
          </div>
        )}

        {!profitMargin && !assetTurnover && !debtToEquity && (
          <p className="text-gray-500">
            Not enough financial data available to calculate ratios. Please ensure your data includes revenue, profit, assets, and liabilities fields.
          </p>
        )}
      </div>
    </Card>
  );
}; 