import React, { useMemo, useCallback, useState, useEffect } from "react";
import { DataField } from '@/types/data';
import { performHypothesisTests, performWelchTwoSampleTTest } from '@/utils/analysis/statistics/hypothesis';

// ========== CORE TYPES & INTERFACES ==========

/**
 * Statistical test result with extended metadata from hypothesis tests
 */
export interface TestResult {
  readonly fieldName: string;
  readonly pValue: number;
  readonly statistic: number;
  readonly metadata?: {
    readonly effectSize: number;
    readonly power: number;
    readonly interpretation: string;
    readonly criticalValue: number;
    readonly alpha: number;
    readonly significant: boolean;
    readonly testType: string;
  };
}

/**
 * Two-sample test result for comparing two fields
 */
export interface TwoSampleTestResult {
  readonly testName: string;
  readonly fieldA: string;
  readonly fieldB: string;
  readonly pValue: number;
  readonly statistic: number;
  readonly effectSize: number;
  readonly power: number;
  readonly interpretation: string;
  readonly criticalValue: number;
  readonly alpha: number;
  readonly significant: boolean;
  readonly testType: string;
}

/**
 * Supported hypothesis test types
 */
export const HypothesisTestTypes = {
  T_TEST: 't-test',
  Z_TEST: 'z-test',
  CHI_SQUARE: 'chi-square',
  ANOVA: 'anova',
  MANN_WHITNEY: 'mann-whitney',
  KRUSKAL_WALLIS: 'kruskal-wallis',
  FISHER_EXACT: 'fisher-exact',
  MCNEMAR: 'mcnemar'
} as const;

export type HypothesisTestType = typeof HypothesisTestTypes[keyof typeof HypothesisTestTypes];

/**
 * Hypothesis statement structure
 */
export interface HypothesisStatement {
  readonly null: string;
  readonly alternative: string;
  readonly symbol?: {
    readonly null: string;
    readonly alternative: string;
  };
}

/**
 * Test configuration with extended metadata
 */
export interface TestConfiguration {
  readonly hypothesis: HypothesisStatement;
  readonly fieldLabels: readonly string[];
  readonly description: string;
  readonly assumptions: readonly string[];
  readonly useCase: string;
  readonly minimumSampleSize?: number;
  readonly testType: 'parametric' | 'non-parametric';
}

/**
 * Significance levels enum
 */
export enum SignificanceLevel {
  VERY_HIGH = 0.001,
  HIGH = 0.01,
  STANDARD = 0.05,
  LOW = 0.1
}

/**
 * Test conclusion with detailed interpretation
 */
export interface TestConclusion {
  readonly decision: 'reject' | 'fail-to-reject';
  readonly confidence: number;
  readonly interpretation: string;
  readonly effectSize?: number;
  readonly powerAnalysis?: {
    readonly achievedPower: number;
    readonly requiredSampleSize: number;
  };
}

// ========== TEST CONFIGURATIONS ==========

export const TEST_CONFIGURATIONS: Record<HypothesisTestType, TestConfiguration> = {
  [HypothesisTestTypes.T_TEST]: {
    hypothesis: {
      null: 'The means of two groups are equal',
      alternative: 'The means of two groups are different',
      symbol: { null: 'μ₁ = μ₂', alternative: 'μ₁ ≠ μ₂' }
    },
    fieldLabels: ['Group 1', 'Group 2'],
    description: 'Compares means of two independent samples',
    assumptions: ['Normal distribution', 'Equal variances', 'Independent samples'],
    useCase: 'Comparing average values between two groups',
    minimumSampleSize: 30,
    testType: 'parametric'
  },
  [HypothesisTestTypes.Z_TEST]: {
    hypothesis: {
      null: 'The sample mean equals the population mean',
      alternative: 'The sample mean differs from the population mean',
      symbol: { null: 'μ = μ₀', alternative: 'μ ≠ μ₀' }
    },
    fieldLabels: ['Sample', 'Population'],
    description: 'Tests if sample mean differs from known population mean',
    assumptions: ['Normal distribution', 'Known population variance', 'Large sample size'],
    useCase: 'Testing against a known population parameter',
    minimumSampleSize: 30,
    testType: 'parametric'
  },
  [HypothesisTestTypes.CHI_SQUARE]: {
    hypothesis: {
      null: 'Variables are independent',
      alternative: 'Variables are associated',
      symbol: { null: 'O = E', alternative: 'O ≠ E' }
    },
    fieldLabels: ['Observed', 'Expected'],
    description: 'Tests independence between categorical variables',
    assumptions: ['Expected frequency ≥ 5 in each cell', 'Independent observations'],
    useCase: 'Analyzing relationships between categorical variables',
    minimumSampleSize: 50,
    testType: 'non-parametric'
  },
  [HypothesisTestTypes.ANOVA]: {
    hypothesis: {
      null: 'All group means are equal',
      alternative: 'At least one group mean differs',
      symbol: { null: 'μ₁ = μ₂ = ... = μₖ', alternative: 'μᵢ ≠ μⱼ for some i,j' }
    },
    fieldLabels: ['Group 1', 'Group 2', 'Group 3+'],
    description: 'Compares means across multiple groups',
    assumptions: ['Normal distribution', 'Equal variances', 'Independent samples'],
    useCase: 'Comparing means of three or more groups',
    minimumSampleSize: 20,
    testType: 'parametric'
  },
  [HypothesisTestTypes.MANN_WHITNEY]: {
    hypothesis: {
      null: 'The distributions of two groups are equal',
      alternative: 'The distributions of two groups differ',
      symbol: { null: 'F₁(x) = F₂(x)', alternative: 'F₁(x) ≠ F₂(x)' }
    },
    fieldLabels: ['Group 1', 'Group 2'],
    description: 'Non-parametric alternative to t-test',
    assumptions: ['Independent samples', 'Ordinal or continuous data'],
    useCase: 'Comparing two groups when normality assumption is violated',
    testType: 'non-parametric'
  },
  [HypothesisTestTypes.KRUSKAL_WALLIS]: {
    hypothesis: {
      null: 'All group distributions are equal',
      alternative: 'At least one group distribution differs',
      symbol: { null: 'F₁ = F₂ = ... = Fₖ', alternative: 'Fᵢ ≠ Fⱼ for some i,j' }
    },
    fieldLabels: ['Group 1', 'Group 2', 'Group 3+'],
    description: 'Non-parametric alternative to ANOVA',
    assumptions: ['Independent samples', 'Ordinal or continuous data'],
    useCase: 'Comparing multiple groups without normality assumption',
    testType: 'non-parametric'
  },
  [HypothesisTestTypes.FISHER_EXACT]: {
    hypothesis: {
      null: 'No association between variables',
      alternative: 'Variables are associated',
      symbol: { null: 'OR = 1', alternative: 'OR ≠ 1' }
    },
    fieldLabels: ['Variable 1', 'Variable 2'],
    description: 'Exact test for 2x2 contingency tables',
    assumptions: ['Fixed marginal totals', 'Binary variables'],
    useCase: 'Testing association in small sample sizes',
    testType: 'non-parametric'
  },
  [HypothesisTestTypes.MCNEMAR]: {
    hypothesis: {
      null: 'No change in paired proportions',
      alternative: 'Change in paired proportions exists',
      symbol: { null: 'p₁ = p₂', alternative: 'p₁ ≠ p₂' }
    },
    fieldLabels: ['Before', 'After'],
    description: 'Tests changes in paired binary data',
    assumptions: ['Paired samples', 'Binary outcomes'],
    useCase: 'Analyzing before/after studies with binary outcomes',
    testType: 'non-parametric'
  }
};

// ========== UTILITY FUNCTIONS ==========

/**
 * Calculate test conclusion based on p-value and significance level
 */
export function calculateConclusion(
  pValue: number,
  testType: HypothesisTestType,
  significanceLevel: SignificanceLevel = SignificanceLevel.STANDARD
): TestConclusion {
  const decision = pValue < significanceLevel ? 'reject' : 'fail-to-reject';
  const confidence = 1 - significanceLevel;
  
  const config = TEST_CONFIGURATIONS[testType];
  const interpretation = decision === 'reject'
    ? `There is sufficient evidence to conclude that ${config.hypothesis.alternative.toLowerCase()}.`
    : `There is insufficient evidence to conclude that ${config.hypothesis.alternative.toLowerCase()}.`;

  return {
    decision,
    confidence,
    interpretation
  };
}

/**
 * Calculate effect size for different test types
 */
export function calculateEffectSize(
  testType: HypothesisTestType,
  statistic: number,
  sampleSize: number
): number | undefined {
  switch (testType) {
    case HypothesisTestTypes.T_TEST:
      // Cohen's d approximation
      return Math.abs(statistic) / Math.sqrt(sampleSize);
    case HypothesisTestTypes.CHI_SQUARE:
      // Cramér's V
      return Math.sqrt(statistic / sampleSize);
    case HypothesisTestTypes.ANOVA:
      // Eta squared approximation
      return statistic / (statistic + sampleSize - 1);
    default:
      return undefined;
  }
}

/**
 * Get significance level label
 */
export function getSignificanceLabel(pValue: number): string {
  if (pValue < SignificanceLevel.VERY_HIGH) return '***';
  if (pValue < SignificanceLevel.HIGH) return '**';
  if (pValue < SignificanceLevel.STANDARD) return '*';
  return 'ns';
}

/**
 * Format p-value for display
 */
export function formatPValue(pValue: number): string {
  if (pValue < 0.001) return '< 0.001';
  if (pValue < 0.01) return pValue.toFixed(3);
  return pValue.toFixed(2);
}

/**
 * Map hypothesis test types to performHypothesisTests format
 */
export function mapTestTypeToHypothesisFormat(testType: HypothesisTestType): 'mean' | 'variance' | 'proportion' | 'correlation' {
  switch (testType) {
    case HypothesisTestTypes.T_TEST:
    case HypothesisTestTypes.Z_TEST:
      return 'mean';
    case HypothesisTestTypes.CHI_SQUARE:
      return 'variance';
    case HypothesisTestTypes.ANOVA:
      return 'mean'; // ANOVA is handled differently, using mean as fallback
    default:
      return 'mean';
  }
}

// ========== REACT COMPONENTS ==========

interface HypothesisAnalysisProps {
  testResults: TestResult[];
  hypothesisTestType: HypothesisTestType;
  onTestTypeChange: (type: HypothesisTestType) => void;
  significanceLevel?: SignificanceLevel;
  onSignificanceLevelChange?: (level: SignificanceLevel) => void;
}

/**
 * Test type selector component
 */
const TestTypeSelector: React.FC<{
  value: HypothesisTestType;
  onChange: (type: HypothesisTestType) => void;
}> = ({ value, onChange }) => {
  const parametricTests = useMemo(
    () => Object.entries(TEST_CONFIGURATIONS)
      .filter(([_, config]) => config.testType === 'parametric')
      .map(([key, config]) => ({ key, label: key.replace('-', ' ').toUpperCase(), ...config })),
    []
  );
  
  const nonParametricTests = useMemo(
    () => Object.entries(TEST_CONFIGURATIONS)
      .filter(([_, config]) => config.testType === 'non-parametric')
      .map(([key, config]) => ({ key, label: key.replace('-', ' ').toUpperCase(), ...config })),
    []
  );

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Statistical Test
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as HypothesisTestType)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
      >
        <optgroup label="Parametric Tests">
          {parametricTests.map(({ key, label }) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </optgroup>
        <optgroup label="Non-Parametric Tests">
          {nonParametricTests.map(({ key, label }) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </optgroup>
      </select>
    </div>
  );
};

/**
 * Hypothesis summary component
 */
const HypothesisSummary: React.FC<{ testType: HypothesisTestType }> = ({ testType }) => {
  const config = TEST_CONFIGURATIONS[testType];
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
      <h3 className="font-semibold text-blue-900">Test Information</h3>
      
      <div className="space-y-2">
        <div>
          <span className="font-medium text-blue-800">Description:</span>
          <p className="text-sm text-blue-700">{config.description}</p>
        </div>
        
        <div>
          <span className="font-medium text-blue-800">Null Hypothesis (H₀):</span>
          <p className="text-sm text-blue-700">
            {config.hypothesis.symbol?.null || config.hypothesis.null}
          </p>
        </div>
        
        <div>
          <span className="font-medium text-blue-800">Alternative Hypothesis (H₁):</span>
          <p className="text-sm text-blue-700">
            {config.hypothesis.symbol?.alternative || config.hypothesis.alternative}
          </p>
        </div>
        
        <div>
          <span className="font-medium text-blue-800">Use Case:</span>
          <p className="text-sm text-blue-700">{config.useCase}</p>
        </div>
        
        <details className="cursor-pointer">
          <summary className="font-medium text-blue-800">Assumptions</summary>
          <ul className="mt-2 space-y-1">
            {config.assumptions.map((assumption, idx) => (
              <li key={idx} className="text-sm text-blue-700 flex items-start">
                <span className="mr-2">•</span>
                <span>{assumption}</span>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  );
};

/**
 * Two-sample result card component
 */
const TwoSampleResultCard: React.FC<{
  result: TwoSampleTestResult;
  significanceLevel: SignificanceLevel;
}> = ({ result, significanceLevel }) => {
  const conclusion = useMemo(
    () => calculateConclusion(result.pValue, HypothesisTestTypes.T_TEST, significanceLevel),
    [result.pValue, significanceLevel]
  );
  
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 border-2 ${
      conclusion.decision === 'reject' ? 'border-green-400' : 'border-gray-200'
    }`}>
      <h4 className="text-lg font-semibold mb-4">{result.testName}</h4>
      <p className="text-sm text-gray-600 mb-4">
        Comparing: {result.fieldA} vs {result.fieldB}
      </p>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Test Statistic (t)</p>
          <p className="text-xl font-bold">{result.statistic.toFixed(4)}</p>
        </div>
        
        <div>
          <p className="text-sm text-gray-600">p-value</p>
          <p className="text-xl font-bold">
            {formatPValue(result.pValue)}
            <span className="ml-1 text-sm">{getSignificanceLabel(result.pValue)}</span>
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Effect Size (Cohen's d)</p>
          <p className="text-lg font-semibold">{result.effectSize.toFixed(3)}</p>
        </div>
        
        <div>
          <p className="text-sm text-gray-600">Power</p>
          <p className="text-lg font-semibold">{(result.power * 100).toFixed(1)}%</p>
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600">Critical Value (α = {result.alpha})</p>
        <p className="text-lg font-semibold">{result.criticalValue.toFixed(4)}</p>
      </div>
      
      <div className={`p-3 rounded-md ${
        conclusion.decision === 'reject' ? 'bg-green-100' : 'bg-gray-100'
      }`}>
        <p className="font-semibold text-sm mb-1">
          {conclusion.decision === 'reject' ? '✓ Reject H₀' : '✗ Fail to Reject H₀'}
        </p>
        <p className="text-sm text-gray-700">{conclusion.interpretation}</p>
        
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-600">{result.interpretation}</p>
        </div>
      </div>
    </div>
  );
};

/**
 * Result card component
 */
const ResultCard: React.FC<{
  result: TestResult;
  testType: HypothesisTestType;
  significanceLevel: SignificanceLevel;
}> = ({ result, testType, significanceLevel }) => {
  const conclusion = useMemo(
    () => calculateConclusion(result.pValue, testType, significanceLevel),
    [result.pValue, testType, significanceLevel]
  );
  

  
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 border-2 ${
      conclusion.decision === 'reject' ? 'border-green-400' : 'border-gray-200'
    }`}>
      <h4 className="text-lg font-semibold mb-4">{result.fieldName}</h4>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Test Statistic</p>
          <p className="text-xl font-bold">{result.statistic.toFixed(4)}</p>
        </div>
        
        <div>
          <p className="text-sm text-gray-600">p-value</p>
          <p className="text-xl font-bold">
            {formatPValue(result.pValue)}
            <span className="ml-1 text-sm">{getSignificanceLabel(result.pValue)}</span>
          </p>
        </div>
      </div>
      
      {result.metadata && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">Effect Size</p>
            <p className="text-lg font-semibold">{result.metadata.effectSize.toFixed(3)}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">Power</p>
            <p className="text-lg font-semibold">{(result.metadata.power * 100).toFixed(1)}%</p>
          </div>
        </div>
      )}
      
      {result.metadata && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">Critical Value (α = {result.metadata.alpha})</p>
          <p className="text-lg font-semibold">{result.metadata.criticalValue.toFixed(4)}</p>
        </div>
      )}
      
      <div className={`p-3 rounded-md ${
        conclusion.decision === 'reject' ? 'bg-green-100' : 'bg-gray-100'
      }`}>
        <p className="font-semibold text-sm mb-1">
          {conclusion.decision === 'reject' ? '✓ Reject H₀' : '✗ Fail to Reject H₀'}
        </p>
        <p className="text-sm text-gray-700">{conclusion.interpretation}</p>
        
        {result.metadata && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-600">{result.metadata.interpretation}</p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Main hypothesis analysis component
 */
export const HypothesisAnalysis: React.FC<HypothesisAnalysisProps> = ({
  testResults,
  hypothesisTestType,
  onTestTypeChange,
  significanceLevel = SignificanceLevel.STANDARD,
  onSignificanceLevelChange
}) => {
  const handleSignificanceChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onSignificanceLevelChange?.(parseFloat(e.target.value) as SignificanceLevel);
  }, [onSignificanceLevelChange]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Statistical Hypothesis Testing</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <TestTypeSelector value={hypothesisTestType} onChange={onTestTypeChange} />
          
          {onSignificanceLevelChange && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Significance Level (α)
              </label>
              <select
                value={significanceLevel}
                onChange={handleSignificanceChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value={SignificanceLevel.VERY_HIGH}>0.001 (Very High)</option>
                <option value={SignificanceLevel.HIGH}>0.01 (High)</option>
                <option value={SignificanceLevel.STANDARD}>0.05 (Standard)</option>
                <option value={SignificanceLevel.LOW}>0.10 (Low)</option>
              </select>
            </div>
          )}
        </div>
        
        <HypothesisSummary testType={hypothesisTestType} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {testResults.map((result, idx) => (
          <ResultCard
            key={idx}
            result={result}
            testType={hypothesisTestType}
            significanceLevel={significanceLevel}
          />
        ))}
      </div>
      
      {testResults.length === 0 && (
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <p className="text-gray-600">No test results available. Run a statistical test to see results.</p>
        </div>
      )}
    </div>
  );
};

// ========== COMPATIBILITY WRAPPER ==========

/**
 * Simple wrapper for backward compatibility
 * This maintains the old interface that expected just 'fields' prop
 */
interface SimpleHypothesisAnalysisProps {
  fields: DataField[];
}

export const SimpleHypothesisAnalysis: React.FC<SimpleHypothesisAnalysisProps> = ({ fields }) => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [twoSampleResults, setTwoSampleResults] = useState<TwoSampleTestResult[]>([]);
  const [testType, setTestType] = useState<HypothesisTestType>(HypothesisTestTypes.T_TEST);
  const [significanceLevel, setSignificanceLevel] = useState<SignificanceLevel>(SignificanceLevel.STANDARD);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter numeric fields for hypothesis testing
  const numericFields = useMemo(() => 
    fields.filter(field => field.type === 'number' && Array.isArray(field.value) && field.value.length > 0),
    [fields]
  );

  // Perform two-sample hypothesis testing
  const performTwoSampleTesting = useCallback((alpha: number) => {
    if (numericFields.length < 2) {
      setTwoSampleResults([]);
      return;
    }

    try {
      const results: TwoSampleTestResult[] = [];
      
      // Find specific fields for comparison
      const quantityField = numericFields.find(f => f.name.toLowerCase().includes('quantity'));
      const salesField = numericFields.find(f => f.name.toLowerCase().includes('sales'));
      const dailySalesField = numericFields.find(f => f.name.toLowerCase().includes('daily') && f.name.toLowerCase().includes('sales'));
      const leadTimeField = numericFields.find(f => f.name.toLowerCase().includes('lead') && f.name.toLowerCase().includes('time'));
      const currentStockField = numericFields.find(f => f.name.toLowerCase().includes('stock') || f.name.toLowerCase().includes('inventory'));

      // Perform Welch tests for meaningful comparisons
      if (quantityField && salesField) {
        try {
          const resQS = performWelchTwoSampleTTest(
            quantityField,
            salesField,
            { alpha, tails: 'two' }
          );
          
          results.push({
            testName: 'Quantity vs Sales',
            fieldA: quantityField.name,
            fieldB: salesField.name,
            pValue: resQS.pValue,
            statistic: resQS.statistic,
            effectSize: resQS.effectSize,
            power: resQS.power,
            interpretation: resQS.interpretation,
            criticalValue: resQS.criticalValue,
            alpha: resQS.alpha,
            significant: resQS.significant,
            testType: resQS.testType
          });
        } catch (error) {
          console.error('Error in Quantity vs Sales test:', error);
        }
      }

      if (quantityField && dailySalesField) {
        try {
          const resQD = performWelchTwoSampleTTest(
            quantityField,
            dailySalesField,
            { alpha, tails: 'two' }
          );
          
          results.push({
            testName: 'Quantity vs Daily Sales',
            fieldA: quantityField.name,
            fieldB: dailySalesField.name,
            pValue: resQD.pValue,
            statistic: resQD.statistic,
            effectSize: resQD.effectSize,
            power: resQD.power,
            interpretation: resQD.interpretation,
            criticalValue: resQD.criticalValue,
            alpha: resQD.alpha,
            significant: resQD.significant,
            testType: resQD.testType
          });
        } catch (error) {
          console.error('Error in Quantity vs Daily Sales test:', error);
        }
      }

      if (quantityField && leadTimeField) {
        try {
          const resQL = performWelchTwoSampleTTest(
            quantityField,
            leadTimeField,
            { alpha, tails: 'two' }
          );
          
          results.push({
            testName: 'Quantity vs Lead Time',
            fieldA: quantityField.name,
            fieldB: leadTimeField.name,
            pValue: resQL.pValue,
            statistic: resQL.statistic,
            effectSize: resQL.effectSize,
            power: resQL.power,
            interpretation: resQL.interpretation,
            criticalValue: resQL.criticalValue,
            alpha: resQL.alpha,
            significant: resQL.significant,
            testType: resQL.testType
          });
        } catch (error) {
          console.error('Error in Quantity vs Lead Time test:', error);
        }
      }

      if (quantityField && currentStockField) {
        try {
          const resQC = performWelchTwoSampleTTest(
            quantityField,
            currentStockField,
            { alpha, tails: 'two' }
          );
          
          results.push({
            testName: 'Quantity vs Current Stock',
            fieldA: quantityField.name,
            fieldB: currentStockField.name,
            pValue: resQC.pValue,
            statistic: resQC.statistic,
            effectSize: resQC.effectSize,
            power: resQC.power,
            interpretation: resQC.interpretation,
            criticalValue: resQC.criticalValue,
            alpha: resQC.alpha,
            significant: resQC.significant,
            testType: resQC.testType
          });
        } catch (error) {
          console.error('Error in Quantity vs Current Stock test:', error);
        }
      }

      setTwoSampleResults(results);
    } catch (error) {
      console.error('Two-sample testing error:', error);
    }
  }, [numericFields]);

  // Perform real hypothesis testing
  const performHypothesisTesting = useCallback((newTestType: HypothesisTestType, alpha: number) => {
    if (numericFields.length === 0) {
      setTestResults([]);
      setError('No numeric fields available for hypothesis testing');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const hypothesisTestType = mapTestTypeToHypothesisFormat(newTestType);
      
      const results: TestResult[] = numericFields.map(field => {
        try {
          const hypothesisResult = performHypothesisTests(field, hypothesisTestType, alpha);
          
          return {
            fieldName: field.name,
            pValue: hypothesisResult.pValue,
            statistic: hypothesisResult.statistic,
            metadata: {
              effectSize: hypothesisResult.effectSize,
              power: hypothesisResult.power,
              interpretation: hypothesisResult.interpretation,
              criticalValue: hypothesisResult.criticalValue,
              alpha: hypothesisResult.alpha,
              significant: hypothesisResult.significant,
              testType: hypothesisResult.testType
            }
          };
        } catch (fieldError) {
          console.error(`Error testing field ${field.name}:`, fieldError);
          return {
            fieldName: field.name,
            pValue: 1,
            statistic: 0,
            metadata: {
              effectSize: 0,
              power: 0,
              interpretation: `Error: ${fieldError instanceof Error ? fieldError.message : 'Unknown error'}`,
              criticalValue: 0,
              alpha,
              significant: false,
              testType: hypothesisTestType
            }
          };
        }
      });

      setTestResults(results);
      
      // Also perform two-sample tests
      performTwoSampleTesting(alpha);
    } catch (error) {
      console.error('Hypothesis testing error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      setTestResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [numericFields, performTwoSampleTesting]);

  // Handle test type change
  const handleTestTypeChange = useCallback((newTestType: HypothesisTestType) => {
    setTestType(newTestType);
    performHypothesisTesting(newTestType, significanceLevel);
  }, [performHypothesisTesting, significanceLevel]);

  // Handle significance level change
  const handleSignificanceLevelChange = useCallback((newLevel: SignificanceLevel) => {
    setSignificanceLevel(newLevel);
    performHypothesisTesting(testType, newLevel);
  }, [performHypothesisTesting, testType]);

  // Initial testing on component mount
  useEffect(() => {
    if (numericFields.length > 0) {
      performHypothesisTesting(testType, significanceLevel);
    }
  }, [numericFields, testType, significanceLevel]);

  return (
    <div className="w-full p-4">
      <div className="bg-blue-600 text-white p-4 mb-4 rounded-t-lg">
        <h2 className="text-xl font-semibold">Hypothesis Analysis</h2>
        {numericFields.length > 0 && (
          <p className="text-sm opacity-90">
            Testing {numericFields.length} numeric field{numericFields.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {isLoading && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4 flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
          <strong>Loading:</strong> Performing hypothesis tests...
        </div>
      )}
      
      {numericFields.length === 0 && !error && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <strong>No Data:</strong> No numeric fields available for hypothesis testing.
        </div>
      )}
      
      <HypothesisAnalysis
        testResults={testResults}
        hypothesisTestType={testType}
        onTestTypeChange={handleTestTypeChange}
        significanceLevel={significanceLevel}
        onSignificanceLevelChange={handleSignificanceLevelChange}
      />
      
      {/* Two-Sample Test Results */}
      {twoSampleResults.length > 0 && (
        <div className="mt-8">
          <div className="bg-green-600 text-white p-4 mb-4 rounded-t-lg">
            <h3 className="text-lg font-semibold">Two-Sample Hypothesis Tests</h3>
            <p className="text-sm opacity-90">
              Welch t-tests comparing quantity with other variables
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {twoSampleResults.map((result, idx) => (
              <TwoSampleResultCard
                key={idx}
                result={result}
                significanceLevel={significanceLevel}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

 