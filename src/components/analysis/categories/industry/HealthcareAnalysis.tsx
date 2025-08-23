import { useState, useMemo } from 'react';
import {
  Activity,
  AlertCircle,
  TrendingUp,
  Users,
  Heart,
  DollarSign,
  Clock,
  Filter,
  Download,
  RefreshCw,
  Upload,
  Target,
  Info
} from 'lucide-react';
import {
  BarChart,
  Bar as RechartsBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import _ from 'lodash';
import { FileData } from '@/types/data';

// --------------------------
// Types
// --------------------------
interface HealthcareRecord {
  [key: string]: any;
  patient_id?: string;
  patient_age?: number;
  age_group?: string;
  department?: string;
  condition?: string;
  admission_date?: string;
  length_of_stay?: number;
  cost?: number;
  readmission?: boolean;
  outcome?: string;
  satisfaction?: number; // normalize to number 1-5
  risk_score?: number;   // normalize 0-100
}

interface HealthcareAnalysisProps {
  fileData?: FileData;
  onDataProcessed?: (data: HealthcareRecord[]) => void;
  isProcessing?: boolean;
}

// --------------------------
// Accuracy helpers
// --------------------------
const toNumber = (v: any, defaultValue = 0) => {
  if (v === null || v === undefined || v === '') return defaultValue;
  const n = Number(String(v).toString().replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : defaultValue;
};



const clamp = (x: number, min = 0, max = 100) => Math.min(max, Math.max(min, x));
const round = (x: number, d = 1) => Number.isFinite(x) ? Number(x.toFixed(d)) : 0;

const safeRate = (num: number, den: number) => (den > 0 ? (num / den) * 100 : 0);

const parseDate = (v: any): Date | null => {
  if (!v) return null;
  const s = String(v).trim();
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d;
  // try DD/MM/YYYY or MM/DD/YYYY
  const m = s.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (m) {
    const [_, a, b, c] = m;
    const dd = Number(a);
    const mm = Number(b) - 1;
    const yy = Number(c) < 100 ? 2000 + Number(c) : Number(c);
    const alt = new Date(yy, mm, dd);
    return isNaN(alt.getTime()) ? null : alt;
  }
  return null;
};

const percentDiff = (actual: number, benchmark: number) =>
  benchmark === 0 ? 0 : ((actual - benchmark) / benchmark) * 100;

// ---------------- Dynamic mapping engine (drop-in) ----------------

type RawField = { name: string; type?: string; value?: any[] };

const NUM = (v: any) => {
  if (v === null || v === undefined || v === '') return NaN;
  const t = String(v).replace(/[^0-9.+-]/g, '');
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
};
const BOOL = (v: any) => {
  const s = String(v ?? '').trim().toLowerCase();
  if (v === true || v === 1) return true;
  if (v === false || v === 0) return false;
  return ['y','yes','true','1','readmit','readmitted','readmission'].includes(s);
};
const PARSE_DATE = (v: any): Date | null => {
  if (!v) return null;
  const s = String(v).trim();
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d;
  const m = s.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (m) {
    const dd = +m[1], mm = +m[2]-1, yy = +m[3] < 100 ? 2000 + +m[3] : +m[3];
    const d2 = new Date(yy, mm, dd);
    return isNaN(d2.getTime()) ? null : d2;
  }
  return null;
};

function scoreName(name: string, keywords: (string|RegExp)[]) {
  const s = name.toLowerCase();
  let score = 0;
  for (const k of keywords) {
    if (typeof k === 'string') { if (s.includes(k)) score += 1; }
    else { if (k.test(s)) score += 1.5; }
  }
  return score;
}

function sample(values: any[], take = 30) {
  if (!values?.length) return [];
  const step = Math.max(1, Math.floor(values.length / Math.min(values.length, take)));
  const out = [];
  for (let i = 0; i < values.length; i += step) out.push(values[i]);
  return out;
}

function detectPatternScore(values: any[], kind: 'date'|'bool'|'num'|'age'|'los'|'cost'|'satisfaction'|'risk') {
  const v = sample(values);
  let ok = 0, total = v.length || 1;
  for (const x of v) {
    if (kind === 'date') { if (PARSE_DATE(x)) ok++; }
    if (kind === 'bool') { const s = String(x).toLowerCase(); if (['true','false','yes','no','y','n','1','0','readmit','readmission'].includes(s)) ok++; }
    if (kind === 'num')  { if (Number.isFinite(NUM(x))) ok++; }
    if (kind === 'age')  { const n = NUM(x); if (n>=0 && n<=110) ok++; }
    if (kind === 'los')  { const n = NUM(x); if (n>=0 && n<=180) ok++; }
    if (kind === 'cost') { const n = NUM(x); if (Number.isFinite(n)) ok++; }
    if (kind === 'satisfaction') { const n = NUM(x); if ((n>=1 && n<=5) || (n>=0 && n<=100)) ok++; }
    if (kind === 'risk') { const n = NUM(x); const s = String(x).toLowerCase(); if ((n>=0 && n<=100) || ['low','medium','med','high'].includes(s)) ok++; }
  }
  return ok / total; // 0..1
}

// 1) Stronger name weighting + allow a guard predicate + minScore
function bestField(
  fields: RawField[],
  candidates: {
    nameHints: (string|RegExp)[];
    pattern: Parameters<typeof detectPatternScore>[1];
    bonus?: (f: RawField) => number;
    guard?: (f: RawField) => boolean;     // NEW
    minScore?: number;                    // NEW
    requireName?: boolean;                // NEW: only choose if name hits
  }
): RawField | undefined {
  let best: { idx: number; score: number } | null = null;
  for (let idx = 0; idx < fields.length; idx++) {
    const f = fields[idx];
    if (candidates.guard && !candidates.guard(f)) continue;     // apply guard first
    const nameHit = scoreName(f.name, candidates.nameHints);   // count name matches
    const nameWeight = candidates.requireName ? (nameHit > 0 ? 1 : 0) : 1;
    if (nameWeight === 0) continue; // require a name match if set

    const nScore = nameHit * 2.0;                               // ↑ name weight
    const pScore = detectPatternScore(f.value || [], candidates.pattern) * 1.6;
    const b = candidates.bonus ? candidates.bonus(f) : 0;
    const score = (nScore + pScore + b);

    if (!best || score > best.score) best = { idx, score };
  }
  if (!best) return undefined;
  if (candidates.minScore && best.score < candidates.minScore) return undefined;
  return fields[best.idx];
}

function normalizeSatisfaction(v: any) {
  const n = NUM(v);
  if (Number.isFinite(n)) return n > 5 ? Math.min(5, Math.max(1, n/20)) : Math.min(5, Math.max(1, n));
  return 0;
}
function normalizeRisk(v: any) {
  const s = String(v ?? '').toLowerCase();
  if (s === 'low') return 25;
  if (s.startsWith('med')) return 55;
  if (s === 'high') return 85;
  const n = NUM(v);
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0;
}

// 2) Guards and preferences to stop picking `id` / numeric-only columns
const isTextual = (f: RawField) => {
  const vals = sample(f.value || []);
  // consider textual if most samples are non-numeric
  const textish = vals.filter(v => !Number.isFinite(NUM(v))).length / Math.max(1, vals.length);
  return textish > 0.5;
};



// Age range detection regex
const AGE_RANGE_RE = /^(?:\d{1,2}-\d{1,2}|\d{2}\+|under\s*\d{1,2}|over\s*\d{1,2}|\d{1,2}\+)$/i;

// 3) Rebuild the auto-mapper with stricter rules
function buildAutoMapper(fields: RawField[]) {
  const patientIdF = bestField(fields, {
    nameHints: [/patient.*id/, /pat.*no/, 'patient', /cust.*id/, 'customerid', 'user_id'],
    pattern: 'num',
    guard: f => !/^(id|index|row|serial)$/i.test(f.name),
  });

  const ageF = bestField(fields, {
    nameHints: ['patient_age','age'],
    pattern: 'age',
    guard: f => !/^(id|index)$/i.test(f.name),
    requireName: true,               // must contain "age"
  });

  const deptF = bestField(fields, {
    nameHints: ['department','dept','unit','ward','service','category'],
    pattern: 'num',
    guard: f => {
      // Must be textual
      if (!isTextual(f)) return false;
      // Must not be age-related
      if (/age\s*group|agegroup|age/i.test(f.name)) return false;
      // Must not match age range patterns
      const sampleValues = sample(f.value || []);
      const hasAgeRanges = sampleValues.some(v => AGE_RANGE_RE.test(String(v)));
      if (hasAgeRanges) return false;
      return true;
    },
    requireName: true, // Must have a department-like name
  });

  const condF = bestField(fields, {
    nameHints: ['condition','diagnosis','disease','illness','productname'],
    pattern: 'num',
    guard: isTextual,                // avoid numeric-only columns
  });

  const admitF = bestField(fields, {
    nameHints: ['admission','admit','visit','entry','date','event_timestamp'],
    pattern: 'date',
  });

  const dischargeF = bestField(fields, {
    nameHints: ['discharge','release','exit','out_date'],
    pattern: 'date',
  });

  const losF = bestField(fields, {
    nameHints: ['length_of_stay','los','stay','duration','days'],
    pattern: 'los',
    guard: f => !/^(id|index)$/i.test(f.name),
    requireName: true,               // must contain LOS-related token
  });

  // COST: prefer event_value/amount/cost over price
  const costFprimary = bestField(fields, {
    nameHints: ['event_value','amount','cost','charge','bill'],
    pattern: 'cost',
    requireName: true,
  });
  const costFfallback = !costFprimary ? bestField(fields, {
    nameHints: ['price','competitorprice'],
    pattern: 'cost',
  }) : undefined;
  const costF = costFprimary || costFfallback;

  const readmF = bestField(fields, {
    nameHints: ['readmission','readmit','return','30'],
    pattern: 'bool',
    requireName: true,               // avoid picking arbitrary booleans
  });

  const outcomeF = bestField(fields, {
    nameHints: ['outcome','result','status','discharge_status'],
    pattern: 'num',
  });

  const satisF = bestField(fields, {
    nameHints: ['satisfaction','rating','score','csat','nps'],
    pattern: 'satisfaction',
  });

  const riskF = bestField(fields, {
    nameHints: ['risk','severity','priority'],
    pattern: 'risk',
  });

  return {
    fieldsChosen: {
      patientId: patientIdF?.name, age: ageF?.name, dept: deptF?.name, cond: condF?.name,
      admit: admitF?.name, discharge: dischargeF?.name, los: losF?.name, cost: costF?.name,
      readm: readmF?.name, outcome: outcomeF?.name, satis: satisF?.name, risk: riskF?.name
    },
    mapRow: (i: number) => {
      const get = (f?: RawField) => (f?.value?.[i]);

      // derive LOS from dates if explicit LOS missing
      const aDate = PARSE_DATE(get(admitF));
      const dDate = PARSE_DATE(get(dischargeF));
      let length_of_stay = Number.isFinite(NUM(get(losF))) ? NUM(get(losF)) : undefined;
      if ((!length_of_stay || isNaN(length_of_stay)) && aDate && dDate) {
        length_of_stay = Math.max(0, Math.round((dDate.getTime() - aDate.getTime()) / 86400000));
      }

      // fallbacks for dept/condition using retail-like columns from your file
      const deptFallbackField = fields.find(f => /category/i.test(f.name));
      
      // Additional fallback: look for fields with common department names in their values
      const deptFallbackByContent = !deptF && !deptFallbackField ? 
        fields.find(f => {
          const sampleVals = sample(f.value || []);
          const commonDepts = ['cardiology', 'emergency', 'pediatrics', 'surgery', 'orthopedics', 'neurology', 'oncology', 'radiology', 'icu', 'er'];
          return sampleVals.some(v => commonDepts.some(dept => String(v).toLowerCase().includes(dept)));
        }) : undefined;
      
      const deptValue = get(deptF) ?? get(deptFallbackField) ?? get(deptFallbackByContent) ?? 'Unspecified';
      const condFallback = get(condF) ?? get(fields.find(f => /productname/i.test(f.name)));

      // cost fallback order: event_value/amount/cost → price
      const rawCost = get(costF) ?? get(fields.find(f => /price$/i.test(f.name)));

      return {
        patient_id: String(get(patientIdF) ?? i + 1),
        patient_age: Number.isFinite(NUM(get(ageF))) ? NUM(get(ageF)) : undefined,
        age_group: Number.isFinite(NUM(get(ageF))) ? (NUM(get(ageF)) >= 65 ? 'Senior' : 'Adult') : undefined,
        department: deptValue?.toString(),
        condition: (condFallback ?? 'Unspecified')?.toString(),
        admission_date: aDate ? aDate.toISOString().slice(0, 10) : (PARSE_DATE(get(dischargeF))?.toISOString().slice(0,10)),
        length_of_stay,
        cost: Number.isFinite(NUM(rawCost)) ? NUM(rawCost) : undefined,
        readmission: readmF ? BOOL(get(readmF)) : false,
        outcome: (get(outcomeF) ?? '').toString(),
        satisfaction: normalizeSatisfaction(get(satisF)),
        risk_score: normalizeRisk(get(riskF)),
      } as HealthcareRecord;
    }
  };
}

// --------------------------
// Benchmarks (illustrative defaults; can be made tenant-configurable)
// --------------------------
const BENCHMARKS = {
  readmissionRate30d: 12.0, // %
  recoveryRate: 92.0,       // %
  avgLengthOfStay: 4.5,     // days (acute care mixed)
  avgSatisfaction: 4.2,     // /5
};

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'];

export default function HealthcareAnalysis({ fileData, onDataProcessed, isProcessing = false }: HealthcareAnalysisProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'all' | '3months' | '6months' | '12months'>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [analysisType, setAnalysisType] = useState<'overview' | 'detailed' | 'predictive'>('overview');
  const [loading, setLoading] = useState(false);

  // --------------------------
  // -------- Replace your convertFileDataToRecords with this --------
  const convertFileDataToRecords = (data: FileData | undefined): { records: HealthcareRecord[]; mappedNames: any } => {
    if (!data?.content?.fields?.length) return { records: [], mappedNames: {} };
    const fields: RawField[] = data.content.fields as any;

    const mapper = buildAutoMapper(fields);
    const count = fields[0]?.value?.length || 0;
    const records: HealthcareRecord[] = [];
    for (let i = 0; i < count; i++) {
      records.push(mapper.mapRow(i));
    }
    // Optional: console.table(mapper.fieldsChosen);
    return { records, mappedNames: mapper.fieldsChosen };
  };

  // Fallback sample (only used if there is truly no data)
  const sampleData: HealthcareRecord[] = useMemo(() => {
    // Keep deterministic synthetic data for demo (no Math.random)
    const departments = ['Cardiology', 'Oncology', 'Emergency', 'Surgery', 'Pediatrics', 'Neurology'];
    const conditions = ['Heart Disease', 'Cancer', 'Diabetes', 'Pneumonia', 'Stroke', 'Fracture'];
    const outcomes = ['Recovered', 'Improved', 'Stable', 'Discharged'];
    const rows: HealthcareRecord[] = [];
    for (let i = 0; i < 360; i++) {
      const idx = i % departments.length;
      const cdx = i % conditions.length;
      const odx = i % outcomes.length;
      const day = (i % 28) + 1;
      const month = (i % 12);
      rows.push({
        patient_id: `P${1000 + i}`,
        patient_age: 22 + (i % 78),
        age_group: (22 + (i % 78)) >= 65 ? 'Senior' : 'Adult',
        department: departments[idx],
        condition: conditions[cdx],
        admission_date: new Date(2024, month, day).toISOString().slice(0, 10),
        length_of_stay: 2 + (i % 7),
        cost: 8000 + (i % 9) * 2500,
        readmission: i % 17 === 0,
        outcome: outcomes[odx],
        satisfaction: 3 + ((i % 21) / 21) * 2,
        risk_score: (i % 101)
      });
    }
    return rows;
  }, []);

  const healthcareData = useMemo(() => {
    const { records } = convertFileDataToRecords(fileData);
    const finalData = records.length ? records : sampleData;
    onDataProcessed?.(finalData);
    return finalData;
  }, [fileData, onDataProcessed, sampleData]);

  const mappedNames = useMemo(() => {
    const { mappedNames } = convertFileDataToRecords(fileData);
    return mappedNames;
  }, [fileData]);

  // --------------------------
  // Filters
  // --------------------------
  const filteredData = useMemo(() => {
    let data = healthcareData.filter(r => r && Object.keys(r).length);

    // department
    if (selectedDepartment !== 'all') {
      data = data.filter(r => (r.department || '').toString() === selectedDepartment);
    }

    // time
    if (selectedTimeRange !== 'all') {
      const now = new Date();
      const cutoff = {
        '3months': new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()),
        '6months': new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()),
        '12months': new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
      }[selectedTimeRange];

      if (cutoff) {
        data = data.filter(r => {
          const d = parseDate(r.admission_date);
          return d ? d >= cutoff : true;
        });
      }
    }

    return data;
  }, [healthcareData, selectedDepartment, selectedTimeRange]);

  // --------------------------
  // Derived dimensions
  // --------------------------
  const availableDepartments = useMemo(() => {
    if (!healthcareData.length) return [];
    const departments = [...new Set(
      healthcareData
        .map(d => d.department)
        .filter(v => v && !AGE_RANGE_RE.test(String(v)))
    )].sort();
    
    // Debug logging
    console.log('Available departments:', departments);
    console.log('Sample healthcare data:', healthcareData.slice(0, 3));
    
    return departments;
  }, [healthcareData]);

  // --------------------------
  // Analytics (deterministic, robust)
  // --------------------------
  const analytics = useMemo(() => {
    const rows = filteredData;
    const N = rows.length;

    if (!N) {
      return {
        totalPatients: 0,
        avgAge: 0,
        avgLengthOfStay: 0,
        avgCost: 0,
        readmissionRate: 0,
        recoveryRate: 0,
        avgSatisfaction: 0,
        highRiskPatients: 0,
        departmentStats: [] as any[],
        conditionStats: [] as any[],
        monthlyTrends: [] as any[],
        outcomeTrends: [] as any[],
        costPerRecovered: 0,
        benchmarks: BENCHMARKS,
      };
    }

    const num = (k: keyof HealthcareRecord) => rows.map(r => toNumber(r[k] as any, NaN)).filter(Number.isFinite) as number[];

    const age = num('patient_age');
    const stay = num('length_of_stay');
    const cost = num('cost');
    const sat = num('satisfaction');

    const totalPatients = N;
    const avgAge = round(_.mean(age) || 0, 1);
    const avgLengthOfStay = round(_.mean(stay) || 0, 1);
    const avgCost = round(_.mean(cost) || 0, 0);

    const readmissionCount = rows.filter(r => !!r.readmission).length;
    const readmissionRate = round(safeRate(readmissionCount, N), 1);

    // Recovery: outcome string contains recovered/success/discharged
    const recoveredRows = rows.filter(r =>
      String(r.outcome || '').toLowerCase().match(/recover|success|discharg/)
    );
    const recoveryRate = round(safeRate(recoveredRows.length, N), 1);

    const avgSatisfaction = round(_.mean(sat) || 0, 1);

    const highRiskPatients = rows.filter(r => toNumber(r.risk_score, -1) > 70).length;

    // Department stats
    const departmentStats = _(rows)
      .groupBy(r => r.department || 'Unspecified')
      .map((group, dep) => {
        const gN = group.length;
        const gStay = _.mean(group.map(r => toNumber(r.length_of_stay, NaN)).filter(Number.isFinite));
        const gCost = _.mean(group.map(r => toNumber(r.cost, NaN)).filter(Number.isFinite));
        const gSat = _.mean(group.map(r => toNumber(r.satisfaction, NaN)).filter(Number.isFinite));
        const gRecovered = group.filter(r => String(r.outcome || '').toLowerCase().match(/recover|success|discharg/)).length;
        const gReadm = group.filter(r => !!r.readmission).length;
        const gHighRisk = group.filter(r => toNumber(r.risk_score, -1) > 70).length;
        return {
          department: dep,
          totalPatients: gN,
          avgStay: round(gStay || 0, 1),
          avgCost: round(gCost || 0, 0),
          avgSatisfaction: round(gSat || 0, 1),
          recoveryRate: round(safeRate(gRecovered, gN), 1),
          readmissionRate: round(safeRate(gReadm, gN), 1),
          highRiskCount: gHighRisk,
          highRiskPct: round(safeRate(gHighRisk, gN), 1),
        };
      })
      .orderBy(['totalPatients'], ['desc'])
      .value();

    // Condition stats
    const conditionStats = _(rows)
      .groupBy(r => r.condition || 'Unspecified')
      .map((group, cond) => {
        const gN = group.length;
        const gAge = _.mean(group.map(r => toNumber(r.patient_age, NaN)).filter(Number.isFinite));
        const gCost = _.mean(group.map(r => toNumber(r.cost, NaN)).filter(Number.isFinite));
        const gRecovered = group.filter(r => String(r.outcome || '').toLowerCase().match(/recover|success|discharg/)).length;
        const gReadm = group.filter(r => !!r.readmission).length;
        return {
          condition: cond,
          count: gN,
          avgAge: round(gAge || 0, 1),
          avgCost: round(gCost || 0, 0),
          recoveryRate: round(safeRate(gRecovered, gN), 1),
          readmissionRate: round(safeRate(gReadm, gN), 1),
        };
      })
      .orderBy(['count'], ['desc'])
      .value();

    // Monthly trends & outcome stacked
    const monthKey = (r: HealthcareRecord) => {
      const d = parseDate(r.admission_date);
      return d ? d.toISOString().slice(0, 7) : 'Unknown';
    };

    const monthlyGrouped = _.groupBy(rows, monthKey);

    const monthlyTrends = Object.entries(monthlyGrouped)
      .map(([month, group]) => {
        const gN = group.length;
        const gCost = _.mean(group.map(r => toNumber(r.cost, NaN)).filter(Number.isFinite));
        const gRecovered = group.filter(r => String(r.outcome || '').toLowerCase().match(/recover|success|discharg/)).length;
        return {
          month,
          admissions: gN,
          avgCost: round(gCost || 0, 0),
          recoveryRate: round(safeRate(gRecovered, gN), 1),
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));

    const bucketOf = (o: string) => {
      const s = (o || '').toLowerCase();
      if (s.includes('recover')) return 'Recovered';
      if (s.includes('improv')) return 'Improved';
      if (s.includes('stable')) return 'Stable';
      if (s.includes('discharg')) return 'Discharged';
      return 'Other';
    };

    const outcomeTrends = Object.entries(monthlyGrouped)
      .map(([month, group]) => {
        const counts: Record<string, number> = { Recovered: 0, Improved: 0, Stable: 0, Discharged: 0, Other: 0 };
        group.forEach(r => {
          counts[bucketOf(String(r.outcome))]++;
        });
        return { month, ...counts } as any;
      })
      .sort((a, b) => a.month.localeCompare(b.month));

    // Cost per recovered patient
    const totalCostRecovered = _.sum(recoveredRows.map(r => toNumber(r.cost, 0)));
    const costPerRecovered = recoveredRows.length ? round(totalCostRecovered / recoveredRows.length, 0) : 0;

    return {
      totalPatients,
      avgAge,
      avgLengthOfStay,
      avgCost,
      readmissionRate,
      recoveryRate,
      avgSatisfaction,
      highRiskPatients,
      departmentStats,
      conditionStats,
      monthlyTrends,
      outcomeTrends,
      costPerRecovered,
      benchmarks: BENCHMARKS,
    };
  }, [filteredData]);

  // --------------------------
  // Export with insights (CSV)
  // --------------------------
  const handleExport = () => {
    const lines: string[] = [];
    lines.push('Insight,Value');
    lines.push(`Total Patients,${analytics.totalPatients}`);
    lines.push(`Recovery Rate (%),${analytics.recoveryRate}`);
    lines.push(`Readmission Rate (%),${analytics.readmissionRate}`);
    lines.push(`Avg Length of Stay (days),${analytics.avgLengthOfStay}`);
    lines.push(`Avg Cost,${analytics.avgCost}`);
    lines.push(`Avg Satisfaction (/5),${analytics.avgSatisfaction}`);
    lines.push(`High-Risk Patients,${analytics.highRiskPatients}`);
    lines.push(`Cost per Recovered,${analytics.costPerRecovered}`);

    lines.push('');
    lines.push('Department,Patients,Avg Stay,Avg Cost,Recovery %,Readmission %,High Risk %');
    analytics.departmentStats.forEach(d => {
      lines.push([
        d.department,
        d.totalPatients,
        d.avgStay,
        d.avgCost,
        d.recoveryRate,
        d.readmissionRate,
        d.highRiskPct,
      ].join(','));
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `healthcare_insights_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const refreshData = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 600);
  };

  // --------------------------
  // UI
  // --------------------------
  if (!fileData && !healthcareData.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Upload Healthcare Data</h2>
            <p className="text-gray-600 mb-6">
              Upload your healthcare dataset (CSV, Excel) to analyze patient data,
              department performance, and treatment outcomes.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg text-left max-w-2xl mx-auto">
              <h3 className="font-semibold text-blue-800 mb-2">Expected Data Fields:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Patient ID, Age, Department</li>
                <li>• Medical Condition, Admission Date</li>
                <li>• Length of Stay, Treatment Cost</li>
                <li>• Readmission Status, Outcome</li>
                <li>• Patient Satisfaction (1–5), Risk Score (0–100)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-blue-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Healthcare Analytics Dashboard</h1>
              <p className="text-gray-600">
                {fileData ? `Analyzing: ${fileData.name}` : 'Patient care KPIs and operational insights'}
              </p>
              {fileData && (
                <p className="text-sm text-blue-600 mt-1">
                  {healthcareData.length} records processed • {filteredData.length} in current view
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={refreshData}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                disabled={loading || isProcessing}
              >
                <RefreshCw className={`w-4 h-4 ${loading || isProcessing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Insights
              </button>
            </div>
          </div>
        </div>

        {/* Processing indicator */}
        {isProcessing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="text-blue-800 font-medium">Processing healthcare data…</span>
            </div>
          </div>
        )}

        {/* Debug */}
        {fileData && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-yellow-800 mb-2">Data Mapping (debug)</h3>
            <div className="text-sm text-yellow-700 space-y-1">
              <p>• File: {fileData.name}</p>
              <p>• Fields detected: {fileData.content?.fields?.length || 0}</p>
              <p>• Records processed: {healthcareData.length}</p>
              <p>• Filtered records: {filteredData.length}</p>
              <p className="text-xs text-blue-700 mt-1">
                Mapped fields → Dept: <b>{mappedNames.dept || '—'}</b>, Cond: <b>{mappedNames.cond || '—'}</b>, Cost: <b>{mappedNames.cost || '—'}</b>
              </p>
              <p className="text-xs text-green-700 mt-1">
                Found departments: <b>{availableDepartments.length > 0 ? availableDepartments.join(', ') : 'None detected'}</b>
              </p>
              <p className="text-xs text-purple-700 mt-1">
                Department field mapped: <b>{mappedNames.dept || 'None'}</b> | 
                Sample dept values: <b>{healthcareData.slice(0, 3).map(d => d.department).join(', ')}</b>
              </p>
              <p className="text-xs text-orange-700 mt-1">
                All unique departments: <b>{[...new Set(healthcareData.map(d => d.department))].slice(0, 10).join(', ')}</b>
                {healthcareData.length > 0 && [...new Set(healthcareData.map(d => d.department))].length > 10 && '...'}
              </p>
            </div>
            
            {/* All Available Fields */}
            <div className="mt-4">
              <h4 className="font-semibold text-yellow-800 mb-2">All Available Fields:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {fileData.content?.fields?.map((field: any, index: number) => (
                  <div key={index} className="bg-white p-2 rounded border text-xs">
                    <div className="font-medium text-gray-800">{field.name}</div>
                    <div className="text-gray-600">
                      Type: {Array.isArray(field.value) ? 
                        (field.value.length > 0 ? 
                          (typeof field.value[0] === 'number' ? 'Number' : 
                           typeof field.value[0] === 'string' ? 'Text' : 
                           typeof field.value[0] === 'boolean' ? 'Boolean' : 'Mixed') : 'Empty') : 
                        'Unknown'}
                    </div>
                    <div className="text-gray-500">
                      Sample: {Array.isArray(field.value) && field.value.length > 0 ? 
                        (typeof field.value[0] === 'string' && field.value[0].length > 20 ? 
                         field.value[0].substring(0, 20) + '...' : 
                         String(field.value[0])) : 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <span className="font-semibold text-gray-700">Filters:</span>
            </div>
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="12months">Last 12 Months</option>
            </select>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Departments</option>
              {availableDepartments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select
              value={analysisType}
              onChange={(e) => setAnalysisType(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="overview">Overview</option>
              <option value="detailed">Detailed Analysis</option>
              <option value="predictive">Predictive Insights</option>
            </select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <Users className="w-8 h-8 opacity-80" />
              <span className="text-2xl font-bold">{analytics.totalPatients.toLocaleString()}</span>
            </div>
            <h3 className="text-lg font-semibold mt-2">Total Patients</h3>
            <p className="text-blue-100 text-sm">In selected period</p>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <Heart className="w-8 h-8 opacity-80" />
              <div className="text-right">
                <div className="text-2xl font-bold">{analytics.recoveryRate}%</div>
                <div className="text-xs flex items-center gap-1 justify-end opacity-90">
                  <Target className="w-3 h-3" /> {BENCHMARKS.recoveryRate}% benchmark
                </div>
              </div>
            </div>
            <h3 className="text-lg font-semibold mt-2">Recovery Rate</h3>
            <p className="text-green-100 text-sm">{round(percentDiff(analytics.recoveryRate, BENCHMARKS.recoveryRate), 1)}% vs benchmark</p>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <DollarSign className="w-8 h-8 opacity-80" />
              <span className="text-2xl font-bold">${Number(analytics.avgCost).toLocaleString()}</span>
            </div>
            <h3 className="text-lg font-semibold mt-2">Avg Treatment Cost</h3>
            <p className="text-orange-100 text-sm">Cost per episode</p>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <AlertCircle className="w-8 h-8 opacity-80" />
              <div className="text-right">
                <div className="text-2xl font-bold">{analytics.readmissionRate}%</div>
                <div className="text-xs flex items-center gap-1 justify-end opacity-90">
                  <Target className="w-3 h-3" /> {BENCHMARKS.readmissionRate30d}% target
                </div>
              </div>
            </div>
            <h3 className="text-lg font-semibold mt-2">30‑day Readmission</h3>
            <p className="text-purple-100 text-sm">{round(percentDiff(analytics.readmissionRate, BENCHMARKS.readmissionRate30d), 1)}% vs target</p>
          </div>
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{analytics.avgAge}</p>
                <p className="text-gray-600 text-sm">Avg Age</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{analytics.avgLengthOfStay}</p>
                <p className="text-gray-600 text-sm">Avg LOS (days) • Target {BENCHMARKS.avgLengthOfStay}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Activity className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{analytics.avgSatisfaction}/5</p>
                <p className="text-gray-600 text-sm">Satisfaction • Benchmark {BENCHMARKS.avgSatisfaction}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{analytics.highRiskPatients}</p>
                <p className="text-gray-600 text-sm">High‑Risk Patients (&gt;70 risk)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Department Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Department Performance</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={analytics.departmentStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value: any, name: string) => [
                  name === 'totalPatients' ? value :
                  name === 'avgCost' ? `$${Number(value).toFixed(0)}` :
                  `${Number(value).toFixed(1)}%`,
                  name === 'totalPatients' ? 'Patients' : name
                ]} />
                <Legend />
                <RechartsBar dataKey="totalPatients" fill="#3B82F6" name="Patients" />
                <RechartsBar dataKey="recoveryRate" fill="#10B981" name="Recovery %" />
                <RechartsBar dataKey="readmissionRate" fill="#EF4444" name="Readmission %" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1"><Info className="w-3 h-3"/> Red bars highlight departments contributing most to readmissions.</p>
          </div>

          {/* Age Groups Distribution */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Age Groups Distribution</h3>
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-lg">
                <Info className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700 font-medium">Shows age groups</span>
              </div>
            </div>
            
            {/* Data Availability Warning */}
            {(!analytics.conditionStats || analytics.conditionStats.length === 0 || analytics.conditionStats.every((item: any) => item.count === 0)) && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <div>
                    <h4 className="font-semibold text-yellow-800">No Age Group Data Available</h4>
                    <p className="text-sm text-yellow-700">
                      The chart is showing zeros because no age group data was detected in your dataset. 
                      Please ensure your data contains age-related columns (like "age", "patient_age", or "age_group").
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={analytics.conditionStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ condition, percent }: any) => `${condition} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  dataKey="count"
                >
                  {analytics.conditionStats.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <Info className="w-3 h-3"/>
              This chart displays the distribution of patients across different age groups (19-35, 36-50, 51-65, 65+)
            </p>
          </div>
        </div>

        {/* Trends */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">Monthly Admissions & Recovery</h3>
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-lg">
              <Info className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700 font-medium">Patient trends over time</span>
            </div>
          </div>
          
          {/* Chart Explanation */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">What this chart shows:</p>
                <ul className="space-y-1 text-xs">
                  <li>• <strong>Blue area:</strong> Number of patient admissions each month</li>
                  <li>• <strong>Green bars:</strong> Recovery rate percentage for each month</li>
                  <li>• <strong>Trend analysis:</strong> See if admissions and recovery rates are improving over time</li>
                </ul>
              </div>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={analytics.monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip formatter={(value: any, name: string) => [
                name === 'admissions' ? value :
                name === 'avgCost' ? `$${Number(value).toFixed(0)}` : `${Number(value).toFixed(1)}%`,
                name === 'admissions' ? 'Admissions' : name
              ]} />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="admissions" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.55} />
              <RechartsBar yAxisId="right" dataKey="recoveryRate" fill="#10B981" />
            </AreaChart>
          </ResponsiveContainer>
          
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <Info className="w-3 h-3"/>
            This chart tracks patient admission volumes and recovery success rates month by month to identify seasonal patterns and care quality trends.
          </p>
        </div>

        {/* Outcome Stacked by Month */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">Outcome Mix by Month</h3>
            <div className="flex items-center gap-2 bg-purple-50 px-3 py-1 rounded-lg">
              <Info className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-purple-700 font-medium">Patient treatment results</span>
            </div>
          </div>
          
          {/* Chart Explanation */}
          <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-indigo-600 mt-0.5" />
              <div className="text-sm text-indigo-800">
                <p className="font-medium mb-1">What this chart shows:</p>
                <ul className="space-y-1 text-xs">
                  <li>• <strong>Green bars:</strong> Patients who fully recovered</li>
                  <li>• <strong>Blue bars:</strong> Patients who showed improvement</li>
                  <li>• <strong>Orange bars:</strong> Patients who remained stable</li>
                  <li>• <strong>Cyan bars:</strong> Patients who were discharged</li>
                  <li>• <strong>Purple bars:</strong> Other outcomes</li>
                  <li>• <strong>Stacked view:</strong> Total patients per month with outcome breakdown</li>
                </ul>
              </div>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={analytics.outcomeTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <RechartsBar dataKey="Recovered" stackId="a" fill="#10B981" />
              <RechartsBar dataKey="Improved" stackId="a" fill="#3B82F6" />
              <RechartsBar dataKey="Stable" stackId="a" fill="#F59E0B" />
              <RechartsBar dataKey="Discharged" stackId="a" fill="#06B6D4" />
              <RechartsBar dataKey="Other" stackId="a" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
          
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <Info className="w-3 h-3"/>
            This chart shows how patient treatment outcomes are distributed each month, helping identify trends in recovery success and care effectiveness.
          </p>
        </div>

        {/* Detailed & RCA */}
        {analysisType !== 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Readmission Root Causes */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Top Readmission Drivers</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2">Department / Condition</th>
                      <th className="text-right py-2">Readmissions</th>
                      <th className="text-right py-2">Patients</th>
                      <th className="text-right py-2">Rate %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {_(filteredData)
                      .filter(r => !!r.readmission)
                      .groupBy(r => `${r.department || 'Unspecified'} | ${r.condition || 'Unspecified'}`)
                      .map((g, key) => ({ key, readm: g.length, total: filteredData.filter(r => `${r.department || 'Unspecified'} | ${r.condition || 'Unspecified'}` === key).length }))
                      .orderBy(['readm'], ['desc'])
                      .take(8)
                      .map((row, i) => (
                        <tr key={i} className="border-b border-gray-100">
                          <td className="py-2 font-medium">{row.key}</td>
                          <td className="text-right py-2">{row.readm}</td>
                          <td className="text-right py-2">{row.total}</td>
                          <td className="text-right py-2">{round(safeRate(row.readm, row.total), 1)}%</td>
                        </tr>
                      ))
                      .value()}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500 mt-2">Focus care-transition planning and follow-ups for the top pairs above.</p>
            </div>

            {/* Department Satisfaction Heatmap */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Satisfaction Heatmap by Department</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2">Department</th>
                      <th className="text-right py-2">Avg Satisfaction</th>
                      <th className="text-right py-2">High‑Risk %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.departmentStats.map((d, i) => {
                      // color scale 3.0→red to 4.8→green
                      const val = Number(d.avgSatisfaction) || 0;
                      const t = clamp((val - 3) / (4.8 - 3), 0, 1);
                      const r = Math.round(255 * (1 - t));
                      const g = Math.round(255 * t);
                      const bg = `rgba(${r}, ${g}, 120, 0.12)`;
                      return (
                        <tr key={i} className="border-b border-gray-100">
                          <td className="py-2 font-medium">{d.department}</td>
                          <td className="text-right py-2">
                            <span className="px-2 py-1 rounded" style={{ background: bg }}>{d.avgSatisfaction.toFixed(1)}</span>
                          </td>
                          <td className="text-right py-2">{d.highRiskPct.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Predictive Guidance */}
        {analysisType === 'predictive' && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Predictive Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-4 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-800">Projected Readmission Window</h4>
                </div>
                <p className="text-gray-700 text-sm">
                  Based on current performance, 30‑day readmission may vary between {round(analytics.readmissionRate * 0.9, 1)}% and {round(analytics.readmissionRate * 1.1, 1)}% next quarter.
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-green-800">Bed‑Day Demand</h4>
                </div>
                <p className="text-gray-700 text-sm">
                  Expected bed‑days next month ≈ admissions × Avg LOS. If admissions grow 5–8%, plan for an additional {round(analytics.avgLengthOfStay * analytics.totalPatients * 0.06 / 12, 0)} bed‑days.
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold text-purple-800">Cost per Recovery</h4>
                </div>
                <p className="text-gray-700 text-sm">
                  Current cost per recovered patient is ${analytics.costPerRecovered.toLocaleString()}. Prioritize pathways that reduce LOS without harming outcomes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm mt-12 mb-6">
          <p>Healthcare Analytics Dashboard — Accuracy‑focused KPIs & benchmarks</p>
          <p className="mt-1">Data updated: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
