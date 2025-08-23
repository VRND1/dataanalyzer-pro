import React from 'react';

interface FeatureCard {
  title: string;
  description: string;
}

const features: FeatureCard[] = [
  {
    title: 'Data Analysis',
    description: 'Analyze your data with AI-powered insights'
  },
  {
    title: 'Reports',
    description: 'Generate comprehensive analysis reports'
  },
  {
    title: 'Trends',
    description: 'Track patterns and predict future trends'
  },
  {
    title: 'Visualization',
    description: 'Create interactive charts and dashboards'
  },
  {
    title: 'Simulation',
    description: 'Run predictive simulations and scenarios'
  },
  {
    title: 'Workspace',
    description: 'Organize and share your analyses'
  }
];

const FeatureCards: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {features.map((feature) => (
        <button
          key={feature.title}
          disabled
          onClick={undefined}
          className="group bg-white/5 backdrop-blur-lg p-4 rounded-xl border border-white/10 transition-all text-left w-full h-full flex flex-col opacity-50 cursor-not-allowed"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{feature.title}</h3>
          <p className="text-gray-600">{feature.description}</p>
        </button>
      ))}
    </div>
  );
};

export default FeatureCards; 