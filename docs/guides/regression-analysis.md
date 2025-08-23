# Comprehensive Guide to Regression Analysis Techniques

## Table of Contents
1. [Linear Regression](#linear-regression)
2. [Multiple Linear Regression](#multiple-linear-regression)
3. [Logistic Regression](#logistic-regression)
4. [Polynomial Regression](#polynomial-regression)
5. [Ridge Regression (L2)](#ridge-regression)
6. [Lasso Regression (L1)](#lasso-regression)
7. [Elastic Net Regression](#elastic-net-regression)
8. [Stepwise Regression](#stepwise-regression)
9. [Time Series Regression](#time-series-regression)
10. [Quantile Regression](#quantile-regression)
11. [Log-Log Regression](#log-log-regression)

## Linear Regression {#linear-regression}

### Definition
Simple linear regression models the relationship between a dependent variable (y) and one independent variable (x) using a linear equation.

### Key Assumptions
- Linear relationship between variables
- Independence of observations
- Homoscedasticity (constant variance)
- Normally distributed residuals
- No multicollinearity

### Mathematical Formula
```
y = β₀ + β₁x + ε
```
where:
- y is the dependent variable
- x is the independent variable
- β₀ is the intercept
- β₁ is the slope
- ε is the error term

### Use Cases
- Sales forecasting
- Price prediction
- Performance analysis
- Risk assessment

### Code Example
```python
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_squared_error
import numpy as np

# Create and fit model
model = LinearRegression()
model.fit(X, y)

# Make predictions
y_pred = model.predict(X)

# Evaluate model
r2 = r2_score(y, y_pred)
rmse = np.sqrt(mean_squared_error(y, y_pred))
```

### Model Evaluation
- R-squared (R²)
- Root Mean Square Error (RMSE)
- Mean Absolute Error (MAE)
- Residual plots

### Common Pitfalls
- Extrapolation beyond data range
- Ignoring outliers
- Assuming causation from correlation
- Not checking assumptions

## Multiple Linear Regression {#multiple-linear-regression}

### Definition
Extends simple linear regression to include multiple independent variables.

### Key Assumptions
- Linear relationship between variables
- Independence of observations
- No multicollinearity
- Homoscedasticity
- Normally distributed residuals

### Mathematical Formula
```
y = β₀ + β₁x₁ + β₂x₂ + ... + βₙxₙ + ε
```

### Use Cases
- Market analysis
- Economic forecasting
- Scientific research
- Quality control

### Code Example
```python
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler

# Standardize features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Fit model
model = LinearRegression()
model.fit(X_scaled, y)

# Feature importance
importance = pd.DataFrame({
    'feature': features,
    'importance': abs(model.coef_)
}).sort_values('importance', ascending=False)
```

### Model Evaluation
- Adjusted R-squared
- VIF (Variance Inflation Factor)
- F-statistic
- AIC/BIC

## Ridge Regression (L2) {#ridge-regression}

### Definition
Linear regression with L2 regularization to prevent overfitting.

### Key Components
- Adds penalty term λΣβ²
- Shrinks coefficients toward zero
- Never sets coefficients exactly to zero

### Mathematical Formula
```
min(||y - Xβ||² + λ||β||²)
```

### Use Cases
- High-dimensional data
- Multicollinearity
- Overfitting prevention
- Feature selection

### Code Example
```python
from sklearn.linear_model import Ridge
from sklearn.model_selection import GridSearchCV

# Create model with cross-validation
ridge = Ridge()
params = {'alpha': [0.1, 1.0, 10.0]}
model = GridSearchCV(ridge, params, cv=5)
model.fit(X, y)

# Best parameters
print(f"Best alpha: {model.best_params_['alpha']}")
```

### Model Evaluation
- Cross-validation scores
- Regularization path
- Coefficient shrinkage
- Prediction error

## Lasso Regression (L1) {#lasso-regression}

### Definition
Linear regression with L1 regularization for feature selection.

### Key Components
- Adds penalty term λΣ|β|
- Can set coefficients exactly to zero
- Performs feature selection

### Mathematical Formula
```
min(||y - Xβ||² + λ||β||₁)
```

### Use Cases
- Feature selection
- Sparse models
- High-dimensional data
- Automated variable selection

### Code Example
```python
from sklearn.linear_model import Lasso
from sklearn.preprocessing import StandardScaler

# Standardize and fit
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
lasso = Lasso(alpha=0.1)
lasso.fit(X_scaled, y)

# Selected features
selected = pd.DataFrame({
    'feature': features,
    'coef': lasso.coef_
}).query('coef != 0')
```

## Elastic Net Regression {#elastic-net-regression}

### Definition
Combines L1 and L2 regularization.

### Key Components
- Mixing parameter α between L1 and L2
- Combines benefits of Ridge and Lasso
- Handles correlated features well

### Mathematical Formula
```
min(||y - Xβ||² + λ₁||β||₁ + λ₂||β||²)
```

### Use Cases
- High-dimensional data
- Correlated features
- Robust feature selection
- Group selection

### Code Example
```python
from sklearn.linear_model import ElasticNet
from sklearn.model_selection import GridSearchCV

# Parameter grid
params = {
    'alpha': [0.1, 1.0, 10.0],
    'l1_ratio': [0.1, 0.5, 0.9]
}

# Cross-validation
enet = ElasticNet()
model = GridSearchCV(enet, params, cv=5)
model.fit(X, y)
```

## Time Series Regression {#time-series-regression}

### Definition
Regression analysis for time-dependent data.

### Key Components
- Time-based features
- Seasonal components
- Trend analysis
- Autocorrelation

### Mathematical Formula
```
y(t) = β₀ + β₁t + β₂sin(2πt/T) + β₃cos(2πt/T) + ε(t)
```

### Use Cases
- Stock price prediction
- Sales forecasting
- Weather forecasting
- Demand prediction

### Code Example
```python
from statsmodels.tsa.arima.model import ARIMA
import pandas as pd

# Fit ARIMA model
model = ARIMA(y, order=(1, 1, 1))
results = model.fit()

# Make predictions
forecast = results.forecast(steps=10)
```

## Quantile Regression {#quantile-regression}

### Definition
Estimates conditional quantiles of the response variable.

### Key Components
- Quantile-specific estimates
- Robust to outliers
- Non-parametric approach
- Distribution-free

### Mathematical Formula
```
min Σ ρτ(yi - xiβ)
where ρτ(u) = u(τ - I(u < 0))
```

### Use Cases
- Risk analysis
- Economics
- Environmental studies
- Performance analysis

### Code Example
```python
from sklearn.linear_model import QuantileRegressor

# Fit model for different quantiles
quantiles = [0.25, 0.5, 0.75]
models = {
    q: QuantileRegressor(quantile=q).fit(X, y)
    for q in quantiles
}

# Make predictions
predictions = {
    q: model.predict(X)
    for q, model in models.items()
}
```

## Model Evaluation Guidelines

### Cross-Validation
```python
from sklearn.model_selection import cross_val_score

# K-fold cross-validation
scores = cross_val_score(model, X, y, cv=5)
print(f"CV Scores: {scores}")
print(f"Mean CV Score: {scores.mean():.3f} (+/- {scores.std() * 2:.3f})")
```

### Performance Metrics
1. R-squared (R²)
   - Measures goodness of fit
   - Range: 0 to 1
   - Higher is better

2. RMSE (Root Mean Square Error)
   - Measures prediction error
   - Same units as target variable
   - Lower is better

3. MAE (Mean Absolute Error)
   - Average absolute prediction error
   - More robust to outliers
   - Lower is better

4. AIC/BIC
   - Model selection criteria
   - Penalizes complexity
   - Lower is better

### Diagnostic Plots
1. Residual Plot
   - Check linearity
   - Identify heteroscedasticity
   - Detect patterns

2. Q-Q Plot
   - Check normality
   - Identify outliers
   - Assess distribution

3. Leverage Plot
   - Identify influential points
   - Detect high-leverage points
   - Assess model fit

## Best Practices

### Data Preparation
1. Handle missing values
2. Scale features
3. Check for multicollinearity
4. Split data properly

### Model Selection
1. Start simple
2. Use cross-validation
3. Compare multiple models
4. Consider interpretability

### Validation
1. Test assumptions
2. Check residuals
3. Validate predictions
4. Assess generalization

### Documentation
1. Record preprocessing steps
2. Document model parameters
3. Save evaluation metrics
4. Note key findings

## Common Pitfalls to Avoid

1. Overfitting
   - Solution: Use regularization
   - Monitor training vs validation performance
   - Implement cross-validation

2. Multicollinearity
   - Solution: Check VIF scores
   - Use feature selection
   - Consider dimensionality reduction

3. Outliers
   - Solution: Robust regression
   - Investigate unusual points
   - Consider transformation

4. Assumption Violations
   - Solution: Check diagnostics
   - Transform variables
   - Use robust methods

## Conclusion

Choosing the right regression technique depends on:
- Data characteristics
- Problem requirements
- Model assumptions
- Computational resources

Remember to:
1. Validate assumptions
2. Use appropriate diagnostics
3. Document decisions
4. Monitor performance
5. Update models regularly

from regression_analyzer import analyze_regression

# Your data
X = ...  # Your feature matrix
y = ...  # Your target vector

# Run analysis
results = analyze_regression(X, y)

# Results will contain:
# - Model comparison metrics
# - Individual model metrics
# - Diagnostic plots (as base64 images)
# - Feature importance plots
# - Regularization paths

print("X shape:", X.shape)
print("y shape:", y.shape)
print("Any NaN in X?", np.isnan(X).any())
print("Any NaN in y?", np.isnan(y).any())
print("Any Inf in X?", np.isinf(X).any())
print("Any Inf in y?", np.isinf(y).any())
print("y unique values:", np.unique(y))