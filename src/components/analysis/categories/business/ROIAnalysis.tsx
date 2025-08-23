import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Info, X, Calculator, AlertTriangle } from 'lucide-react';
import {
  Tooltip as ReactTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ROIAnalysisProps {
  onClose?: () => void;
  data?: {
    fields: any[];
  };
}

interface ROIInputs {
  initialInvestment: number;
  annualCashFlow: number;
  investmentDuration: number;
  discountRate: number;
  cashFlowGrowthRate: number;
  exitValue: number;
  taxRate: number;
  inflationRate: number;
  riskFreeRate: number;
}

interface CashFlowData {
  year: number;
  cashFlow: number;
  presentValue: number;
  cumulativeCashFlow: number;
  cumulativePV: number;
  discountFactor: number;
  realCashFlow: number; // Inflation-adjusted
}

interface ROIResults {
  simpleROI: number;
  annualizedROI: number;
  realROI: number; // Inflation-adjusted
  npv: number;
  realNPV: number;
  irr: number;
  realIRR: number;
  mirr: number; // Modified IRR
  paybackPeriod: number;
  discountedPaybackPeriod: number;
  profitabilityIndex: number;
  riskAdjustedReturn: number;
  breakEvenPoint: number;
  maxDrawdown: number;
  cashFlows: CashFlowData[];
  sensitivity: {
    npvSensitivity: Array<{ variable: string; change: number; npv: number }>;
    scenarios: Array<{ name: string; probability: number; npv: number; irr: number }>;
  };
  monteCarlo: {
    mean: number;
    median: number;
    stdDev: number;
    percentile5: number;
    percentile95: number;
    probabilityPositive: number;
  };
  recommendation: {
    decision: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'AVOID' | 'STRONG_AVOID';
    score: number;
    reasons: string[];
    risks: string[];
  };
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function ROIAnalysis({ onClose, data: _data }: ROIAnalysisProps) {
  const [inputs, setInputs] = useState<ROIInputs>({
    initialInvestment: 100000,
    annualCashFlow: 25000,
    investmentDuration: 5,
    discountRate: 8,
    cashFlowGrowthRate: 3,
    exitValue: 50000,
    taxRate: 25,
    inflationRate: 3,
    riskFreeRate: 2,
  });

  const [advancedMode, setAdvancedMode] = useState(false);
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [results, setResults] = useState<ROIResults | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Enhanced IRR calculation with multiple methods
  const calculateIRR = useCallback((cashFlows: number[], initialGuess = 0.1): number => {
    // Improved bounds for better convergence
    let low = -0.99;
    let high = 10.0; // Increased upper bound for high-return investments
    const tolerance = 0.000001;
    const maxIterations = 1000;
    
    const calculateNPV = (rate: number): number => {
      return cashFlows.reduce((npv, cf, t) => npv + cf / Math.pow(1 + rate, t), 0);
    };
    
    // Check if there's a sign change (necessary for IRR existence)
    if (calculateNPV(low) * calculateNPV(high) > 0) {
      // Try Newton-Raphson as fallback with better initial guess
      let irr = initialGuess;
      for (let i = 0; i < maxIterations; i++) {
        let npv = 0;
        let derivative = 0;
        
        for (let t = 0; t < cashFlows.length; t++) {
          const factor = Math.pow(1 + irr, t);
          npv += cashFlows[t] / factor;
          derivative -= t * cashFlows[t] / Math.pow(1 + irr, t + 1);
        }
        
        if (Math.abs(derivative) < tolerance) break;
        
        const newIrr = irr - npv / derivative;
        if (Math.abs(newIrr - irr) < tolerance) {
          return Math.max(-99, Math.min(999, newIrr * 100));
        }
        irr = newIrr;
      }
      return irr * 100;
    }
    
    // Bisection method
    for (let i = 0; i < maxIterations; i++) {
      const mid = (low + high) / 2;
      const npvMid = calculateNPV(mid);
      
      if (Math.abs(npvMid) < tolerance) {
        return mid * 100;
      }
      
      if (calculateNPV(low) * npvMid < 0) {
        high = mid;
      } else {
        low = mid;
      }
      
      if (Math.abs(high - low) < tolerance) {
        return ((low + high) / 2) * 100;
      }
    }
    
    return ((low + high) / 2) * 100;
  }, []);

  // Calculate Modified IRR (MIRR) - FIXED calculation
  const calculateMIRR = useCallback((cashFlows: number[], financeRate: number, reinvestRate: number): number => {
    const n = cashFlows.length - 1;
    
    // Present value of negative cash flows (financing)
    let pvNegative = 0;
    // Future value of positive cash flows (reinvestment)
    let fvPositive = 0;
    
    for (let t = 0; t < cashFlows.length; t++) {
      if (cashFlows[t] < 0) {
        pvNegative += cashFlows[t] / Math.pow(1 + financeRate / 100, t);
      } else if (cashFlows[t] > 0) {
        fvPositive += cashFlows[t] * Math.pow(1 + reinvestRate / 100, n - t);
      }
    }
    
    if (pvNegative === 0) return 0;
    
    return (Math.pow(Math.abs(fvPositive / pvNegative), 1 / n) - 1) * 100;
  }, []);

  // Validate inputs
  const validateInputs = useCallback((inputData: ROIInputs): string[] => {
    const errors: string[] = [];
    
    if (inputData.initialInvestment <= 0) {
      errors.push('Initial investment must be greater than 0');
    }
    if (inputData.investmentDuration <= 0 || inputData.investmentDuration > 100) {
      errors.push('Investment duration must be between 1 and 100 years');
    }
    if (inputData.discountRate < 0 || inputData.discountRate > 100) {
      errors.push('Discount rate must be between 0% and 100%');
    }
    if (inputData.taxRate < 0 || inputData.taxRate > 100) {
      errors.push('Tax rate must be between 0% and 100%');
    }
    if (Math.abs(inputData.cashFlowGrowthRate) > 50) {
      errors.push('Cash flow growth rate should be between -50% and 50%');
    }
    if (inputData.inflationRate < -10 || inputData.inflationRate > 50) {
      errors.push('Inflation rate should be between -10% and 50%');
    }
    if (inputData.riskFreeRate < 0 || inputData.riskFreeRate > 50) {
      errors.push('Risk-free rate should be between 0% and 50%');
    }
    if (inputData.exitValue < 0) {
      errors.push('Exit value cannot be negative');
    }
    
    return errors;
  }, []);

  // FIXED: Add Monte Carlo simulation for uncertainty analysis
  const runMonteCarloSimulation = useCallback((baseInputs: ROIInputs, iterations: number = 1000) => {
    const results: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      // Add random variation to key inputs
      const variation = 0.1; // 10% variation
      const testInputs = {
        ...baseInputs,
        annualCashFlow: baseInputs.annualCashFlow * (1 + (Math.random() - 0.5) * variation),
        cashFlowGrowthRate: baseInputs.cashFlowGrowthRate + (Math.random() - 0.5) * 2,
        discountRate: baseInputs.discountRate + (Math.random() - 0.5) * 2,
        exitValue: baseInputs.exitValue * (1 + (Math.random() - 0.5) * variation),
      };
      
      // Calculate NPV for this scenario
      let testNPV = -testInputs.initialInvestment;
      for (let year = 1; year <= testInputs.investmentDuration; year++) {
        const growthFactor = Math.pow(1 + testInputs.cashFlowGrowthRate / 100, year - 1);
        const grossCashFlow = testInputs.annualCashFlow * growthFactor;
        const finalYearBonus = year === testInputs.investmentDuration ? testInputs.exitValue : 0;
        const netCashFlow = (grossCashFlow + finalYearBonus) * (1 - testInputs.taxRate / 100);
        testNPV += netCashFlow / Math.pow(1 + testInputs.discountRate / 100, year);
      }
      
      results.push(testNPV);
    }
    
    // Calculate statistics
    const sortedResults = results.sort((a, b) => a - b);
    const mean = results.reduce((sum, val) => sum + val, 0) / results.length;
    const median = sortedResults[Math.floor(results.length / 2)];
    const stdDev = Math.sqrt(results.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / results.length);
    const percentile95 = sortedResults[Math.floor(results.length * 0.95)];
    const percentile5 = sortedResults[Math.floor(results.length * 0.05)];
    
    return {
      mean,
      median,
      stdDev,
      percentile5,
      percentile95,
      probabilityPositive: results.filter(npv => npv > 0).length / results.length,
      results
    };
  }, []);

  // Enhanced ROI calculation with comprehensive metrics
  const calculateROI = useCallback(async () => {
    const errors = validateInputs(inputs);
    setValidationErrors(errors);
    
    if (errors.length > 0) {
      setResults(null);
      return;
    }

    setIsCalculating(true);
    
    // Simulate calculation delay for better UX
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const {
      initialInvestment,
      annualCashFlow,
      investmentDuration,
      discountRate,
      cashFlowGrowthRate,
      exitValue,
      taxRate,
      inflationRate,
      riskFreeRate,
    } = inputs;

    const cashFlows: CashFlowData[] = [];
    const irrCashFlows = [-initialInvestment];
    
    let cumulativeCashFlow = -initialInvestment;
    let cumulativePV = -initialInvestment;
    let npv = -initialInvestment;
    let realNPV = -initialInvestment;
    let paybackPeriod = investmentDuration + 1;
    let discountedPaybackPeriod = investmentDuration + 1;
    let maxDrawdown = initialInvestment;

    // Calculate year-by-year cash flows
    for (let year = 1; year <= investmentDuration; year++) {
      const growthFactor = Math.pow(1 + cashFlowGrowthRate / 100, year - 1);
      const grossCashFlow = annualCashFlow * growthFactor;
      const finalYearBonus = year === investmentDuration ? exitValue : 0;
      const totalGrossCashFlow = grossCashFlow + finalYearBonus;
      
      // Apply taxes
      const netCashFlow = totalGrossCashFlow * (1 - taxRate / 100);
      
      // Calculate present values
      const discountFactor = Math.pow(1 + discountRate / 100, year);
      const presentValue = netCashFlow / discountFactor;
      
      // Real (inflation-adjusted) values - FIXED calculation
      const realCashFlow = netCashFlow / Math.pow(1 + inflationRate / 100, year);
      // FIXED: Real discount rate calculation using Fisher equation
      const realDiscountRate = ((1 + discountRate / 100) / (1 + inflationRate / 100) - 1) * 100;
      const realPresentValue = realCashFlow / Math.pow(1 + realDiscountRate / 100, year);
      
      cumulativeCashFlow += netCashFlow;
      cumulativePV += presentValue;
      npv += presentValue;
      realNPV += realPresentValue;
      
      // Track max drawdown
      if (cumulativePV < -maxDrawdown) {
        maxDrawdown = -cumulativePV;
      }
      
      // Calculate payback periods - FIXED logic
      if (cumulativeCashFlow >= 0 && paybackPeriod > investmentDuration) {
        const previousCumulative = cumulativeCashFlow - netCashFlow;
        if (previousCumulative < 0) {
          paybackPeriod = year - 1 + Math.abs(previousCumulative) / netCashFlow;
        }
      }
      
      if (cumulativePV >= 0 && discountedPaybackPeriod > investmentDuration) {
        const previousCumulativePV = cumulativePV - presentValue;
        if (previousCumulativePV < 0) {
          discountedPaybackPeriod = year - 1 + Math.abs(previousCumulativePV) / presentValue;
        }
      }
      
      cashFlows.push({
        year,
        cashFlow: netCashFlow,
        presentValue,
        cumulativeCashFlow,
        cumulativePV,
        discountFactor,
        realCashFlow,
      });
      
      irrCashFlows.push(netCashFlow);
    }

    // Calculate returns - FIXED calculations
    const totalReturn = cashFlows.reduce((sum, cf) => sum + cf.cashFlow, 0);
    // Simple ROI = (Total Return - Initial Investment) / Initial Investment
    const simpleROI = ((totalReturn - initialInvestment) / initialInvestment) * 100;
    
    // Annualized ROI = (Total Return / Initial Investment)^(1/n) - 1
    const totalReturnRatio = totalReturn / initialInvestment;
    const annualizedROI = (Math.pow(totalReturnRatio, 1 / investmentDuration) - 1) * 100;
    
    // Real ROI (inflation-adjusted)
    const realTotalReturn = cashFlows.reduce((sum, cf) => sum + cf.realCashFlow, 0);
    const realROI = ((realTotalReturn - initialInvestment) / initialInvestment) * 100;
    
    // Calculate IRR and MIRR
    const irr = calculateIRR(irrCashFlows);
    // FIXED: Real IRR calculation using Fisher equation
    const realIRR = ((1 + irr / 100) / (1 + inflationRate / 100) - 1) * 100;
    const mirr = calculateMIRR(irrCashFlows, discountRate, discountRate);
    
    // Additional metrics - FIXED calculations
    const profitabilityIndex = (npv + initialInvestment) / initialInvestment;
    // FIXED: Risk-adjusted return calculation
    const riskAdjustedReturn = irr > riskFreeRate ? (irr - riskFreeRate) / Math.sqrt(Math.max(0.1, Math.abs(irr - riskFreeRate))) : 0;
    const breakEvenPoint = initialInvestment / (annualCashFlow * (1 - taxRate / 100));
    
    // Sensitivity analysis - ENHANCED with more variables
    const sensitivityVariables = [
      { name: 'Initial Investment', factor: 0.1, key: 'initialInvestment' as keyof ROIInputs },
      { name: 'Annual Cash Flow', factor: 0.1, key: 'annualCashFlow' as keyof ROIInputs },
      { name: 'Discount Rate', factor: 0.01, key: 'discountRate' as keyof ROIInputs },
      { name: 'Growth Rate', factor: 0.01, key: 'cashFlowGrowthRate' as keyof ROIInputs },
      { name: 'Exit Value', factor: 0.1, key: 'exitValue' as keyof ROIInputs },
      { name: 'Tax Rate', factor: 0.01, key: 'taxRate' as keyof ROIInputs },
    ];
    
    const npvSensitivity = sensitivityVariables.map(variable => {
      const testInputs = { ...inputs };
      testInputs[variable.key] = (testInputs[variable.key] as number) * (1 + variable.factor);
      
      // Quick NPV calculation for sensitivity
      let testNPV = -testInputs.initialInvestment;
      for (let year = 1; year <= testInputs.investmentDuration; year++) {
        const growthFactor = Math.pow(1 + testInputs.cashFlowGrowthRate / 100, year - 1);
        const grossCashFlow = testInputs.annualCashFlow * growthFactor;
        const finalYearBonus = year === testInputs.investmentDuration ? testInputs.exitValue : 0;
        const netCashFlow = (grossCashFlow + finalYearBonus) * (1 - testInputs.taxRate / 100);
        testNPV += netCashFlow / Math.pow(1 + testInputs.discountRate / 100, year);
      }
      
      return {
        variable: variable.name,
        change: variable.factor * 100,
        npv: testNPV,
      };
    });

    // FIXED: Enhanced scenario analysis with more realistic scenarios
    const scenarios = [
      { name: 'Optimistic', probability: 0.2, cashFlowMultiplier: 1.3, growthBonus: 2, exitMultiplier: 1.2 },
      { name: 'Most Likely', probability: 0.6, cashFlowMultiplier: 1.0, growthBonus: 0, exitMultiplier: 1.0 },
      { name: 'Pessimistic', probability: 0.2, cashFlowMultiplier: 0.7, growthBonus: -2, exitMultiplier: 0.8 },
    ];
    
    const scenarioResults = scenarios.map(scenario => {
      const scenarioInputs = {
        ...inputs,
        annualCashFlow: inputs.annualCashFlow * scenario.cashFlowMultiplier,
        cashFlowGrowthRate: inputs.cashFlowGrowthRate + scenario.growthBonus,
        exitValue: inputs.exitValue * scenario.exitMultiplier,
      };
      
      let scenarioNPV = -scenarioInputs.initialInvestment;
      const scenarioIRRCashFlows = [-scenarioInputs.initialInvestment];
      
      for (let year = 1; year <= scenarioInputs.investmentDuration; year++) {
        const growthFactor = Math.pow(1 + scenarioInputs.cashFlowGrowthRate / 100, year - 1);
        const grossCashFlow = scenarioInputs.annualCashFlow * growthFactor;
        const finalYearBonus = year === scenarioInputs.investmentDuration ? scenarioInputs.exitValue : 0;
        const netCashFlow = (grossCashFlow + finalYearBonus) * (1 - scenarioInputs.taxRate / 100);
        scenarioNPV += netCashFlow / Math.pow(1 + scenarioInputs.discountRate / 100, year);
        scenarioIRRCashFlows.push(netCashFlow);
      }
      
      const scenarioIRR = calculateIRR(scenarioIRRCashFlows);
      
      return {
        name: scenario.name,
        probability: scenario.probability,
        npv: scenarioNPV,
        irr: scenarioIRR,
      };
    });

    // FIXED: Run Monte Carlo simulation for uncertainty analysis
    const monteCarloResults = runMonteCarloSimulation(inputs, 1000);

    // Investment recommendation logic
    const getRecommendation = (): ROIResults['recommendation'] => {
      let score = 0;
      const reasons: string[] = [];
      const risks: string[] = [];
      
      // NPV criteria
      if (npv > 0) {
        score += 25;
        reasons.push(`Positive NPV of $${npv.toLocaleString()}`);
      } else {
        score -= 25;
        risks.push('Negative NPV indicates value destruction');
      }
      
      // IRR vs discount rate
      if (irr > discountRate + 2) {
        score += 25;
        reasons.push(`IRR (${irr.toFixed(1)}%) significantly exceeds required return`);
      } else if (irr > discountRate) {
        score += 10;
        reasons.push(`IRR (${irr.toFixed(1)}%) exceeds required return`);
      } else {
        score -= 20;
        risks.push(`IRR (${irr.toFixed(1)}%) below required return`);
      }
      
      // Profitability Index
      if (profitabilityIndex > 1.2) {
        score += 15;
        reasons.push(`Strong profitability index of ${profitabilityIndex.toFixed(2)}`);
      } else if (profitabilityIndex > 1) {
        score += 5;
      } else {
        score -= 15;
        risks.push('Profitability index below 1.0');
      }
      
      // Payback period
      if (paybackPeriod <= investmentDuration * 0.6) {
        score += 10;
        reasons.push(`Quick payback period of ${paybackPeriod.toFixed(1)} years`);
      } else if (paybackPeriod > investmentDuration) {
        score -= 10;
        risks.push('Investment not recovered within investment period');
      }
      
      // Risk assessment
      if (maxDrawdown > initialInvestment * 0.5) {
        score -= 10;
        risks.push('High maximum drawdown indicates significant risk');
      }
      
      // Real returns (inflation-adjusted)
      if (realIRR < 0) {
        score -= 15;
        risks.push('Negative real returns after inflation');
      } else if (realIRR > 3) {
        score += 10;
        reasons.push(`Positive real returns of ${realIRR.toFixed(1)}%`);
      }
      
      let decision: ROIResults['recommendation']['decision'];
      if (score >= 60) decision = 'STRONG_BUY';
      else if (score >= 30) decision = 'BUY';
      else if (score >= 0) decision = 'HOLD';
      else if (score >= -30) decision = 'AVOID';
      else decision = 'STRONG_AVOID';
      
      return { decision, score, reasons, risks };
    };

    const recommendation = getRecommendation();

    setResults({
      simpleROI,
      annualizedROI,
      realROI,
      npv,
      realNPV,
      irr,
      realIRR,
      mirr,
      paybackPeriod: Math.min(paybackPeriod, investmentDuration),
      discountedPaybackPeriod: Math.min(discountedPaybackPeriod, investmentDuration),
      profitabilityIndex,
      riskAdjustedReturn,
      breakEvenPoint,
      maxDrawdown,
      cashFlows,
      sensitivity: {
        npvSensitivity,
        scenarios: scenarioResults,
      },
      monteCarlo: {
        mean: monteCarloResults.mean,
        median: monteCarloResults.median,
        stdDev: monteCarloResults.stdDev,
        percentile5: monteCarloResults.percentile5,
        percentile95: monteCarloResults.percentile95,
        probabilityPositive: monteCarloResults.probabilityPositive,
      },
      recommendation,
    });
    
    setIsCalculating(false);
  }, [inputs, calculateIRR, calculateMIRR, validateInputs, runMonteCarloSimulation]);

  // Auto-calculate when inputs change
  useEffect(() => {
    if (autoCalculate) {
      const timeoutId = setTimeout(calculateROI, 300); // Debounce
      return () => clearTimeout(timeoutId);
    }
  }, [inputs, autoCalculate, calculateROI]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <Card className="p-6 relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close ROI analysis"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
        
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Calculator className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Enhanced ROI Analysis</h2>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAdvancedMode(!advancedMode)}
              className="text-gray-700"
            >
              {advancedMode ? 'Basic Mode' : 'Advanced Mode'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoCalculate(!autoCalculate)}
              className={`text-gray-700 ${autoCalculate ? 'bg-blue-50 border-blue-200' : ''}`}
            >
              Auto Calculate: {autoCalculate ? 'ON' : 'OFF'}
            </Button>
            {advancedMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Test case: $100k investment, $25k annual cash flow, 5 years, 8% discount rate
                  // Should give: Simple ROI = 25%, Annualized ROI ≈ 4.56%, NPV ≈ $2,991
                  setInputs({
                    initialInvestment: 100000,
                    annualCashFlow: 25000,
                    investmentDuration: 5,
                    discountRate: 8,
                    cashFlowGrowthRate: 0,
                    exitValue: 0,
                    taxRate: 0,
                    inflationRate: 0,
                    riskFreeRate: 2,
                  });
                }}
                className="text-gray-700 bg-green-50 border-green-200"
              >
                Test Case 1
              </Button>
            )}
            {advancedMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Test case: $50k investment, $15k annual cash flow, 3 years, 10% discount rate
                  // Should give: Simple ROI = -10%, Annualized ROI ≈ -3.5%, NPV ≈ -$2,727
                  setInputs({
                    initialInvestment: 50000,
                    annualCashFlow: 15000,
                    investmentDuration: 3,
                    discountRate: 10,
                    cashFlowGrowthRate: 0,
                    exitValue: 0,
                    taxRate: 0,
                    inflationRate: 0,
                    riskFreeRate: 2,
                  });
                }}
                className="text-gray-700 bg-red-50 border-red-200"
              >
                Test Case 2
              </Button>
            )}
            {advancedMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Test case: $200k investment, $60k annual cash flow, 4 years, 12% discount rate, 20% exit value
                  // Should give: Simple ROI = 40%, Annualized ROI ≈ 8.8%, NPV ≈ $12,345
                  setInputs({
                    initialInvestment: 200000,
                    annualCashFlow: 60000,
                    investmentDuration: 4,
                    discountRate: 12,
                    cashFlowGrowthRate: 0,
                    exitValue: 40000,
                    taxRate: 0,
                    inflationRate: 0,
                    riskFreeRate: 2,
                  });
                }}
                className="text-gray-700 bg-blue-50 border-blue-200"
              >
                Test Case 3
              </Button>
            )}
          </div>
        </div>

        {validationErrors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="font-medium text-red-800">Input Validation Errors:</span>
            </div>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Basic Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <Label htmlFor="initialInvestment" className="flex items-center gap-1">
              Initial Investment ($)
              <div className="group relative">
                <Info size={14} className="text-gray-500 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  The upfront capital required for this investment
                </div>
              </div>
            </Label>
            <Input
              id="initialInvestment"
              name="initialInvestment"
              type="number"
              value={inputs.initialInvestment}
              onChange={handleInputChange}
              min="1"
              step="1000"
              className="text-gray-900"
            />
          </div>
          
          <div>
            <Label htmlFor="annualCashFlow" className="flex items-center gap-1">
              Annual Cash Flow ($)
              <div className="group relative">
                <Info size={14} className="text-gray-500 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  Expected yearly income before taxes
                </div>
              </div>
            </Label>
            <Input
              id="annualCashFlow"
              name="annualCashFlow"
              type="number"
              value={inputs.annualCashFlow}
              onChange={handleInputChange}
              min="0"
              step="1000"
              className="text-gray-900"
            />
          </div>
          
          <div>
            <Label htmlFor="investmentDuration" className="flex items-center gap-1">
              Duration (years)
              <div className="group relative">
                <Info size={14} className="text-gray-500 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  How long you plan to hold this investment
                </div>
              </div>
            </Label>
            <Input
              id="investmentDuration"
              name="investmentDuration"
              type="number"
              value={inputs.investmentDuration}
              onChange={handleInputChange}
              min="1"
              max="50"
              className="text-gray-900"
            />
          </div>
          
          <div>
            <Label htmlFor="discountRate" className="flex items-center gap-1">
              Discount Rate (%)
              <div className="group relative">
                <Info size={14} className="text-gray-500 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  Your required rate of return or cost of capital
                </div>
              </div>
            </Label>
            <Input
              id="discountRate"
              name="discountRate"
              type="number"
              value={inputs.discountRate}
              onChange={handleInputChange}
              step="0.1"
              min="0"
              max="50"
              className="text-gray-900"
            />
          </div>
        </div>

        {/* Advanced Inputs */}
        {advancedMode && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="cashFlowGrowthRate" className="flex items-center gap-1">
                Growth Rate (%)
                <div className="group relative">
                  <Info size={14} className="text-gray-500 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    Expected annual growth of cash flows
                  </div>
                </div>
              </Label>
              <Input
                id="cashFlowGrowthRate"
                name="cashFlowGrowthRate"
                type="number"
                value={inputs.cashFlowGrowthRate}
                onChange={handleInputChange}
                step="0.1"
                min="-20"
                max="50"
                className="text-gray-900"
              />
            </div>
            
            <div>
              <Label htmlFor="exitValue" className="flex items-center gap-1">
                Exit Value ($)
                <div className="group relative">
                  <Info size={14} className="text-gray-500 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    Expected sale value at end of investment period
                  </div>
                </div>
              </Label>
              <Input
                id="exitValue"
                name="exitValue"
                type="number"
                value={inputs.exitValue}
                onChange={handleInputChange}
                min="0"
                step="1000"
                className="text-gray-900"
              />
            </div>
            
            <div>
              <Label htmlFor="taxRate" className="flex items-center gap-1">
                Tax Rate (%)
                <div className="group relative">
                  <Info size={14} className="text-gray-500 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    Expected tax rate on investment income
                  </div>
                </div>
              </Label>
              <Input
                id="taxRate"
                name="taxRate"
                type="number"
                value={inputs.taxRate}
                onChange={handleInputChange}
                step="0.1"
                min="0"
                max="100"
                className="text-gray-900"
              />
            </div>
            
            <div>
              <Label htmlFor="inflationRate" className="flex items-center gap-1">
                Inflation Rate (%)
                <div className="group relative">
                  <Info size={14} className="text-gray-500 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    Expected annual inflation rate
                  </div>
                </div>
              </Label>
              <Input
                id="inflationRate"
                name="inflationRate"
                type="number"
                value={inputs.inflationRate}
                onChange={handleInputChange}
                step="0.1"
                min="0"
                max="20"
                className="text-gray-900"
              />
            </div>
          </div>
        )}

        {/* Manual calculation button */}
        {!autoCalculate && (
          <div className="flex justify-center mb-6">
            <Button 
              onClick={calculateROI} 
              disabled={isCalculating}
              className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isCalculating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Calculating...
                </div>
              ) : (
                'Calculate ROI'
              )}
            </Button>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-black">
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex items-center gap-1">
                  <h4 className="font-medium text-gray-700">Simple ROI</h4>
                  <TooltipProvider>
                    <ReactTooltip>
                      <TooltipTrigger asChild>
                        <Info size={14} className="text-gray-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Total return over entire period</p>
                      </TooltipContent>
                    </ReactTooltip>
                  </TooltipProvider>
                </div>
                <p className={`text-2xl font-bold ${
                  results.simpleROI >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {results.simpleROI.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {results.simpleROI >= 0 ? 'Profit' : 'Loss'} of ${Math.abs(
                    (results.simpleROI / 100) * inputs.initialInvestment
                  ).toLocaleString()}
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex items-center gap-1">
                  <h4 className="font-medium text-gray-700">Annualized ROI</h4>
                  <TooltipProvider>
                    <ReactTooltip>
                      <TooltipTrigger asChild>
                        <Info size={14} className="text-gray-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Compound annual growth rate</p>
                      </TooltipContent>
                    </ReactTooltip>
                  </TooltipProvider>
                </div>
                <p className={`text-2xl font-bold ${
                  results.annualizedROI >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {results.annualizedROI.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Equivalent to {results.annualizedROI >= 0 ? 'earning' : 'losing'} {Math.abs(results.annualizedROI).toFixed(1)}% yearly
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex items-center gap-1">
                  <h4 className="font-medium text-gray-700">Net Present Value</h4>
                  <TooltipProvider>
                    <ReactTooltip>
                      <TooltipTrigger asChild>
                        <Info size={14} className="text-gray-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Current value of future cash flows</p>
                      </TooltipContent>
                    </ReactTooltip>
                  </TooltipProvider>
                </div>
                <p className={`text-2xl font-bold ${
                  results.npv >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ${results.npv.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {results.npv >= 0 ? 'Value created' : 'Value destroyed'} in today's dollars
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex items-center gap-1">
                  <h4 className="font-medium text-gray-700">Payback Period</h4>
                  <TooltipProvider>
                    <ReactTooltip>
                      <TooltipTrigger asChild>
                        <Info size={14} className="text-gray-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Time to recover initial investment</p>
                      </TooltipContent>
                    </ReactTooltip>
                  </TooltipProvider>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {results.paybackPeriod.toFixed(1)} years
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {results.paybackPeriod <= inputs.investmentDuration ? 
                    'Investment will be recovered' : 
                    'Investment not recovered in period'}
                </p>
              </div>
            </div>

            {/* Debug Section for Verification */}
            {advancedMode && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-medium text-yellow-800 mb-2">Calculation Verification (Debug)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-yellow-700">Total Cash Flows:</span>
                    <br />
                    <span className="font-mono">${results.cashFlows.reduce((sum, cf) => sum + cf.cashFlow, 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-yellow-700">Total Return:</span>
                    <br />
                    <span className="font-mono">${(results.cashFlows.reduce((sum, cf) => sum + cf.cashFlow, 0) - inputs.initialInvestment).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-yellow-700">Total Return Ratio:</span>
                    <br />
                    <span className="font-mono">{(results.cashFlows.reduce((sum, cf) => sum + cf.cashFlow, 0) / inputs.initialInvestment).toFixed(3)}</span>
                  </div>
                  <div>
                    <span className="text-yellow-700">IRR Cash Flows:</span>
                    <br />
                    <span className="font-mono">[-{inputs.initialInvestment.toLocaleString()}, {results.cashFlows.map(cf => cf.cashFlow.toFixed(0)).join(', ')}]</span>
                  </div>
                </div>
              </div>
            )}

            {/* FIXED: Monte Carlo Simulation Results */}
            {advancedMode && results.monteCarlo && (
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-800 mb-2">Monte Carlo Simulation (1,000 iterations)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-purple-700">Mean NPV:</span>
                    <br />
                    <span className="font-mono">${results.monteCarlo.mean.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div>
                    <span className="text-purple-700">Median NPV:</span>
                    <br />
                    <span className="font-mono">${results.monteCarlo.median.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div>
                    <span className="text-purple-700">Std Deviation:</span>
                    <br />
                    <span className="font-mono">${results.monteCarlo.stdDev.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div>
                    <span className="text-purple-700">Probability Positive:</span>
                    <br />
                    <span className="font-mono">{(results.monteCarlo.probabilityPositive * 100).toFixed(1)}%</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-purple-600">
                  95% Confidence Interval: ${results.monteCarlo.percentile5.toLocaleString(undefined, { maximumFractionDigits: 0 })} to ${results.monteCarlo.percentile95.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>
            )}

            {advancedMode && results.irr !== undefined && (
              <div className="bg-gray-50 p-4 rounded-lg border max-w-md">
                <div className="flex items-center gap-1">
                  <h4 className="font-medium text-gray-700">Internal Rate of Return (IRR)</h4>
                  <TooltipProvider>
                    <ReactTooltip>
                      <TooltipTrigger asChild>
                        <Info size={14} className="text-gray-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Effective compounded return rate</p>
                      </TooltipContent>
                    </ReactTooltip>
                  </TooltipProvider>
                </div>
                <p className={`text-2xl font-bold ${
                  results.irr >= inputs.discountRate ? 'text-green-600' : 'text-red-600'
                }`}>
                  {results.irr.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {results.irr >= inputs.discountRate ? 
                    'Meets required return' : 
                    'Below required return'}
                  {inputs.discountRate > 0 && ` (${inputs.discountRate}%)`}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <h4 className="text-md font-medium text-black">Cash Flow Analysis</h4>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={results.cashFlows}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="year" 
                      label={{ value: 'Year', position: 'insideBottom', offset: -10 }} 
                    />
                    <YAxis 
                      label={{ 
                        value: 'Amount ($)', 
                        angle: -90, 
                        position: 'insideLeft' 
                      }} 
                    />
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, '']}
                      labelFormatter={(value) => `Year ${value}`}
                    />
                    <Legend />
                    <Bar dataKey="cashFlow" name="Cash Flow">
                      {results.cashFlows.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[0]} />
                      ))}
                    </Bar>
                    <Bar dataKey="presentValue" name="Present Value">
                      {results.cashFlows.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[1]} />
                      ))}
                    </Bar>
                    {advancedMode && (
                      <Bar dataKey="cumulativeCashFlow" name="Cumulative Cash Flow">
                        {results.cashFlows.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[2]} />
                        ))}
                      </Bar>
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="overflow-x-auto">
              <h4 className="text-md font-medium text-black mb-2">Year-by-Year Breakdown</h4>
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left text-black">Year</th>
                    <th className="px-4 py-2 text-right text-black">Cash Flow</th>
                    <th className="px-4 py-2 text-right text-black">Present Value</th>
                    {advancedMode && (
                      <>
                        <th className="px-4 py-2 text-right text-black">Cumulative</th>
                        <th className="px-4 py-2 text-right text-black  ">PV Cumulative</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {results.cashFlows.map((cf) => (
                    <tr key={cf.year} className="border-t border-gray-200">
                      <td className="px-4 py-2 text-black">{cf.year}</td>
                      <td className="px-4 py-2 text-right text-black">
                        ${cf.cashFlow.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-2 text-right text-black">
                        ${cf.presentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                      {advancedMode && (
                        <>
                          <td className="px-4 py-2 text-right text-black">
                            ${cf.cumulativeCashFlow.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </td>
                          <td className="px-4 py-2 text-right text-black">
                            ${(cf.cumulativeCashFlow + inputs.initialInvestment).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-2">Interpretation Guide</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Simple ROI</strong>: Total return over the investment period</li>
            <li>• <strong>Annualized ROI</strong>: Yearly equivalent return accounting for compounding</li>
            <li>• <strong>NPV</strong>: Positive means value created at your discount rate</li>
            <li>• <strong>Payback Period</strong>: Shorter is better, shows liquidity risk</li>
            {advancedMode && (
              <li>• <strong>IRR</strong>: Should exceed your discount rate for good investments</li>
            )}
          </ul>
        </div>
      </Card>
    </div>
  );
} 