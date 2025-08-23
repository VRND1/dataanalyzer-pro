declare module 'prophet-js' {
  interface ProphetOptions {
    growth?: 'linear' | 'logistic';
    changepoints?: number[] | null;
    n_changepoints?: number;
    changepoint_range?: number;
    yearly_seasonality?: boolean | 'auto' | number;
    weekly_seasonality?: boolean | 'auto' | number;
    daily_seasonality?: boolean | 'auto' | number;
    seasonality_mode?: 'multiplicative' | 'additive';
    seasonality_prior_scale?: number;
    changepoint_prior_scale?: number;
    holidays_prior_scale?: number;
    mcmc_samples?: number;
    interval_width?: number;
    uncertainty_samples?: number;
  }

  interface ProphetData {
    ds: string[];
    y: number[];
  }

  class Prophet {
    constructor(options?: ProphetOptions);
    fit(data: ProphetData): Promise<void>;
    predict(future: ProphetData): Promise<any>;
    destroy?(): Promise<void>;
  }

  export default Prophet;
} 