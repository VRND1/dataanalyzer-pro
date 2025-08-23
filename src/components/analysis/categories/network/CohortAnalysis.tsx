import  { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';

import { Button } from '../../../../components/ui/button';

import { BarChart3, Users, Calendar, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import type { DataField } from '@/types/data';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, Filler);

interface CohortAnalysisProps {
  data?: {
    fields: DataField[];
  };
}

interface Cohort {
  cohort: string;
  size: number;
  retention: number[];
}

function getCohorts(fields: DataField[]): Cohort[] {
  // Find user and date fields
  const userField = fields.find(f => f.name.toLowerCase().includes('user'));
  const dateField = fields.find(f => f.type === 'date' || f.name.toLowerCase().includes('date'));
  if (!userField || !dateField) return [];

  // Build user-date pairs
  const users = userField.value;
  const dates = dateField.value.map((d: any) => new Date(d));
  if (!users || !dates || users.length !== dates.length) return [];

  // Group users by cohort (e.g., month of first activity)
  const userFirstDate: Record<string, Date> = {};
  users.forEach((user: string, i: number) => {
    const date = dates[i];
    if (!userFirstDate[user] || date < userFirstDate[user]) {
      userFirstDate[user] = date;
    }
  });

  // Cohort label: YYYY-MM
  const cohortLabels = Array.from(new Set(Object.values(userFirstDate).map(d => `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}`))).sort();

  // For each cohort, build retention array
  const cohorts: Cohort[] = cohortLabels.map(label => {
    // Users in this cohort
    const cohortUsers = Object.entries(userFirstDate)
      .filter(([, d]) => `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}` === label)
      .map(([user]) => user);
    const size = cohortUsers.length;
    // For each period (week), calculate retention
    const firstDate = new Date(label + '-01');
    const maxWeeks = 8;
    const retention: number[] = [];
    for (let week = 0; week < maxWeeks; week++) {
      // Users active in this week
      const weekStart = new Date(firstDate);
      weekStart.setDate(weekStart.getDate() + week * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const activeUsers = new Set(
        users.filter((user: string, i: number) => {
          if (!cohortUsers.includes(user)) return false;
          const d = dates[i];
          return d >= weekStart && d < weekEnd;
        })
      );
      retention.push(size > 0 ? (activeUsers.size / size) * 100 : 0);
    }
    return { cohort: label, size, retention };
  });
  return cohorts;
}

export function CohortAnalysis({ data }: CohortAnalysisProps) {
  const [showInsights, setShowInsights] = useState(true);
  const cohorts = useMemo(() => (data?.fields ? getCohorts(data.fields) : []), [data]);
  const maxWeeks = 8;

  // Chart data
  const chartData = useMemo(() => {
    if (!cohorts.length) return null;
    return {
      labels: Array.from({ length: maxWeeks }, (_, i) => `Week ${i + 1}`),
      datasets: cohorts.map((cohort, idx) => ({
        label: `${cohort.cohort} (n=${cohort.size})`,
        data: cohort.retention,
        backgroundColor: `hsl(${240 - idx * 30}, 70%, 50%)`,
        borderColor: `hsl(${240 - idx * 30}, 70%, 40%)`,
        borderWidth: 2,
        fill: false,
      })),
    };
  }, [cohorts]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Cohort Retention Over Time' },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { callback: (v: string | number) => `${v}%` },
        title: { display: true, text: 'Retention (%)' },
      },
      x: { title: { display: true, text: 'Weeks Since Cohort Start' } },
    },
  };

  // Key metrics and insights
  const totalCohorts = cohorts.length;
  const avgFirstWeekRetention = cohorts.length
    ? (cohorts.reduce((sum, c) => sum + (c.retention[0] || 0), 0) / cohorts.length)
    : 0;
  const avgFourthWeekRetention = cohorts.length
    ? (cohorts.reduce((sum, c) => sum + (c.retention[3] || 0), 0) / cohorts.length)
    : 0;

  const recommendations: string[] = [];
  if (avgFirstWeekRetention < 40) recommendations.push('Low first-week retention. Consider onboarding improvements.');
  if (avgFourthWeekRetention < 20) recommendations.push('Retention drops sharply by week 4. Investigate user churn causes.');
  if (totalCohorts > 4) recommendations.push('Multiple cohorts detected. Compare retention strategies across periods.');

  return (
    <Card className="p-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          Cohort Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!data?.fields ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-600">Upload data with user and date fields to perform cohort analysis.</p>
          </div>
        ) : !cohorts.length ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Insufficient Data for Cohort Analysis</h3>
            <p className="text-gray-600">User and date fields are required to create a cohort analysis.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Total Cohorts</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">{totalCohorts}</p>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Avg. 1st Week Retention</span>
                </div>
                <p className="text-2xl font-bold text-green-900">{avgFirstWeekRetention.toFixed(1)}%</p>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">Avg. 4th Week Retention</span>
                </div>
                <p className="text-2xl font-bold text-purple-900">{avgFourthWeekRetention.toFixed(1)}%</p>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-white p-6 rounded-lg border">
              <div className="h-80">
                {chartData && <Bar data={chartData} options={chartOptions} />}
              </div>
            </div>

            {/* Cohort Table */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Cohort Retention Table</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead>
                    <tr>
                      <th className="px-2 py-1 border">Cohort</th>
                      <th className="px-2 py-1 border">Size</th>
                      {Array.from({ length: maxWeeks }, (_, i) => (
                        <th key={i} className="px-2 py-1 border">Week {i + 1}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cohorts.map((cohort) => (
                      <tr key={cohort.cohort}>
                        <td className="px-2 py-1 border font-medium">{cohort.cohort}</td>
                        <td className="px-2 py-1 border">{cohort.size}</td>
                        {cohort.retention.map((r, i) => (
                          <td key={i} className="px-2 py-1 border text-center">{r.toFixed(1)}%</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recommendations */}
            {showInsights && recommendations.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-indigo-600" />
                  Recommendations
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <ul className="space-y-2">
                    {recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-blue-800 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            <div className="flex justify-end mt-4">
              <Button variant="outline" size="sm" onClick={() => setShowInsights(!showInsights)}>
                {showInsights ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showInsights ? 'Hide' : 'Show'} Insights
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 