import  { useState } from 'react';
import { 
  Award, Search, BarChart3, Database, 
  TrendingUp, Zap, CheckCircle,Clock, Lightbulb
} from 'lucide-react';
import { motion } from 'framer-motion';

const practiceCategories = [
  {
    title: "Data Preparation",
    description: "Best practices for cleaning and preparing your data",
    icon: Database,
    color: "from-blue-500 to-cyan-500",
    practices: [
      {
        title: "Data Quality Assessment",
        description: "How to evaluate and improve data quality before analysis",
        difficulty: "Beginner",
        timeToRead: "8 min",
        tags: ["Data Quality", "Cleaning", "Validation"],
        tips: [
          "Always check for missing values and outliers",
          "Validate data types and formats",
          "Document data sources and transformations"
        ],
        featured: true
      },
      {
        title: "Data Cleaning Techniques",
        description: "Effective methods for cleaning messy datasets",
        difficulty: "Intermediate",
        timeToRead: "12 min",
        tags: ["Cleaning", "Preprocessing", "Techniques"],
        tips: [
          "Use consistent naming conventions",
          "Handle duplicates systematically",
          "Standardize date and time formats"
        ]
      },
      {
        title: "Data Validation Strategies",
        description: "Implement robust validation to ensure data integrity",
        difficulty: "Advanced",
        timeToRead: "15 min",
        tags: ["Validation", "Integrity", "Quality"],
        tips: [
          "Set up automated validation rules",
          "Cross-reference with external sources",
          "Implement data lineage tracking"
        ]
      }
    ]
  },
  {
    title: "Statistical Analysis",
    description: "Guidelines for conducting reliable statistical analysis",
    icon: BarChart3,
    color: "from-purple-500 to-pink-500",
    practices: [
      {
        title: "Hypothesis Testing Best Practices",
        description: "Proper procedures for hypothesis testing and significance",
        difficulty: "Intermediate",
        timeToRead: "10 min",
        tags: ["Statistics", "Testing", "Significance"],
        tips: [
          "Always state your null and alternative hypotheses",
          "Choose appropriate significance levels",
          "Consider effect sizes, not just p-values"
        ]
      },
      {
        title: "Sample Size Determination",
        description: "How to determine adequate sample sizes for your analysis",
        difficulty: "Intermediate",
        timeToRead: "14 min",
        tags: ["Sample Size", "Power", "Design"],
        tips: [
          "Use power analysis to determine sample size",
          "Consider practical constraints",
          "Account for expected effect sizes"
        ]
      },
      {
        title: "Multiple Testing Corrections",
        description: "Handling multiple comparisons and avoiding false discoveries",
        difficulty: "Advanced",
        timeToRead: "18 min",
        tags: ["Multiple Testing", "Corrections", "False Discovery"],
        tips: [
          "Use Bonferroni or FDR corrections",
          "Pre-specify your analysis plan",
          "Report all tests conducted"
        ]
      }
    ]
  },
  {
    title: "Visualization",
    description: "Creating effective and ethical data visualizations",
    icon: TrendingUp,
    color: "from-emerald-500 to-teal-500",
    practices: [
      {
        title: "Chart Type Selection",
        description: "Choosing the right chart for your data and audience",
        difficulty: "Beginner",
        timeToRead: "9 min",
        tags: ["Visualization", "Charts", "Selection"],
        tips: [
          "Match chart type to data type",
          "Consider your audience's expertise",
          "Avoid misleading visualizations"
        ]
      },
      {
        title: "Color and Accessibility",
        description: "Using color effectively while ensuring accessibility",
        difficulty: "Intermediate",
        timeToRead: "11 min",
        tags: ["Color", "Accessibility", "Design"],
        tips: [
          "Use colorblind-friendly palettes",
          "Provide sufficient contrast ratios",
          "Don't rely solely on color to convey information"
        ]
      },
      {
        title: "Interactive Visualization Best Practices",
        description: "Creating engaging and useful interactive charts",
        difficulty: "Advanced",
        timeToRead: "16 min",
        tags: ["Interactive", "UX", "Engagement"],
        tips: [
          "Provide clear navigation and controls",
          "Include helpful tooltips and legends",
          "Optimize for performance and loading times"
        ]
      }
    ]
  },
  {
    title: "Machine Learning",
    description: "Best practices for implementing ML models in production",
    icon: Zap,
    color: "from-orange-500 to-red-500",
    practices: [
      {
        title: "Model Validation Strategies",
        description: "Robust validation techniques for ML models",
        difficulty: "Advanced",
        timeToRead: "20 min",
        tags: ["ML", "Validation", "Cross-validation"],
        tips: [
          "Use cross-validation for model selection",
          "Separate validation and test sets",
          "Monitor for data leakage"
        ]
      },
      {
        title: "Feature Engineering Best Practices",
        description: "Creating effective features for machine learning",
        difficulty: "Intermediate",
        timeToRead: "15 min",
        tags: ["Features", "Engineering", "ML"],
        tips: [
          "Understand your domain thoroughly",
          "Handle missing values appropriately",
          "Scale features when necessary"
        ]
      },
      {
        title: "Model Interpretability",
        description: "Making ML models transparent and explainable",
        difficulty: "Advanced",
        timeToRead: "22 min",
        tags: ["Interpretability", "Explainability", "Transparency"],
        tips: [
          "Use interpretable models when possible",
          "Apply SHAP or LIME for explanations",
          "Document model decisions and limitations"
        ]
      }
    ]
  }
];

const featuredPractices = [
  {
    title: "The Complete Data Analysis Workflow",
    description: "A comprehensive guide to conducting end-to-end data analysis projects",
    difficulty: "All Levels",
    timeToRead: "25 min",
    tags: ["Workflow", "End-to-End", "Comprehensive"],
    tips: [
      "Start with clear objectives and questions",
      "Document every step of your process",
      "Validate results with domain experts",
      "Communicate findings effectively"
    ],
    featured: true
  },
  {
    title: "Ethical Data Analysis Guidelines",
    description: "Ensuring your analysis is ethical, fair, and responsible",
    difficulty: "All Levels",
    timeToRead: "18 min",
    tags: ["Ethics", "Responsibility", "Fairness"],
    tips: [
      "Consider privacy and data protection",
      "Avoid bias in analysis and interpretation",
      "Be transparent about limitations",
      "Consider societal impact of findings"
    ],
    featured: true
  }
];

export function BestPractices() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  const difficulties = ["Beginner", "Intermediate", "Advanced", "All Levels"];

  const filteredCategories = practiceCategories.filter(category =>
    selectedCategory ? category.title === selectedCategory : true
  );

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
                <Award className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                Best Practices
              </h1>
            </div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Proven guidelines and techniques to ensure your data analysis is accurate, reliable, and impactful.
            </p>
            
            {/* Search and Filters */}
            <div className="max-w-4xl mx-auto mb-12">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search best practices..."
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
                    {practiceCategories.map(category => (
                      <option key={category.title} value={category.title}>{category.title}</option>
                    ))}
                  </select>
                  <select
                    value={selectedDifficulty || ''}
                    onChange={(e) => setSelectedDifficulty(e.target.value || null)}
                    className="px-4 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Levels</option>
                    {difficulties.map(difficulty => (
                      <option key={difficulty} value={difficulty}>{difficulty}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Featured Practices */}
      <div className="max-w-7xl mx-auto px-6 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold text-white mb-8">Featured Guidelines</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {featuredPractices.map((practice, index) => (
              <motion.div
                key={practice.title}
                className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:bg-white/10 transition-all duration-300"
                whileHover={{ scale: 1.02, y: -4 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              >
                <div className="absolute top-4 right-4 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                  FEATURED
                </div>
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg">
                      <Lightbulb className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="px-2 py-1 bg-white/10 rounded-full text-xs text-gray-300">
                      {practice.difficulty}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{practice.title}</h3>
                  <p className="text-gray-300 mb-6">{practice.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-6">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {practice.timeToRead}
                    </div>
                    <div className="flex gap-2">
                      {practice.tags.map((tag, tagIndex) => (
                        <span key={tagIndex} className="px-2 py-1 bg-white/10 rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-white">Key Tips:</h4>
                    {practice.tips.map((tip, tipIndex) => (
                      <div key={tipIndex} className="flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-300">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Practice Categories */}
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
                  {category.practices.map((practice, practiceIndex) => (
                    <motion.div
                      key={practice.title}
                      className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all duration-300"
                      whileHover={{ scale: 1.02, y: -2 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.6 + categoryIndex * 0.1 + practiceIndex * 0.05 }}
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <span className="px-2 py-1 bg-white/10 rounded-full text-xs text-gray-300">
                            {practice.difficulty}
                          </span>
                          {practice.featured && (
                            <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                              FEATURED
                            </span>
                          )}
                        </div>
                        <h4 className="text-lg font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                          {practice.title}
                        </h4>
                        <p className="text-gray-300 text-sm mb-4">{practice.description}</p>
                        <div className="flex items-center gap-3 text-sm text-gray-400 mb-4">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {practice.timeToRead}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {practice.tags.map((tag, tagIndex) => (
                            <span key={tagIndex} className="px-2 py-1 bg-white/10 rounded-full text-xs text-gray-300">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="space-y-2">
                          <h5 className="text-sm font-semibold text-white">Quick Tips:</h5>
                          {practice.tips.slice(0, 2).map((tip, tipIndex) => (
                            <div key={tipIndex} className="flex items-start gap-2">
                              <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                              <span className="text-xs text-gray-300">{tip}</span>
                            </div>
                          ))}
                          {practice.tips.length > 2 && (
                            <span className="text-xs text-blue-400">+{practice.tips.length - 2} more tips</span>
                          )}
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
          <h2 className="text-3xl font-bold text-white mb-4">Contribute Your Expertise</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Share your best practices and help the community improve their data analysis skills. Your insights can make a difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300">
              Submit Best Practice
            </button>
            <button className="px-8 py-4 border border-white/20 text-white font-bold rounded-xl hover:bg-white/10 transition-all duration-300">
              Join Expert Panel
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

