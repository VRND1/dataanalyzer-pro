import { calculateTTest, calculateZTest, calculateAnova, HypothesisTestResult } from '../utils/hypothesisTesting';

export interface AnalysisRequest {
  testType: 't-test' | 'z-test' | 'anova';
  data: {
    sample1?: number[];
    sample2?: number[];
    populationMean?: number;
    populationStdDev?: number;
    groups?: number[][];
  };
  parameters: {
    alpha: number;
    isPaired?: boolean;
  };
}

export interface AnalysisResponse {
  result: HypothesisTestResult;
  interpretation: string;
  recommendations: string[];
  assumptions: string[];
  limitations: string[];
}

export class AnalysisService {
  private validateData(request: AnalysisRequest): void {
    const { testType, data, parameters } = request;

    if (!parameters.alpha || parameters.alpha <= 0 || parameters.alpha >= 1) {
      throw new Error('Invalid significance level (alpha)');
    }

    switch (testType) {
      case 't-test':
        if (!data.sample1 || !data.sample2 || data.sample1.length === 0 || data.sample2.length === 0) {
          throw new Error('Invalid sample data for t-test');
        }
        break;
      case 'z-test':
        if (!data.sample1 || data.sample1.length === 0 || 
            typeof data.populationMean !== 'number' || 
            typeof data.populationStdDev !== 'number' || 
            data.populationStdDev <= 0) {
          throw new Error('Invalid data for z-test');
        }
        break;
      case 'anova':
        if (!data.groups || data.groups.length < 2 || 
            data.groups.some(group => group.length === 0)) {
          throw new Error('Invalid group data for ANOVA');
        }
        break;
      default:
        throw new Error('Invalid test type');
    }
  }

  private getAssumptions(testType: string): string[] {
    const commonAssumptions = [
      'Data is randomly sampled',
      'Observations are independent',
    ];

    switch (testType) {
      case 't-test':
        return [
          ...commonAssumptions,
          'Data follows a normal distribution',
          'For independent samples: equal variances (homoscedasticity)',
        ];
      case 'z-test':
        return [
          ...commonAssumptions,
          'Population standard deviation is known',
          'Sample size is large enough (n > 30) or data is normally distributed',
        ];
      case 'anova':
        return [
          ...commonAssumptions,
          'Data follows a normal distribution in each group',
          'Equal variances across groups (homoscedasticity)',
        ];
      default:
        return commonAssumptions;
    }
  }

  private getLimitations(testType: string): string[] {
    switch (testType) {
      case 't-test':
        return [
          'Sensitive to outliers',
          'Requires normal distribution assumption',
          'Small sample sizes may affect power',
        ];
      case 'z-test':
        return [
          'Requires known population standard deviation',
          'May not be suitable for small samples',
          'Sensitive to non-normality in small samples',
        ];
      case 'anova':
        return [
          'Does not indicate which groups differ',
          'Requires equal variances assumption',
          'Sensitive to violations of normality',
        ];
      default:
        return ['General limitations apply'];
    }
  }

  private getInterpretation(result: HypothesisTestResult): string {
    const significance = result.isSignificant ? 'statistically significant' : 'not statistically significant';
    const confidence = (1 - result.pValue) * 100;

    switch (result.testType) {
      case 't-test':
        return `The t-test results show a ${significance} difference between the samples (p = ${result.pValue.toFixed(4)}). ` +
               `We can be ${confidence.toFixed(1)}% confident in this result.`;
      case 'z-test':
        return `The z-test results show a ${significance} difference from the population mean (p = ${result.pValue.toFixed(4)}). ` +
               `We can be ${confidence.toFixed(1)}% confident in this result.`;
      case 'anova':
        return `The ANOVA results show a ${significance} difference between the groups (p = ${result.pValue.toFixed(4)}). ` +
               `We can be ${confidence.toFixed(1)}% confident in this result.`;
      default:
        return 'Unable to interpret results';
    }
  }

  private getRecommendations(result: HypothesisTestResult): string[] {
    const recommendations: string[] = [];

    if (result.isSignificant) {
      recommendations.push('Consider the practical significance of the result');
      recommendations.push('Report effect size if available');
    } else {
      recommendations.push('Consider increasing sample size for more power');
      recommendations.push('Check if assumptions are met');
    }

    if (result.pValue < 0.01) {
      recommendations.push('Consider reporting exact p-value');
    }

    return recommendations;
  }

  public async performAnalysis(request: AnalysisRequest): Promise<AnalysisResponse> {
    try {
      this.validateData(request);
      const { testType, data, parameters } = request;

      let result: HypothesisTestResult;

      switch (testType) {
        case 't-test':
          result = calculateTTest({
            sample1: data.sample1!,
            sample2: data.sample2!,
            alpha: parameters.alpha,
            isPaired: parameters.isPaired
          });
          break;
        case 'z-test':
          result = calculateZTest({
            sample: data.sample1!,
            populationMean: data.populationMean!,
            populationStdDev: data.populationStdDev!,
            alpha: parameters.alpha
          });
          break;
        case 'anova':
          result = calculateAnova({
            groups: data.groups!,
            alpha: parameters.alpha
          });
          break;
        default:
          throw new Error('Invalid test type');
      }

      return {
        result,
        interpretation: this.getInterpretation(result),
        recommendations: this.getRecommendations(result),
        assumptions: this.getAssumptions(testType),
        limitations: this.getLimitations(testType)
      };
    } catch (error) {
      throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 