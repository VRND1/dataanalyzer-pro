import { LineChart, ListChecks, AlertTriangle, CheckCircle } from 'lucide-react';

interface AnalysisResultsProps {
  results: {
    [key: string]: any;
  };
}

export default function AnalysisResults({ results }: AnalysisResultsProps) {
  const renderValue = (value: any): string => {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const renderSection = (title: string, data: any, icon: React.ReactNode) => {
    if (!data) return null;

    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center gap-2 mb-4">
          {icon}
          <h3 className="text-lg font-semibold text-black">{title}</h3>
        </div>
        {Array.isArray(data) ? (
          <ul className="space-y-2">
            {data.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-black">•</span>
                <span className="text-black">{renderValue(item)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="space-y-2">
            {Object.entries(data).map(([key, value]) => (
              <div key={key} className="flex flex-col">
                <span className="font-medium text-gray-700">{key}:</span>
                <span className="text-black">{renderValue(value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {Object.entries(results).map(([key, value]) => {
        let icon = <LineChart className="text-black" />;
        let title = key.charAt(0).toUpperCase() + key.slice(1);

        // Map common section names to appropriate icons
        switch (key.toLowerCase()) {
          case 'insights':
            icon = <LineChart className="text-black" />;
            break;
          case 'recommendations':
            icon = <ListChecks className="text-black" />;
            break;
          case 'strengths':
            icon = <CheckCircle className="text-black" />;
            break;
          case 'improvements':
          case 'weaknesses':
            icon = <AlertTriangle className="text-black" />;
            break;
        }

        return renderSection(title, value, icon);
      })}
    </div>
  );
}