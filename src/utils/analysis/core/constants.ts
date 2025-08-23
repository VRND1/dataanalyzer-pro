export const ANALYSIS_CONSTANTS = {
  // Statistical thresholds
  SIGNIFICANCE_LEVEL: 0.05,
  CONFIDENCE_INTERVAL: 0.95,
  MIN_SAMPLE_SIZE: 30,
  
  // Regression settings
  MIN_DATA_POINTS: 10,
  MAX_FEATURES: 100,
  
  // Time series settings
  MIN_PERIODS: 12,
  MAX_FORECAST_PERIODS: 24,
  
  // ML settings
  TRAIN_TEST_SPLIT: 0.8,
  MAX_ITERATIONS: 1000,
  
  // Text analysis
  MIN_WORD_LENGTH: 3,
  MAX_KEYWORDS: 20,
  
  // Business metrics
  RISK_FREE_RATE: 0.02,
  CONFIDENCE_LEVEL_VAR: 0.99,
  
  // Industry specific
  FINANCE: {
    MIN_TRADING_DAYS: 252,
    VOLATILITY_WINDOW: 20,
  },
  HEALTHCARE: {
    MIN_PATIENTS: 100,
    FOLLOW_UP_PERIOD: 365,
  },
  RETAIL: {
    MIN_SALES_PERIODS: 12,
    SEASONALITY_PERIOD: 4,
  }
};

export const ERROR_MESSAGES = {
  INVALID_DATA: 'Invalid or insufficient data for analysis',
  COMPUTATION_ERROR: 'Error during computation',
  VALIDATION_ERROR: 'Data validation failed',
  TIMEOUT_ERROR: 'Analysis timed out',
  MEMORY_ERROR: 'Insufficient memory for analysis',
};

export const ANALYSIS_LIMITS = {
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_ROWS: 1000000,
  MAX_COLUMNS: 100,
  MAX_TEXT_LENGTH: 10000,
  TIMEOUT_MS: 30000, // 30 seconds
}; 