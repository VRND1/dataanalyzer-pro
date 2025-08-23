import { useState } from 'react';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
}

export function WorkspaceTemplates() {
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: '1',
      name: 'Project Management',
      description: 'Track tasks, deadlines, and team collaboration',
      category: 'Productivity',
      icon: '📊',
    },
    {
      id: '2',
      name: 'Design Sprint',
      description: 'Template for running a 5-day design sprint',
      category: 'Design',
      icon: '🎨',
    },
    {
      id: '3',
      name: 'Engineering Team',
      description: 'Code reviews, sprint planning, and bug tracking',
      category: 'Development',
      icon: '💻',
    },
    {
      id: '4',
      name: 'Marketing Campaign',
      description: 'Plan and execute marketing campaigns',
      category: 'Marketing',
      icon: '📢',
    },
    {
      id: '5',
      name: 'Simulation Analysis',
      description: 'Run and analyze various simulations with customizable parameters',
      category: 'Simulations',
      icon: '🔬',
    },
  ]);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['All', ...new Set(templates.map(t => t.category))];

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const createFromTemplate = (templateId: string) => {
    // In a real app, this would create a new workspace
    alert(`Creating workspace from template ${templateId}`);
    console.log('Creating workspace from template:', templateId);
  };

  const deleteTemplate = (templateId: string) => {
    setTemplates(templates.filter(t => t.id !== templateId));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-black mb-6">Workspace Templates</h1>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6 text-black">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search templates..."
            className="w-full p-2 border rounded-md text-black"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div>
          <select
            className="p-2 border rounded-md text-black"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-gray-600">No templates found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => (
            <div key={template.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start mb-4">
                <span className="text-2xl mr-3">{template.icon}</span>
                <div>
                  <h2 className="font-bold text-lg text-black">{template.name}</h2>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {template.category}
                  </span>
                </div>
              </div>
              <p className="text-gray-600 mb-4">{template.description}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => createFromTemplate(template.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Use Template
                </button>
                <button
                  onClick={() => deleteTemplate(template.id)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add new template form (simplified) */}
      <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
        <h2 className="font-bold text-lg mb-4">Add New Template</h2>
        <button 
          onClick={() => {
            const newTemplate = {
              id: Date.now().toString(),
              name: `Custom Template ${templates.length + 1}`,
              description: 'New custom workspace template',
              category: 'Custom',
              icon: '✨',
            };
            setTemplates([...templates, newTemplate]);
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          Add Sample Template
        </button>
      </div>
    </div>
  );
}