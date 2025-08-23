import { useState } from 'react';
import { 
  Download, Search, FileText,
  TrendingUp, ShoppingCart, Building, 
  Star,
} from 'lucide-react';
import { motion } from 'framer-motion';

const templateCategories = [
  {
    title: "Business Analytics",
    description: "Templates for business intelligence and reporting",
    icon: Building,
    color: "from-blue-500 to-cyan-500",
    templates: [
      {
        title: "Sales Performance Dashboard",
        description: "Comprehensive sales analytics with KPIs, trends, and forecasting",
        downloads: "2.4K",
        rating: 4.8,
        size: "2.3 MB",
        format: "Excel",
        tags: ["Sales", "Dashboard", "KPIs"],
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop",
        featured: true
      },
      {
        title: "Customer Analytics Template",
        description: "Customer segmentation, behavior analysis, and lifetime value",
        downloads: "1.8K",
        rating: 4.7,
        size: "1.9 MB",
        format: "CSV",
        tags: ["Customer", "Segmentation", "Behavior"],
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop"
      },
      {
        title: "Financial Reporting Suite",
        description: "Complete financial analysis with P&L, cash flow, and ratios",
        downloads: "3.1K",
        rating: 4.9,
        size: "4.2 MB",
        format: "Excel",
        tags: ["Financial", "Reporting", "Analysis"],
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop"
      }
    ]
  },
  {
    title: "Marketing Analytics",
    description: "Templates for marketing campaign analysis and ROI tracking",
    icon: TrendingUp,
    color: "from-purple-500 to-pink-500",
    templates: [
      {
        title: "Campaign Performance Tracker",
        description: "Multi-channel marketing campaign analysis and optimization",
        downloads: "1.6K",
        rating: 4.6,
        size: "2.8 MB",
        format: "Excel",
        tags: ["Marketing", "Campaign", "ROI"],
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop"
      },
      {
        title: "Social Media Analytics",
        description: "Social media performance metrics and engagement analysis",
        downloads: "2.2K",
        rating: 4.8,
        size: "1.5 MB",
        format: "CSV",
        tags: ["Social Media", "Engagement", "Metrics"],
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop"
      },
      {
        title: "Email Marketing Dashboard",
        description: "Email campaign performance and subscriber analytics",
        downloads: "1.9K",
        rating: 4.7,
        size: "2.1 MB",
        format: "Excel",
        tags: ["Email", "Campaign", "Subscribers"],
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop"
      }
    ]
  },
  {
    title: "E-commerce Analytics",
    description: "Templates for online store performance and customer insights",
    icon: ShoppingCart,
    color: "from-emerald-500 to-teal-500",
    templates: [
      {
        title: "E-commerce Performance Dashboard",
        description: "Complete online store analytics with sales, inventory, and customer data",
        downloads: "2.7K",
        rating: 4.9,
        size: "3.4 MB",
        format: "Excel",
        tags: ["E-commerce", "Sales", "Inventory"],
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop",
        featured: true
      },
      {
        title: "Product Performance Analysis",
        description: "Product sales trends, inventory optimization, and profitability",
        downloads: "1.4K",
        rating: 4.5,
        size: "1.8 MB",
        format: "CSV",
        tags: ["Products", "Inventory", "Profitability"],
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop"
      },
      {
        title: "Customer Journey Mapping",
        description: "Customer touchpoint analysis and conversion funnel optimization",
        downloads: "1.2K",
        rating: 4.6,
        size: "2.6 MB",
        format: "Excel",
        tags: ["Customer Journey", "Conversion", "Funnel"],
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop"
      }
    ]
  },
  {
    title: "Research & Academic",
    description: "Templates for research projects and academic analysis",
    icon: FileText,
    color: "from-orange-500 to-red-500",
    templates: [
      {
        title: "Survey Data Analysis",
        description: "Comprehensive survey analysis with statistical testing and visualization",
        downloads: "1.8K",
        rating: 4.7,
        size: "2.9 MB",
        format: "Excel",
        tags: ["Survey", "Research", "Statistics"],
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop"
      },
      {
        title: "Experimental Design Template",
        description: "A/B testing framework and experimental data analysis",
        downloads: "1.1K",
        rating: 4.8,
        size: "1.7 MB",
        format: "CSV",
        tags: ["A/B Testing", "Experimental", "Design"],
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop"
      },
      {
        title: "Time Series Analysis",
        description: "Longitudinal data analysis and trend forecasting",
        downloads: "1.5K",
        rating: 4.6,
        size: "2.4 MB",
        format: "Excel",
        tags: ["Time Series", "Forecasting", "Trends"],
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop"
      }
    ]
  }
];

const featuredTemplates = [
  {
    title: "Complete Business Intelligence Suite",
    description: "All-in-one template for comprehensive business analytics",
    downloads: "5.2K",
    rating: 4.9,
    size: "8.7 MB",
    format: "Excel",
    tags: ["Business", "Analytics", "Suite"],
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=338&fit=crop",
    featured: true
  },
  {
    title: "AI-Powered Data Analysis Framework",
    description: "Advanced template with machine learning integration",
    downloads: "3.8K",
    rating: 4.8,
    size: "6.2 MB",
    format: "Python",
    tags: ["AI", "Machine Learning", "Advanced"],
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=338&fit=crop",
    featured: true
  }
];

export function DataTemplates() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);

  const formats = ["Excel", "CSV", "Python", "R", "JSON"];

  const filteredCategories = templateCategories.filter(category =>
    selectedCategory ? category.title === selectedCategory : true
  );

  const handleDownload = (template: any) => {
    // Simulate download
    console.log(`Downloading ${template.title}`);
    // In a real app, this would trigger an actual download
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20" />
        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl">
                <Download className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                Data Templates
              </h1>
            </div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Ready-to-use templates for common data analysis scenarios. Jump-start your projects with professionally designed frameworks.
            </p>
            
            {/* Search and Filters */}
            <div className="max-w-4xl mx-auto mb-12">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedCategory || ''}
                    onChange={(e) => setSelectedCategory(e.target.value || null)}
                    className="px-4 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    {templateCategories.map(category => (
                      <option key={category.title} value={category.title}>{category.title}</option>
                    ))}
                  </select>
                  <select
                    value={selectedFormat || ''}
                    onChange={(e) => setSelectedFormat(e.target.value || null)}
                    className="px-4 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Formats</option>
                    {formats.map(format => (
                      <option key={format} value={format}>{format}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Featured Templates */}
      <div className="max-w-7xl mx-auto px-6 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold text-white mb-8">Featured Templates</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {featuredTemplates.map((template, index) => (
              <motion.div
                key={template.title}
                className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:bg-white/10 transition-all duration-300"
                whileHover={{ scale: 1.02, y: -4 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              >
                <div className="relative">
                  <img 
                    src={template.thumbnail} 
                    alt={template.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300" />
                  <div className="absolute top-4 right-4 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                    FEATURED
                  </div>
                  <div className="absolute bottom-4 left-4 px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded">
                    {template.format}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2">{template.title}</h3>
                  <p className="text-gray-300 mb-4">{template.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Download className="w-4 h-4" />
                        {template.downloads}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400" />
                        {template.rating}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {template.size}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {template.tags.map((tag, tagIndex) => (
                        <span key={tagIndex} className="px-2 py-1 bg-white/10 rounded-full text-xs text-gray-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <button 
                      onClick={() => handleDownload(template)}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300"
                    >
                      Download
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Template Categories */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className="text-3xl font-bold text-white mb-8">Browse by Category</h2>
          <div className="space-y-12">
            {filteredCategories.map((category, categoryIndex) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + categoryIndex * 0.1 }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className={`p-3 bg-gradient-to-r ${category.color} rounded-2xl`}>
                    <category.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{category.title}</h3>
                    <p className="text-gray-300">{category.description}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.templates.map((template, templateIndex) => (
                    <motion.div
                      key={template.title}
                      className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all duration-300"
                      whileHover={{ scale: 1.02, y: -2 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.6 + categoryIndex * 0.1 + templateIndex * 0.05 }}
                    >
                      <div className="relative">
                        <img 
                          src={template.thumbnail} 
                          alt={template.title}
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300" />
                        <div className="absolute top-2 right-2 px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded">
                          {template.format}
                        </div>
                        {template.featured && (
                          <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                            FEATURED
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h4 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                          {template.title}
                        </h4>
                        <p className="text-gray-300 text-sm mb-3">{template.description}</p>
                        <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Download className="w-3 h-3" />
                              {template.downloads}
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-400" />
                              {template.rating}
                            </div>
                            <div className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {template.size}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1">
                            {template.tags.slice(0, 2).map((tag, tagIndex) => (
                              <span key={tagIndex} className="px-2 py-1 bg-white/10 rounded-full text-xs text-gray-300">
                                {tag}
                              </span>
                            ))}
                            {template.tags.length > 2 && (
                              <span className="px-2 py-1 bg-white/10 rounded-full text-xs text-gray-300">
                                +{template.tags.length - 2}
                              </span>
                            )}
                          </div>
                          <button 
                            onClick={() => handleDownload(template)}
                            className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Call to Action */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center p-12 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 backdrop-blur-xl border border-white/10 rounded-3xl"
        >
          <h2 className="text-3xl font-bold text-white mb-4">Need a custom template?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Can't find what you're looking for? Our team can create custom templates tailored to your specific needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300">
              Request Custom Template
            </button>
            <button className="px-8 py-4 border border-white/20 text-white font-bold rounded-xl hover:bg-white/10 transition-all duration-300">
              Share Your Template
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

