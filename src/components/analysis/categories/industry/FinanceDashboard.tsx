import { PiggyBank, AlertTriangle } from 'lucide-react';
import type { DataField } from '@/types/data';

// --- helpers: pull numeric columns safely from data.fields ---
function numCol(fields: DataField[], names: string[]): number[] {
  const lower = (s: string) => s?.toLowerCase?.() ?? '';
  const f = fields.find(
    (x: any) => names.some(n => lower(x.id || x.name || x.label) === n.toLowerCase())
  ) as any;
  if (!f) return [];
  const vals = (f.values || f.data || f.series || f.rows || []) as any[];
  const arr = Array.isArray(vals) ? vals : [];
  return arr.map(v => Number(typeof v === 'object' ? v?.value ?? v?.val ?? NaN : v)).filter(n => !isNaN(n));
}
function sum(a: number[]) { return a.reduce((s, x) => s + x, 0); }

interface FinancialData {
  [key: string]: number | undefined;
  revenue?: number;
  expenses?: number;
  investments?: number;
  assets?: number;
  liabilities?: number;
  marketVolatility?: number;
  creditExposure?: number;
  operatingCashFlow?: number;
}

interface FinancialMetrics {
  profitMargin: number;
  returnOnInvestment: number;
  riskScore: number;
  cashFlow: number;
  marketVolatility: number;
  creditRisk: number;
  currentRatio: number;
  debtToEquity: number;
}

interface FinanceDashboardProps {
  data: {
    fields: DataField[];
    metadata?: {
      currency?: string;
      timePeriod?: string;
      [key: string]: any;
    };
  };
}

export function FinanceDashboard({ data }: FinanceDashboardProps) {
  // Calculate all financial metrics
  const calculateMetrics = (input: FinancialData): FinancialMetrics => {
    // Helper function to safely calculate with default fallback
    const safeCalc = (numerator?: number, denominator?: number, fallback = 0) => {
      if (!denominator || isNaN(denominator)) return fallback;
      return ((numerator || 0) / denominator) * 100;
    };

    return {
      profitMargin: safeCalc(
        (input.revenue || 0) - (input.expenses || 0), 
        input.revenue
      ),
      returnOnInvestment: safeCalc(
        (input.revenue || 0) - (input.expenses || 0), 
        input.investments
      ),
      riskScore: Math.min(
        100,
        ((input.marketVolatility || 0) * 0.6 + 
         (input.creditExposure || 0) * 0.4) * 100
      ),
      cashFlow: input.operatingCashFlow || 0,
      marketVolatility: input.marketVolatility || 0,
      creditRisk: input.creditExposure || 0,
      currentRatio: safeCalc(input.assets, input.liabilities, 0),
      debtToEquity: safeCalc(
        input.liabilities, 
        (input.assets || 0) - (input.liabilities || 0), 
        0
      )
    };
  };

  // Build numbers directly from fields
  const qty = numCol(data.fields, ['quantity']);
  const price = numCol(data.fields, ['price']);
  let sales = numCol(data.fields, ['sales']);
  const comp = numCol(data.fields, ['competitorprice', 'cost', 'unitcost']);

  if (sales.length === 0 && qty.length && price.length) {
    const len = Math.min(qty.length, price.length);
    sales = Array.from({ length: len }, (_, i) => qty[i] * price[i]);
  }

  const totalRevenue = sum(sales);
  const totalExpenses = sum(Array.from({ length: Math.min(qty.length, comp.length) }, (_, i) => qty[i] * comp[i]));
  const operatingCashFlow = totalRevenue - totalExpenses;

  // Use COGS as "investment" proxy for ROI (same assumption as Analysis)
  const investments = totalExpenses;

  const metrics = calculateMetrics({
    revenue: totalRevenue,
    expenses: totalExpenses,
    investments,
    marketVolatility: 0,       // not in file
    creditExposure: 0,         // not in file
    operatingCashFlow,
    assets: undefined,
    liabilities: undefined
  } as any);
  const currencySymbol = data.metadata?.currency || '$';

  // Format numbers consistently
  const formatNumber = (value: number, isCurrency = false, decimals = 2) => {
    if (isCurrency) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(value);
    }
    return value.toFixed(decimals) + (value === 0 ? '' : '%');
  };

  // Data quality assessment
  const dataQualityIssues: string[] = [];
  if (!qty.length || !price.length) dataQualityIssues.push('Missing quantity or price columns');
  if (!comp.length) dataQualityIssues.push('Missing competitorPrice/cost column (used as COGS)');
  if (data.fields.length < 3) dataQualityIssues.push('Limited data points may affect accuracy');

  const dataQualityScore = dataQualityIssues.length === 0 ? 100 : Math.max(0, 100 - (dataQualityIssues.length * 20));

  return (
    <div className="space-y-8">
      {/* Data Quality Warning */}
      {dataQualityIssues.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Data Quality Notice</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Your analysis may be affected by:</p>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  {dataQualityIssues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
                {dataQualityScore > 0 && (
                  <p className="mt-2">
                    Data Quality Score: <span className="font-medium">{dataQualityScore}/100</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Financial Metrics */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-semibold text-gray-900">Financial Metrics</h3>
          </div>
          <p className="text-sm text-gray-500">
            Analysis in {currencySymbol}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="metric-card">
            <h3>Profit Margin</h3>
            <p className="metric-value">
              {formatNumber(metrics.profitMargin)}
            </p>
            {totalRevenue === 0 && (
              <p className="data-warning">Revenue data missing</p>
            )}
          </div>

          <div className="metric-card">
            <h3>Return on Investment</h3>
            <p className="metric-value">
              {formatNumber(metrics.returnOnInvestment)}
            </p>
            {investments === 0 && (
              <p className="data-warning">Investment data missing</p>
            )}
          </div>

          <div className="metric-card">
            <h3>Risk Score</h3>
            <p className="metric-value">
              {metrics.riskScore.toFixed(1)}%
            </p>
            <div className="risk-bar">
              <div 
                className="risk-level" 
                style={{ width: `${metrics.riskScore}%` }}
              />
            </div>
          </div>

          <div className="metric-card">
            <h3>Cash Flow</h3>
            <p className="metric-value">
              {formatNumber(metrics.cashFlow, true)}
            </p>
          </div>

          <div className="metric-card">
            <h3>Market Volatility</h3>
            <p className="metric-value">
              {formatNumber(metrics.marketVolatility)}
            </p>
          </div>

          <div className="metric-card">
            <h3>Credit Risk</h3>
            <p className="metric-value">
              {formatNumber(metrics.creditRisk)}
            </p>
          </div>

          <div className="metric-card">
            <h3>Current Ratio</h3>
            <p className="metric-value">
              {formatNumber(metrics.currentRatio)}
            </p>
          </div>

          <div className="metric-card">
            <h3>Debt to Equity</h3>
            <p className="metric-value">
              {formatNumber(metrics.debtToEquity)}
            </p>
          </div>
        </div>

        {totalRevenue === 0 && totalExpenses === 0 && (
          <div className="data-alert">
            ⚠️ No financial data provided. Please upload a data file.
          </div>
        )}
      </div>
    </div>
  );
}