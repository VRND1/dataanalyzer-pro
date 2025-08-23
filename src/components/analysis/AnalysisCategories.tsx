import { Brain, Calculator, TrendingUp, BarChart, TestTube, LineChart, Bot, FileText, Timer, Globe, Network, Briefcase, Cpu } from 'lucide-react';
import { DataField, FileData } from '@/types/data';
import { useSearchParams } from 'react-router-dom';
import { IndustryAnalysisView } from './categories/industry';
import { TechnicalAnalysis } from './categories/technical';
import { NLPAnalysisContainer } from './categories/nlp';
import LoadingSpinner from '../common/LoadingSpinner';

interface AnalysisCategoriesProps {
  data: {
    fields: DataField[];
  };
  fileData?: FileData; // Add fileData prop
}

function AnalysisCategories({ data, fileData }: AnalysisCategoriesProps) {
  // Add null check for data
  if (!data || !data.fields) {
    return (
      <div className="glass-card">
        <div className="text-center text-gray-500">
          <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">No Data Available</h3>
          <p className="text-sm">Please upload a file to perform analysis.</p>
        </div>
      </div>
    );
  }

  const [searchParams] = useSearchParams();
  const currentCategory = searchParams.get('category');

  const categories = [
    {
      id: 'descriptive',
      name: 'Basic Statistics',
      icon: Calculator,
      description: 'Mean, median, mode, variance, standard deviation',
      available: data.fields.some(f => f.type === 'number')
    },
    {
      id: 'visualization',
      name: 'Visualizations',
      icon: BarChart,
      description: 'Charts, graphs, and interactive visualizations',
      available: data.fields.some(f => f.type === 'number')
    },
    {
      id: 'correlation',
      name: 'Correlation Analysis',
      icon: TrendingUp,
      description: 'Relationships between variables',
      available: data.fields.filter(f => f.type === 'number').length >= 2
    },
    {
      id: 'hypothesis',
      name: 'Hypothesis Testing',
      icon: TestTube,
      description: 'Statistical significance and confidence intervals',
      available: data.fields.filter(f => f.type === 'number').length >= 2
    },
    {
      id: 'regression',
      name: 'Regression Analysis',
      icon: LineChart,
      description: 'Linear and multiple regression models',
      available: data.fields.filter(f => f.type === 'number').length >= 2
    },
    {
      id: 'ml',
      name: 'Machine Learning',
      icon: Bot,
      description: 'Predictive modeling and pattern recognition',
      available: data.fields.filter(f => f.type === 'number').length >= 2
    },
    {
      id: 'text',
      name: 'Text Analysis',
      icon: FileText,
      description: 'Text mining and sentiment analysis',
      available: data.fields.filter(f => f.type === 'string').length > 0
    },
    {
      id: 'time',
      name: 'Time Series',
      icon: Timer,
      description: 'Temporal patterns and forecasting',
      available: data.fields.some(f => 
        f.type === 'date' || 
        (f.type === 'number' && f.value.length >= 10)
      )
    },
    {
      id: 'spatial',
      name: 'Spatial Analysis',
      icon: Globe,
      description: 'Geographic and location-based analysis',
      available: data.fields.some(f => 
        f.name.toLowerCase().includes('location') ||
        f.name.toLowerCase().includes('lat') ||
        f.name.toLowerCase().includes('lon')
      )
    },
    {
      id: 'business',
      name: 'Business Metrics',
      icon: LineChart,
      description: 'KPIs, ratios, and financial analysis',
      available: data.fields.some(f => 
        f.name.toLowerCase().includes('revenue') ||
        f.name.toLowerCase().includes('profit') ||
        f.name.toLowerCase().includes('sales') ||
        f.name.toLowerCase().includes('cost')
      )
    },
    {
      id: 'network',
      name: 'Network Analysis',
      icon: Network,
      description: 'Graph analysis and relationships',
      available: data.fields.filter(f => 
        f.name.toLowerCase().includes('id') ||
        f.name.toLowerCase().includes('source') ||
        f.name.toLowerCase().includes('target')
      ).length >= 2
    },
    {
      id: 'industry',
      name: 'Industry Analysis',
      icon: Briefcase,
      description: 'Industry-specific analytics and insights',
      available: true,
      component: IndustryAnalysisView
    },
    {
      id: 'technical',
      name: 'Technical Analysis',
      icon: Cpu,
      description: 'System performance, data quality, and processing efficiency',
      available: true,
      component: TechnicalAnalysis
    },
    {
      id: 'nlp',
      name: 'Natural Language Processing',
      icon: Bot,
      description: 'Text understanding, question answering, and language insights',
      available: data.fields.filter(f => f.type === 'string').length > 0,
      component: NLPAnalysisContainer
    }
  ];

  return (
    <div className="glass-card">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="w-5 h-5 text-teal-400" />
        <h3 className="text-lg font-semibold text-black">Analysis Categories</h3>
      </div>

      {/* Show spinner only for Basic Statistics when processing */}
      {currentCategory === 'descriptive' && (
        <LoadingSpinner size={32} color="primary" />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(category => (
          <a
            key={category.id}
            href={`/analysis?category=${category.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`p-4 rounded-lg text-left transition-all duration-300 relative overflow-hidden ${
              category.available
                ? `hover:bg-white/5 cursor-pointer border border-black/10 ${
                    currentCategory === category.id ? 'bg-teal-500/10 border-teal-500/50 shadow-lg shadow-teal-500/20' : ''
                  }`
                : 'opacity-30 pointer-events-none bg-white/5 border border-black/5'
            }`}
            tabIndex={category.available ? 0 : -1}
            aria-disabled={!category.available}
          >
            {currentCategory === category.id && (
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-teal-500 rounded-full shadow-lg shadow-teal-500/50" />
            )}
            <div className="flex items-center gap-2 mb-2">
              <category.icon className={`w-5 h-5 ${
                category.available ? 'text-teal-400' : 'text-gray-400'
              }`} />
              <h4 className="font-medium text-black">{category.name}</h4>
            </div>
            <p className="text-sm text-black">{category.description}</p>
          </a>
        ))}
      </div>

      {/* Render selected category component */}
      {currentCategory && currentCategory !== 'ml' && (
        <div className="mt-8">
          {(() => {
            const category = categories.find(c => c.id === currentCategory);
            if (!category || !category.component) return null;
            const Component = category.component;
            return <Component data={data} fileData={fileData} />;
          })()}
        </div>
      )}
    </div>
  );
}

export { AnalysisCategories };