import React, { useState, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
  AreaChart
} from 'recharts';

interface DataField {
  name: string;
  type: string;
}

interface FinancialModelingProps {
  data: {
    fields: DataField[];
  };
}

interface FinancialInputs {
  revenue: number;
  revenueGrowthRate: number;
  cogsPercentage: number;
  operatingExpenses: number;
  opexGrowthRate: number;
  taxRate: number;
  capitalExpenditures: number;
  capexGrowthRate: number;
  workingCapital: number;
  workingCapitalPercentage: number;
  depreciationRate: number;
  projectionYears: number;
  debtToEquityRatio: number;
  interestRate: number;
}

interface ProjectionData {
  year: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMargin: number;
  operatingExpenses: number;
  ebitda: number;
  ebitdaMargin: number;
  depreciation: number;
  ebit: number;
  interestExpense: number;
  ebt: number;
  tax: number;
  netIncome: number;
  netMargin: number;
  totalAssets: number;
  currentAssets: number;
  fixedAssets: number;
  currentLiabilities: number;
  longTermDebt: number;
  totalLiabilities: number;
  equity: number;
  cash: number;
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  netCashFlow: number;
  freeCashFlow: number;
  workingCapital: number;
  roe: number;
  roa: number;
  debtToEquity: number;
  accountsReceivable: number;
  accountsPayable: number;
}

const defaultInputs: FinancialInputs = {
  revenue: 400000,           // $400K starting revenue (4x from $100K)
  revenueGrowthRate: 15,     // 15% growth rate
  cogsPercentage: 55,        // 55% COGS (inventory cost)
  operatingExpenses: 80000,  // $80K operating expenses (4x from $20K)
  opexGrowthRate: 8,         // 8% OpEx growth
  taxRate: 25,               // 25% tax rate
  capitalExpenditures: 30000, // $30K CapEx (4x from $7.5K) - Investment
  capexGrowthRate: 12,       // 12% CapEx growth
  workingCapital: 60000,     // $60K working capital (4x from $15K)
  workingCapitalPercentage: 15, // 15% of revenue
  depreciationRate: 20,      // 20% depreciation rate
  projectionYears: 5,        // 5 year projection
  debtToEquityRatio: 0.3,    // 30% debt-to-equity
  interestRate: 6            // 6% interest rate
};

// Business size presets for different scales
const businessSizePresets = {
  startup: {
    name: "Startup ($200K - $2M)",
    inputs: {
      revenue: 200000,        // $200K starting revenue (4x from $50K)
      revenueGrowthRate: 25,
      cogsPercentage: 60,
      operatingExpenses: 60000, // $60K operating expenses (4x from $15K)
      opexGrowthRate: 15,
      taxRate: 20,
      capitalExpenditures: 20000, // $20K CapEx (4x from $5K)
      capexGrowthRate: 20,
      workingCapital: 40000,  // $40K working capital (4x from $10K)
      workingCapitalPercentage: 20,
      depreciationRate: 25,
      projectionYears: 5,
      debtToEquityRatio: 0.5,
      interestRate: 8
    }
  },
  smallBusiness: {
    name: "Small Business ($400K - $4M)",
    inputs: defaultInputs
  },
  midMarket: {
    name: "Mid-Market ($4M - $40M)",
    inputs: {
      revenue: 4000000,       // $4M starting revenue (4x from $1M)
      revenueGrowthRate: 12,
      cogsPercentage: 50,
      operatingExpenses: 800000, // $800K operating expenses (4x from $200K)
      opexGrowthRate: 6,
      taxRate: 25,
      capitalExpenditures: 300000, // $300K CapEx (4x from $75K)
      capexGrowthRate: 10,
      workingCapital: 600000, // $600K working capital (4x from $150K)
      workingCapitalPercentage: 15,
      depreciationRate: 15,
      projectionYears: 5,
      debtToEquityRatio: 0.3,
      interestRate: 5
    }
  },
  enterprise: {
    name: "Enterprise ($40M+)",
    inputs: {
      revenue: 40000000,      // $40M starting revenue (4x from $10M)
      revenueGrowthRate: 8,
      cogsPercentage: 45,
      operatingExpenses: 8000000, // $8M operating expenses (4x from $2M)
      opexGrowthRate: 4,
      taxRate: 30,
      capitalExpenditures: 3000000, // $3M CapEx (4x from $750K)
      capexGrowthRate: 8,
      workingCapital: 6000000, // $6M working capital (4x from $1.5M)
      workingCapitalPercentage: 15,
      depreciationRate: 10,
      projectionYears: 5,
      debtToEquityRatio: 0.2,
      interestRate: 4
    }
  }
};

export default function FinancialModeling({ data }: FinancialModelingProps) {
  const [inputs, setInputs] = useState<FinancialInputs>(defaultInputs);
  const [activeTab, setActiveTab] = useState<'income' | 'balance' | 'cashflow' | 'ratios'>('income');

  const projections = useMemo(() => {
    const {
      revenue,
      revenueGrowthRate,
      cogsPercentage,
      operatingExpenses,
      opexGrowthRate,
      taxRate,
      capitalExpenditures,
      capexGrowthRate,
      depreciationRate,
      projectionYears,
      debtToEquityRatio,
      interestRate
    } = inputs;

    const projectionData: ProjectionData[] = [];
    let currentRevenue = revenue;
    let currentOpex = operatingExpenses;
    let currentCapex = capitalExpenditures;
    
    // Improved asset tracking
    let totalFixedAssets = capitalExpenditures * 3; // Initial fixed assets
    let accumulatedDepreciation = totalFixedAssets * 0.2; // Assume some existing depreciation
    let cash = revenue * 0.1; // Initial cash (10% of revenue)
    let longTermDebt = 0;
    let equity = totalFixedAssets + cash; // Initial equity

    for (let year = 1; year <= projectionYears; year++) {
      // Income Statement
      const cogs = currentRevenue * (cogsPercentage / 100);
      const grossProfit = currentRevenue - cogs;
      const grossMargin = (grossProfit / currentRevenue) * 100;
      
      const ebitda = grossProfit - currentOpex;
      const ebitdaMargin = (ebitda / currentRevenue) * 100;
      
      // Improved depreciation calculation (straight-line method)
      const depreciation = totalFixedAssets * (depreciationRate / 100);
      accumulatedDepreciation += depreciation;
      
      const ebit = ebitda - depreciation;
      
      // Balance Sheet calculations
      const netFixedAssets = Math.max(0, totalFixedAssets - accumulatedDepreciation);
      
      // Working capital components
      const accountsReceivable = currentRevenue * 0.15; // 15% of revenue as AR
      const inventory = cogs * 0.25; // 25% of COGS as inventory
      const accountsPayable = cogs * 0.3; // 30% of COGS as AP
      const accruedExpenses = currentOpex * 0.2; // 20% of OpEx as accrued
      
      const currentAssets = cash + accountsReceivable + inventory;
      const currentLiabilities = accountsPayable + accruedExpenses;
      const workingCapital = currentAssets - currentLiabilities;
      
      // Total assets and capital structure
      const totalAssets = currentAssets + netFixedAssets;
      
      // Maintain target debt-to-equity ratio
      const targetDebt = totalAssets * (debtToEquityRatio / (1 + debtToEquityRatio));
      const targetEquity = totalAssets - targetDebt;
      
      // Adjust debt and equity based on target ratio
      const debtChange = targetDebt - longTermDebt;
      longTermDebt = targetDebt;
      equity = targetEquity;
      
      // Interest calculation
      const interestExpense = longTermDebt * (interestRate / 100);
      const ebt = ebit - interestExpense;
      const tax = Math.max(0, ebt * (taxRate / 100));
      const netIncome = ebt - tax;
      const netMargin = (netIncome / currentRevenue) * 100;

      // Cash Flow calculations
      const workingCapitalChange = workingCapital - (year > 1 ? projectionData[year-2].workingCapital || 0 : 0);
      const operatingCashFlow = netIncome + depreciation - workingCapitalChange;
      const investingCashFlow = -currentCapex;
      const financingCashFlow = debtChange; // Debt issuance/repayment
      const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;
      const freeCashFlow = operatingCashFlow + investingCashFlow;
      
      // Update cash balance
      cash += netCashFlow;
      
      // Update fixed assets
      totalFixedAssets += currentCapex;

      // Financial Ratios
      const roe = equity > 0 ? (netIncome / equity) * 100 : 0;
      const roa = totalAssets > 0 ? (netIncome / totalAssets) * 100 : 0;
      const debtToEquity = equity > 0 ? longTermDebt / equity : 0;

      projectionData.push({
        year,
        revenue: currentRevenue,
        cogs,
        grossProfit,
        grossMargin,
        operatingExpenses: currentOpex,
        ebitda,
        ebitdaMargin,
        depreciation,
        ebit,
        interestExpense,
        ebt,
        tax,
        netIncome,
        netMargin,
        totalAssets,
        currentAssets,
        fixedAssets: netFixedAssets,
        currentLiabilities,
        longTermDebt,
        totalLiabilities: currentLiabilities + longTermDebt,
        equity,
        cash,
        operatingCashFlow,
        investingCashFlow,
        financingCashFlow,
        netCashFlow,
        freeCashFlow,
        workingCapital,
        roe,
        roa,
        debtToEquity,
        accountsReceivable,
        accountsPayable
      });

      // Update for next year
      currentRevenue *= (1 + revenueGrowthRate / 100);
      currentOpex *= (1 + opexGrowthRate / 100);
      currentCapex *= (1 + capexGrowthRate / 100);
    }

    return projectionData;
  }, [inputs]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setInputs(defaultInputs);
  }, []);

  const selectPreset = useCallback((presetKey: keyof typeof businessSizePresets) => {
    setInputs(businessSizePresets[presetKey].inputs);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const inputSections = [
    {
      title: "Revenue & Growth",
      fields: [
        { key: 'revenue', label: 'Initial Revenue', type: 'number' },
        { key: 'revenueGrowthRate', label: 'Revenue Growth Rate (%)', type: 'number', step: '0.1' },
        { key: 'cogsPercentage', label: 'COGS Percentage (%)', type: 'number', min: '0', max: '100' }
      ]
    },
    {
      title: "Operating Expenses",
      fields: [
        { key: 'operatingExpenses', label: 'Operating Expenses', type: 'number' },
        { key: 'opexGrowthRate', label: 'OpEx Growth Rate (%)', type: 'number', step: '0.1' }
      ]
    },
    {
      title: "Capital & Depreciation",
      fields: [
        { key: 'capitalExpenditures', label: 'Capital Expenditures', type: 'number' },
        { key: 'capexGrowthRate', label: 'CapEx Growth Rate (%)', type: 'number', step: '0.1' },
        { key: 'depreciationRate', label: 'Depreciation Rate (%)', type: 'number', step: '0.1' }
      ]
    },
    {
      title: "Working Capital & Financing",
      fields: [
        { key: 'workingCapitalPercentage', label: 'Working Capital (% of Revenue)', type: 'number', step: '0.1' },
        { key: 'debtToEquityRatio', label: 'Debt-to-Equity Ratio', type: 'number', step: '0.1' },
        { key: 'interestRate', label: 'Interest Rate (%)', type: 'number', step: '0.1' }
      ]
    },
    {
      title: "Tax & Projections",
      fields: [
        { key: 'taxRate', label: 'Tax Rate (%)', type: 'number', min: '0', max: '100' },
        { key: 'projectionYears', label: 'Projection Years', type: 'number', min: '1', max: '15' }
      ]
    }
  ];

  const tabs = [
    { key: 'income', label: 'Income Statement' },
    { key: 'balance', label: 'Balance Sheet' },
    { key: 'cashflow', label: 'Cash Flow' },
    { key: 'ratios', label: 'Financial Ratios' }
  ];

  return (
    <Card className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Enhanced Financial Modeling</h3>
        <div className="flex gap-2">
          <div className="flex gap-1">
            {Object.entries(businessSizePresets).map(([key, preset]) => (
              <Button
                key={key}
                onClick={() => selectPreset(key as keyof typeof businessSizePresets)}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                {preset.name.split(' ')[0]}
              </Button>
            ))}
          </div>
          <Button onClick={resetToDefaults} variant="outline" className="text-sm">
            Reset
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {inputSections.map((section) => (
          <Card key={section.title} className="p-4">
            <h4 className="font-semibold text-gray-900 mb-3 text-sm">{section.title}</h4>
            <div className="space-y-3">
              {section.fields.map((field) => (
                <div key={field.key}>
                  <Label htmlFor={field.key} className="text-xs text-gray-700">
                    {field.label}
                  </Label>
                  <Input
                    id={field.key}
                    name={field.key}
                    type={field.type}
                    value={inputs[field.key as keyof FinancialInputs]}
                    onChange={handleInputChange}
                    className="text-sm"
                    {...(field.step && { step: field.step })}
                    {...(field.min && { min: field.min })}
                    {...(field.max && { max: field.max })}
                  />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {projections.length > 0 && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2 border-b">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`pb-3 px-4 text-sm font-medium transition-colors ${
                  activeTab === tab.key 
                    ? 'border-b-2 border-blue-500 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'income' && (
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-gray-900">Income Statement Projection</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">COGS</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gross Profit</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">EBITDA</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Income</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Margin</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {projections.map((proj) => (
                      <tr key={proj.year}>
                        <td className="px-4 py-3 text-gray-900 font-medium">{proj.year}</td>
                        <td className="px-4 py-3 text-gray-900">{formatCurrency(proj.revenue)}</td>
                        <td className="px-4 py-3 text-gray-900">{formatCurrency(proj.cogs)}</td>
                        <td className="px-4 py-3 text-gray-900">{formatCurrency(proj.grossProfit)}</td>
                        <td className="px-4 py-3 text-gray-900">{formatCurrency(proj.ebitda)}</td>
                        <td className="px-4 py-3 text-gray-900 font-medium">{formatCurrency(proj.netIncome)}</td>
                        <td className="px-4 py-3 text-gray-900">{formatPercentage(proj.netMargin)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={projections}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), '']} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" />
                    <Line type="monotone" dataKey="netIncome" stroke="#10B981" strokeWidth={3} name="Net Income" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'balance' && (
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-gray-900">Balance Sheet Projection</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Assets</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Assets</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fixed Assets</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Liabilities</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equity</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {projections.map((proj) => (
                      <tr key={proj.year}>
                        <td className="px-4 py-3 text-gray-900 font-medium">{proj.year}</td>
                        <td className="px-4 py-3 text-gray-900">{formatCurrency(proj.totalAssets)}</td>
                        <td className="px-4 py-3 text-gray-900">{formatCurrency(proj.currentAssets)}</td>
                        <td className="px-4 py-3 text-gray-900">{formatCurrency(proj.fixedAssets)}</td>
                        <td className="px-4 py-3 text-gray-900">{formatCurrency(proj.totalLiabilities)}</td>
                        <td className="px-4 py-3 text-gray-900">{formatCurrency(proj.equity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={projections}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), '']} />
                    <Legend />
                    <Area type="monotone" dataKey="totalAssets" stackId="1" stroke="#3B82F6" fill="#3B82F6" name="Total Assets" />
                    <Area type="monotone" dataKey="totalLiabilities" stackId="2" stroke="#F59E0B" fill="#F59E0B" name="Total Liabilities" />
                    <Area type="monotone" dataKey="equity" stackId="2" stroke="#10B981" fill="#10B981" name="Equity" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'cashflow' && (
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-gray-900">Cash Flow Projection</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operating CF</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Investing CF</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Financing CF</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net CF</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Free CF</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {projections.map((proj) => (
                      <tr key={proj.year}>
                        <td className="px-4 py-3 text-gray-900 font-medium">{proj.year}</td>
                        <td className="px-4 py-3 text-gray-900">{formatCurrency(proj.operatingCashFlow)}</td>
                        <td className="px-4 py-3 text-red-600">{formatCurrency(proj.investingCashFlow)}</td>
                        <td className="px-4 py-3 text-gray-900">{formatCurrency(proj.financingCashFlow)}</td>
                        <td className="px-4 py-3 text-gray-900 font-medium">{formatCurrency(proj.netCashFlow)}</td>
                        <td className="px-4 py-3 text-gray-900 font-medium">{formatCurrency(proj.freeCashFlow)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={projections}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), '']} />
                    <Legend />
                    <Line type="monotone" dataKey="operatingCashFlow" stroke="#3B82F6" strokeWidth={2} name="Operating CF" />
                    <Line type="monotone" dataKey="freeCashFlow" stroke="#10B981" strokeWidth={2} name="Free CF" />
                    <Line type="monotone" dataKey="netCashFlow" stroke="#F59E0B" strokeWidth={2} name="Net CF" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'ratios' && (
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-gray-900">Financial Ratios</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gross Margin</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">EBITDA Margin</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Margin</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ROE</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ROA</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">D/E Ratio</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {projections.map((proj) => (
                      <tr key={proj.year}>
                        <td className="px-4 py-3 text-gray-900 font-medium">{proj.year}</td>
                        <td className="px-4 py-3 text-gray-900">{formatPercentage(proj.grossMargin)}</td>
                        <td className="px-4 py-3 text-gray-900">{formatPercentage(proj.ebitdaMargin)}</td>
                        <td className="px-4 py-3 text-gray-900">{formatPercentage(proj.netMargin)}</td>
                        <td className="px-4 py-3 text-gray-900">{formatPercentage(proj.roe)}</td>
                        <td className="px-4 py-3 text-gray-900">{formatPercentage(proj.roa)}</td>
                        <td className="px-4 py-3 text-gray-900">{proj.debtToEquity.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-80">
                  <h5 className="text-md font-medium text-gray-900 mb-2">Profitability Margins</h5>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={projections}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip formatter={(value) => [formatPercentage(Number(value)), '']} />
                      <Legend />
                      <Line type="monotone" dataKey="grossMargin" stroke="#3B82F6" name="Gross Margin" />
                      <Line type="monotone" dataKey="ebitdaMargin" stroke="#F59E0B" name="EBITDA Margin" />
                      <Line type="monotone" dataKey="netMargin" stroke="#10B981" name="Net Margin" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="h-80">
                  <h5 className="text-md font-medium text-gray-900 mb-2">Return Ratios</h5>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={projections}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip formatter={(value) => [formatPercentage(Number(value)), '']} />
                      <Legend />
                      <Line type="monotone" dataKey="roe" stroke="#8B5CF6" name="ROE" />
                      <Line type="monotone" dataKey="roa" stroke="#EF4444" name="ROA" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>Model Summary:</strong> Analyzing {data.fields.length} data fields with {projections.length} year projections. 
          Current scale: <strong>{formatCurrency(inputs.revenue)}</strong> initial revenue with <strong>{inputs.revenueGrowthRate}%</strong> annual growth.
          This enhanced model includes comprehensive financial statements, key ratios, and dynamic growth assumptions.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 text-xs">
          <div className="bg-white p-3 rounded border">
            <strong>Investment (CapEx):</strong> {formatCurrency(inputs.capitalExpenditures)}
          </div>
          <div className="bg-white p-3 rounded border">
            <strong>Return (Revenue):</strong> {formatCurrency(inputs.revenue)}
          </div>
          <div className="bg-white p-3 rounded border">
            <strong>Inventory Cost (COGS):</strong> {formatCurrency(inputs.revenue * (inputs.cogsPercentage / 100))}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          💡 <strong>Tip:</strong> Use the preset buttons above to quickly switch between different business scales (Startup, Small Business, Mid-Market, Enterprise).
        </p>
      </div>
    </Card>
  );
} 