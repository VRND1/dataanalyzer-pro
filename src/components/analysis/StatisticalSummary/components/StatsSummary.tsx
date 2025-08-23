import { DataField } from '@/types/data';
import { useState, useMemo } from 'react';

interface Correlation {
  field1: string;
  field2: string;
  coefficient: number;
  pValue?: number;
  significance: 'Very Strong' | 'Strong' | 'Moderate' | 'Weak';
}

interface StatMetrics {
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  sampleSize: number;
}

interface StatsSummaryProps {
  fields: DataField[];
  correlationThreshold?: number;
}

// ----------- Helpers ----------- //
function useNumericFields(fields: DataField[]): DataField[] {
  return useMemo(() => fields.filter(f => f.type === 'number'), [fields]);
}

function calculateStats(values: number[]): StatMetrics | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const median = values.length % 2 === 0
    ? (sorted[values.length/2 - 1] + sorted[values.length/2]) / 2
    : sorted[Math.floor(values.length / 2)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const stdDev = Math.sqrt(
    values.map(v => Math.pow(v - mean, 2)).reduce((a, b) => a + b, 0) / (values.length - 1)
  );
  return { mean, median, min, max, stdDev, sampleSize: values.length };
}

function formatNum(num: number | undefined, digits = 2): string {
  if (typeof num !== 'number' || isNaN(num)) return '-';
  return num.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

// ----------- UI Components ----------- //
const StatRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-gray-600">{label}</span>
    <span className="font-medium text-gray-900">{value}</span>
  </div>
);

const StatsGrid: React.FC<{ fields: DataField[] }> = ({ fields }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {fields.map(field => {
      if (field.type !== 'number') return null;
      const vals = (field.value as number[]).filter(v => !isNaN(v));
      const stats = calculateStats(vals);
      if (!stats) return null;
      return (
        <div key={field.name} className="bg-white border p-4 rounded-lg shadow-sm">
          <h4 className="font-semibold text-black mb-2">{field.name}</h4>
          <div className="space-y-1">
            <StatRow label="Sample Size" value={formatNum(stats.sampleSize, 0)} />
            <StatRow label="Mean" value={formatNum(stats.mean)} />
            <StatRow label="Median" value={formatNum(stats.median)} />
            <StatRow label="Std Dev" value={formatNum(stats.stdDev)} />
            <StatRow label="Min" value={formatNum(stats.min)} />
            <StatRow label="Max" value={formatNum(stats.max)} />
          </div>
        </div>
      );
    })}
  </div>
);

const FieldStatsTable: React.FC<{ fields: DataField[] }> = ({ fields }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 border mb-6">
        <thead className="bg-gray-50">
          <tr>
            {['Field','Type','Count','Missing','Mean','Median','Min','Max','Std Dev'].map(h => (
              <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-600">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {fields.map((field, i) => {
            const vals = field.type === 'number' ? (field.value as number[]).filter(v => !isNaN(v)) : [];
            const stats = calculateStats(vals);
            const missing = field.type === 'number'
              ? field.value.length - vals.length
              : (field.value as string[]).filter(v => !v || v.trim() === '').length;
            return (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-2 text-sm">{field.name}</td>
                <td className="px-4 py-2 text-sm">{field.type}</td>
                <td className="px-4 py-2 text-sm">{field.value.length}</td>
                <td className="px-4 py-2 text-sm">{missing} ({field.value.length > 0 ? ((missing / field.value.length) * 100).toFixed(1) : 0}%)</td>
                <td className="px-4 py-2 text-sm">{stats ? formatNum(stats.mean) : '-'}</td>
                <td className="px-4 py-2 text-sm">{stats ? formatNum(stats.median) : '-'}</td>
                <td className="px-4 py-2 text-sm">{stats ? formatNum(stats.min) : '-'}</td>
                <td className="px-4 py-2 text-sm">{stats ? formatNum(stats.max) : '-'}</td>
                <td className="px-4 py-2 text-sm">{stats ? formatNum(stats.stdDev) : '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const CorrelationPanel: React.FC<{
  fields: DataField[];
  threshold: number;
  setThreshold: (t: number) => void;
  selected: string[];
  setSelected: (s: string[]) => void;
}> = ({ fields, threshold, setThreshold, selected, setSelected }) => {
  const numericFields = useNumericFields(fields);
  const correlations = useMemo(() => {
    const results: Correlation[] = [];
    for (let i = 0; i < numericFields.length; i++) {
      for (let j = i + 1; j < numericFields.length; j++) {
        const a = numericFields[i], b = numericFields[j];
        if (selected.length > 0 && !selected.includes(a.name) && !selected.includes(b.name)) continue;
        
        const pairs: [number, number][] = [];
        for (let k = 0; k < a.value.length; k++) {
          const v1 = a.value[k] as number, v2 = b.value[k] as number;
          if (!isNaN(v1) && !isNaN(v2)) pairs.push([v1, v2]);
        }
        if (pairs.length < 2) continue;
        
        const xs = pairs.map(([x]) => x), ys = pairs.map(([, y]) => y);
        const meanX = xs.reduce((a, b) => a + b, 0) / xs.length;
        const meanY = ys.reduce((a, b) => a + b, 0) / ys.length;
        const numerator = xs.reduce((sum, x, idx) => sum + (x - meanX)*(ys[idx] - meanY), 0);
        const denomX = Math.sqrt(xs.reduce((sum, x) => sum + Math.pow(x - meanX, 2), 0));
        const denomY = Math.sqrt(ys.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0));
        const coefficient = numerator / (denomX * denomY);
        
        let significance: Correlation["significance"] = 'Weak';
        if (Math.abs(coefficient) > 0.8) significance = 'Very Strong';
        else if (Math.abs(coefficient) > 0.6) significance = 'Strong';
        else if (Math.abs(coefficient) > 0.4) significance = 'Moderate';
        
        if (Math.abs(coefficient) >= threshold) {
          results.push({ field1: a.name, field2: b.name, coefficient, significance });
        }
      }
    }
    return results.sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient));
  }, [numericFields, selected, threshold]);

  return (
    <div className="bg-white border p-4 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-semibold text-black">Correlation Analysis</h4>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Threshold:</span>
          <select
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="text-xs border rounded px-2 py-1 text-gray-700"
          >
            {[0.3,0.5,0.7].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-2">
        {numericFields.map(field => (
          <button
            key={field.name}
            onClick={() => setSelected(
              selected.includes(field.name)
                ? selected.filter(f => f !== field.name)
                : [...selected, field.name]
            )}
            className={`px-3 py-1 text-xs rounded-full ${
              selected.includes(field.name)
                ? 'bg-teal-500 text-white'
                : 'bg-gray-100 text-black hover:bg-gray-200'
            }`}
          >
            {field.name}
          </button>
        ))}
      </div>
      <div>
        {correlations.length ? (
          <div className="space-y-1">
            {correlations.map(({ field1, field2, coefficient, significance }) => (
              <div key={`${field1}${field2}`} className="flex justify-between items-center border-b last:border-0 py-1">
                <span className="font-medium text-gray-700 text-sm">{field1} ↔ {field2}</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  coefficient > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {formatNum(coefficient)} ({significance})
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-sm text-gray-400 py-4">No significant correlations</div>
        )}
      </div>
    </div>
  );
};

export function StatsSummary({ fields, correlationThreshold: initialThreshold = 0.5 }: StatsSummaryProps) {
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [threshold, setThreshold] = useState(initialThreshold);
  const numericFields = useNumericFields(fields);

  if (!fields.length) return <div className="p-6 text-center text-gray-500">No data loaded.</div>;
  if (!numericFields.length) return <div className="p-6 text-center text-gray-500">No numeric data fields available.</div>;

  return (
    <div className="bg-gray-50 p-6 rounded-2xl shadow space-y-8 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-black mb-2">Statistical Analysis Dashboard</h2>
      <FieldStatsTable fields={fields} />
      <section>
        <h3 className="text-xl font-semibold text-gray-800 mb-3">Individual Field Statistics</h3>
        <StatsGrid fields={numericFields} />
      </section>
      <section>
        <CorrelationPanel
          fields={fields}
          threshold={threshold}
          setThreshold={setThreshold}
          selected={selectedFields}
          setSelected={setSelectedFields}
        />
      </section>
      <div className="text-xs text-gray-400 mt-8 text-center">
        Powered by DataAnalyzer Pro • State-of-the-art Statistical Engine
      </div>
    </div>
  );
}