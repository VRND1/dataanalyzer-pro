// Orchestrates: extract series from rows, run Holt with grid search, return tidy result.

import { gridSearchHolt } from "./holtCalculations";
import type { ExtractedSeries, SeriesExtractionOptions, HoltGridSearchResult } from "./types";

type Row = Record<string, any>;

export type SeriesMode = 'row' | 'date_sum';
export type FieldKind = 'sales' | 'quantity' | 'dailySales';

export interface Metrics {
  MAE: number;
  RMSE: number;
  MAPE: number | null;
  sMAPE: number | null;
}

const isFiniteNum = (x: any) => Number.isFinite(x) && !Number.isNaN(x);

export function toSeriesFromTable<T extends Record<string, any>>(
  rows: T[],
  opts: SeriesExtractionOptions<T>
): ExtractedSeries {
  const {
    timeKey, valueKey,
    sort = true,
    parseTime = (v: any) => {
      const s = String(v);
      // If it's a date‐only string, force local midnight:
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(s + "T00:00:00").getTime();
      return new Date(s).getTime();
    },
    aggregateByTime = true
  } = opts;

  const tmp = rows
    .map(r => ({ t: parseTime(r[timeKey]), v: Number(r[valueKey]) }))
    .filter(p => isFiniteNum(p.t) && isFiniteNum(p.v));

  if (sort) tmp.sort((a, b) => a.t - b.t);

  if (!aggregateByTime) {
    return { timestamps: tmp.map(x => x.t), values: tmp.map(x => x.v) };
  }

  const map = new Map<number, number>();
  for (const { t, v } of tmp) map.set(t, (map.get(t) || 0) + v);
  const agg = Array.from(map.entries()).sort((a, b) => a[0] - b[0]);

  return { timestamps: agg.map(([t]) => t), values: agg.map(([, v]) => v) };
}

export function predictHoltFromRows<T extends Record<string, any>>(
  rows: T[],
  opts: SeriesExtractionOptions<T>,
  horizon = 12,
  holdout: number | null = null
): HoltGridSearchResult {
  const { values } = toSeriesFromTable(rows, opts);
  if (!values || values.length < 2) {
    throw new Error("Need at least 2 data points for Holt forecasting.");
  }
  return gridSearchHolt(values, horizon, undefined, undefined, holdout);
}

export function buildDeterministicSeries(
  rows: Row[],
  {
    timeKey = 'date',
    field = 'sales' as FieldKind,
    mode = 'row' as SeriesMode,
    withinDateOrderKeys = ['productName'], // for stable row sequence
  } = {}
): number[] {
  // 1) normalize the value for chosen field
  const val = (r: Row) => {
    if (field === 'sales') {
      // prefer explicit sales; otherwise fallback to price*quantity
      if (r.sales != null && r.sales !== '') return Number(r.sales);
      return Number(r.price) * Number(r.quantity);
    }
    if (field === 'dailySales') return Number(r.dailySales);
    return Number(r.quantity);
  };

  // 2) parse time deterministically
  const parseT = (v: any) => {
    const s = String(v);
    // If it's a date‐only string, force local midnight:
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(s + "T00:00:00").getTime();
    return new Date(s).getTime();
  };

  // 3) sort deterministically
  //    date ASC + within-date stable keys (productName, id, etc)
  const sorted = [...rows].sort((a, b) => {
    const ta = parseT(a[timeKey]); const tb = parseT(b[timeKey]);
    if (ta !== tb) return ta - tb;
    for (const k of withinDateOrderKeys) {
      if (a[k] !== undefined || b[k] !== undefined) {
        const va = String(a[k] ?? "");
        const vb = String(b[k] ?? "");
        if (va !== vb) return va.localeCompare(vb);
      }
    }
    // final tiebreaker to keep order deterministic across runs:
    return 0;
  });

  if (mode === 'row') {
    // 18-point row-level series (matches your chart)
    const yRaw = sorted.map(val).map(Number);
    const y = yRaw.filter(v => Number.isFinite(v));  // drop NaN/±Inf
    return y;
  }

  // mode === 'date_sum' → collapse to date totals (3 points on your file)
  const byDate = new Map<number, number>();
  for (const r of sorted) {
    const t = parseT(r[timeKey]);
    const v = val(r);
    if (Number.isFinite(v)) {  // only add finite values
      byDate.set(t, (byDate.get(t) ?? 0) + v);
    }
  }
  return Array.from(byDate.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, v]) => v);
}

/** quick fingerprint so we can assert we're on the *same* series */
export function seriesSignature(y: number[]) {
  const r = (n: number) => Number((Math.round(n * 100) / 100).toFixed(2));
  const head = y.slice(0, 5).map(r);
  const tail = y.slice(-5).map(r);
  const sum = r(y.reduce((a, b) => a + b, 0));
  return { n: y.length, head, tail, sum };
}
