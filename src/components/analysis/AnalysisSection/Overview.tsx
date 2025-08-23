import { Database, Hash, AlignLeft, TrendingUp, Eye, Calendar } from 'lucide-react';
import { DataField } from '../../../types';

interface OverviewProps {
  data: {
    fields: DataField[];
  };
}

export function Overview({ data }: OverviewProps) {
  const numericFields = data.fields.filter(f => f.type === 'number');
  const textFields = data.fields.filter(f => f.type === 'string');
  const dateFields = data.fields.filter(f => f.type === 'date');

  const stats = [
    {
      title: "Total Fields",
      value: data.fields.length,
      icon: <Database className="w-6 h-6" />,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50 hover:bg-blue-100",
      textColor: "text-blue-700",
      description: "All data columns",
      trend: null
    },
    {
      title: "Numeric Fields",
      value: numericFields.length,
      icon: <Hash className="w-6 h-6" />,
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-50 hover:bg-emerald-100",
      textColor: "text-emerald-700",
      description: "Quantitative data",
      trend: numericFields.length > 0 ? "+" : null
    },
    {
      title: "Text Fields",
      value: textFields.length,
      icon: <AlignLeft className="w-6 h-6" />,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50 hover:bg-purple-100",
      textColor: "text-purple-700",
      description: "Categorical data",
      trend: null
    },
    {
      title: "Date Fields",
      value: dateFields.length,
      icon: <Calendar className="w-6 h-6" />,
      color: "from-amber-500 to-amber-600",
      bgColor: "bg-amber-50 hover:bg-amber-100",
      textColor: "text-amber-700",
      description: "Temporal data",
      trend: dateFields.length > 0 ? "📅" : null
    }
  ];

  const getFieldTypePercentage = (count: number) => {
    return data.fields.length > 0 ? ((count / data.fields.length) * 100).toFixed(1) : "0";
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-white p-8 rounded-2xl shadow-lg border border-slate-200/50 backdrop-blur-sm">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Data Overview
          </h2>
          <p className="text-slate-600 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Analyzing {data.fields.length} data field{data.fields.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full text-sm font-medium shadow-lg">
          <TrendingUp className="w-4 h-4" />
          Ready for Analysis
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className={`group relative overflow-hidden rounded-2xl ${stat.bgColor} border border-slate-200/50 p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer`}
          >
            {/* Background Gradient Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
            
            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-white/80 ${stat.textColor} shadow-sm`}>
                  {stat.icon}
                </div>
                {stat.trend && (
                  <span className="text-xs px-2 py-1 bg-white/70 rounded-full font-medium">
                    {stat.trend}
                  </span>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-800">
                    {stat.value}
                  </span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full bg-white/70 ${stat.textColor}`}>
                    {getFieldTypePercentage(stat.value)}%
                  </span>
                </div>
                
                <h3 className="font-semibold text-slate-700 text-sm">
                  {stat.title}
                </h3>
                
                <p className="text-xs text-slate-500">
                  {stat.description}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 w-full bg-white/50 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${stat.color} rounded-full transition-all duration-700 ease-out`}
                  style={{
                    width: `${Math.max(5, parseFloat(getFieldTypePercentage(stat.value)))}%`
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Insights */}
      {data.fields.length > 0 && (
        <div className="bg-gradient-to-r from-slate-100 to-slate-50 rounded-xl p-6 border border-slate-200/50">
          <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Quick Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center p-3 bg-white/70 rounded-lg">
              <span className="font-semibold text-slate-700">Data Diversity</span>
              <p className="text-slate-600 mt-1">
                {numericFields.length > 0 && textFields.length > 0 && dateFields.length > 0
                  ? "Mixed data types detected"
                  : numericFields.length > textFields.length
                  ? "Numeric-heavy dataset"
                  : "Text-heavy dataset"}
              </p>
            </div>
            <div className="text-center p-3 bg-white/70 rounded-lg">
              <span className="font-semibold text-slate-700">Analysis Ready</span>
              <p className="text-slate-600 mt-1">
                {numericFields.length > 0 ? "Statistical analysis possible" : "Categorical analysis only"}
              </p>
            </div>
            <div className="text-center p-3 bg-white/70 rounded-lg">
              <span className="font-semibold text-slate-700">Time Series</span>
              <p className="text-slate-600 mt-1">
                {dateFields.length > 0 ? "Temporal analysis available" : "No time dimension"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {data.fields.length === 0 && (
        <div className="text-center py-12">
          <Database className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-600 mb-2">No Data Fields</h3>
          <p className="text-slate-500">Upload or connect your data to see the overview</p>
        </div>
      )}
    </div>
  );
}