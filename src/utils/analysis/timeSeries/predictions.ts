// Helpers for aligning forecasts back onto timestamps (optional)

export function attachForecastDates(
  lastTimestampMs: number,
  horizon: number,
  stepMs: number,
  points: number[]
) {
  const out: { t: number; yhat: number }[] = [];
  for (let i = 1; i <= horizon; i++) {
    out.push({ t: lastTimestampMs + i * stepMs, yhat: points[i - 1] });
  }
  return out;
}

export function dailyStepMs(): number {
  return 24 * 60 * 60 * 1000;
}
