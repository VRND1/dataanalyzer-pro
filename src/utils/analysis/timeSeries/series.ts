export type SeriesMode = 'row' | 'date_sum';

type Row = Record<string, any>;

function guessTimeKey(cols: string[]) {
  const c = cols.map(s => s.toLowerCase());
  const hits = ['date','timestamp','time','dt'];
  return cols[c.findIndex(x => hits.includes(x))] ?? cols[0];
}

function valueGetter(field: string) {
  const f = field.toLowerCase();
  return (r: Row) => {
    if (f === 'sales') {
      if (r.sales != null && r.sales !== '') return Number(r.sales);
      return Number(r.price) * Number(r.quantity); // fallback if no 'sales' column
    }
    if (f === 'dailysales') return Number(r.dailySales);
    if (f === 'quantity')   return Number(r.quantity);
    return Number(r[field]); // generic
  };
}

// Deterministic series from arbitrary rows
export function buildSeries(
  rows: Row[],
  {
    timeKey,
    field = 'sales',
    mode = 'row' as SeriesMode,
    withinDateOrderKeys = ['productName', 'id'], // control within-date order
  }: {
    timeKey?: string;
    field?: string;          // 'sales' | 'quantity' | 'dailySales' | any numeric
    mode?: SeriesMode;       // 'row' (18 in your example) or 'date_sum' (3 in your file)
    withinDateOrderKeys?: string[];
  } = {}
) {
  if (!rows?.length) return { y: [], meta: { n: 0, mode, timeKey: '', field } };

  const cols = Object.keys(rows[0]);
  const tKey = timeKey ?? guessTimeKey(cols);
  const val  = valueGetter(field);

  const parseT = (v: any) => {
    const s = String(v);
    // If it's a date‐only string, force local midnight:
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(s + "T00:00:00").getTime();
    return new Date(s).getTime();
  };

  // date ASC, then deterministic within-date order
  const sorted = [...rows].sort((a, b) => {
    const ta = parseT(a[tKey]); const tb = parseT(b[tKey]);
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
    const yRaw = sorted.map(val).map(Number);
    const y = yRaw.filter(v => Number.isFinite(v));  // drop NaN/±Inf
    return { y, meta: { n: y.length, mode, timeKey: tKey, field } };
  }

  // mode === 'date_sum' (sum all rows of same date)
  const byDate = new Map<number, number>();
  for (const r of sorted) {
    const t = parseT(r[tKey]);
    const v = Number(val(r));
    if (Number.isFinite(v)) {  // only add finite values
      byDate.set(t, (byDate.get(t) ?? 0) + v);
    }
  }
  const y = Array.from(byDate.entries()).sort((a,b)=>a[0]-b[0]).map(([,v])=>v);
  return { y, meta: { n: y.length, mode, timeKey: tKey, field } };
}

export function seriesSignature(y: number[]) {
  const r = (n:number)=>Math.round(n*100)/100;
  return { n: y.length, head: y.slice(0,5).map(r), tail: y.slice(-5).map(r), sum: r(y.reduce((a,b)=>a+b,0)) };
}
