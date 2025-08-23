import React from 'react';
import { Brain, BarChart2, FileText, PlayCircle, LineChart, Database, Share2 } from 'lucide-react';

const services = [
  {
    title: 'Data Analysis',
    description: 'Advanced analytics powered by AI to uncover insights from your data',
    icon: Brain,
    color: 'teal'
  },
  {
    title: 'Visualizations',
    description: 'Interactive charts and dashboards to present your data effectively',
    icon: BarChart2,
    color: 'indigo'
  },
  {
    title: 'Reports',
    description: 'Comprehensive analysis reports with actionable insights',
    icon: FileText,
    color: 'blue'
  },
  {
    title: 'Simulations',
    description: 'Predictive simulations and scenario analysis',
    icon: PlayCircle,
    color: 'purple'
  },
  {
    title: 'Trend Analysis',
    description: 'Track patterns and predict future trends',
    icon: LineChart,
    color: 'green'
  },
  {
    title: 'Data Management',
    description: 'Organize and manage your data efficiently',
    icon: Database,
    color: 'orange'
  },
  {
    title: 'Collaboration',
    description: 'Work together with your team in real-time',
    icon: Share2,
    color: 'pink'
  }
];

const Services: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Our Services</h1>
      <p className="text-lg mb-8">
        Discover our comprehensive suite of data analysis services designed to help you make better decisions with your data.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div
            key={service.title}
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`p-3 rounded-lg bg-${service.color}-50 mb-4 inline-block`}>
              <service.icon className={`w-6 h-6 text-${service.color}-600`} />
            </div>
            <h2 className="text-xl font-semibold mb-2">{service.title}</h2>
            <p className="text-gray-600">{service.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Services; 