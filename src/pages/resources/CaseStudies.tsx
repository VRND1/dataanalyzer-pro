import  { useState } from 'react';
import { 
  TrendingUp, Search,  Building, Users, 
  Globe, Zap, Clock, ChevronRight,
   CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

const caseStudyCategories = [
  {
    title: "Business Intelligence",
    description: "Real-world BI implementations and their impact",
    icon: Building,
    color: "from-blue-500 to-cyan-500",
    studies: [
      {
        title: "Retail Chain Sales Optimization",
        company: "Global Retail Corp",
        industry: "Retail",
        description: "How a major retail chain increased sales by 23% through data-driven inventory optimization",
        results: [
          "23% increase in overall sales",
          "15% reduction in inventory costs",
          "34% improvement in customer satisfaction"
        ],
        duration: "6 months",
        teamSize: "8 analysts",
        tags: ["Sales", "Inventory", "Optimization"],
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop",
        featured: true
      },
      {
        title: "Financial Services Risk Assessment",
        company: "SecureBank",
        industry: "Finance",
        description: "Implementing predictive risk models to reduce loan defaults by 40%",
        results: [
          "40% reduction in loan defaults",
          "28% increase in approval rates",
          "$2.3M annual savings"
        ],
        duration: "8 months",
        teamSize: "12 analysts",
        tags: ["Risk", "Finance", "Predictive"],
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop"
      },
      {
        title: "Manufacturing Process Optimization",
        company: "TechManufacture Inc",
        industry: "Manufacturing",
        description: "Using IoT data to optimize production processes and reduce waste",
        results: [
          "18% increase in production efficiency",
          "25% reduction in material waste",
          "12% decrease in energy costs"
        ],
        duration: "10 months",
        teamSize: "6 analysts",
        tags: ["IoT", "Manufacturing", "Efficiency"],
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop"
      }
    ]
  },
  {
    title: "Marketing Analytics",
    description: "Marketing campaign optimization and customer insights",
    icon: Users,
    color: "from-purple-500 to-pink-500",
    studies: [
      {
        title: "Multi-Channel Campaign Optimization",
        company: "Digital Marketing Pro",
        industry: "Marketing",
        description: "Optimizing marketing spend across channels to increase ROI by 156%",
        results: [
          "156% increase in marketing ROI",
          "45% improvement in conversion rates",
          "67% reduction in customer acquisition cost"
        ],
        duration: "4 months",
        teamSize: "5 analysts",
        tags: ["Marketing", "ROI", "Conversion"],
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop"
      },
      {
        title: "Customer Segmentation & Personalization",
        company: "E-commerce Giant",
        industry: "E-commerce",
        description: "Implementing personalized recommendations to boost sales",
        results: [
          "31% increase in average order value",
          "42% improvement in customer retention",
          "89% increase in repeat purchases"
        ],
        duration: "7 months",
        teamSize: "10 analysts",
        tags: ["Personalization", "E-commerce", "Retention"],
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop"
      },
      {
        title: "Social Media Analytics",
        company: "Social Media Agency",
        industry: "Agency",
        description: "Using social media data to improve brand engagement and reach",
        results: [
          "78% increase in social media engagement",
          "156% growth in organic reach",
          "34% improvement in brand sentiment"
        ],
        duration: "5 months",
        teamSize: "4 analysts",
        tags: ["Social Media", "Engagement", "Brand"],
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop"
      }
    ]
  },
  {
    title: "Healthcare Analytics",
    description: "Healthcare data analysis and patient outcomes improvement",
    icon: Globe,
    color: "from-emerald-500 to-teal-500",
    studies: [
      {
        title: "Patient Outcome Prediction",
        company: "HealthCare Network",
        industry: "Healthcare",
        description: "Using machine learning to predict patient outcomes and improve care",
        results: [
          "27% improvement in patient outcomes",
          "19% reduction in readmission rates",
          "$1.8M annual cost savings"
        ],
        duration: "12 months",
        teamSize: "15 analysts",
        tags: ["Healthcare", "ML", "Outcomes"],
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop",
        featured: true
      },
      {
        title: "Hospital Resource Optimization",
        company: "City Medical Center",
        industry: "Healthcare",
        description: "Optimizing hospital resources to reduce wait times and improve efficiency",
        results: [
          "35% reduction in patient wait times",
          "22% improvement in resource utilization",
          "41% increase in patient satisfaction"
        ],
        duration: "9 months",
        teamSize: "8 analysts",
        tags: ["Healthcare", "Optimization", "Efficiency"],
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop"
      },
      {
        title: "Drug Efficacy Analysis",
        company: "Pharma Research Lab",
        industry: "Pharmaceutical",
        description: "Analyzing clinical trial data to improve drug development processes",
        results: [
          "23% faster drug development timeline",
          "18% improvement in trial success rates",
          "31% reduction in development costs"
        ],
        duration: "14 months",
        teamSize: "12 analysts",
        tags: ["Pharma", "Clinical Trials", "Development"],
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop"
      }
    ]
  },
  {
    title: "Technology & Innovation",
    description: "Cutting-edge technology implementations and innovations",
    icon: Zap,
    color: "from-orange-500 to-red-500",
    studies: [
      {
        title: "AI-Powered Customer Service",
        company: "Tech Startup",
        industry: "Technology",
        description: "Implementing AI chatbots to improve customer service efficiency",
        results: [
          "67% reduction in response times",
          "89% improvement in customer satisfaction",
          "45% decrease in support costs"
        ],
        duration: "6 months",
        teamSize: "6 analysts",
        tags: ["AI", "Customer Service", "Automation"],
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop"
      },
      {
        title: "Predictive Maintenance System",
        company: "Industrial Solutions",
        industry: "Industrial",
        description: "Using IoT and ML to predict equipment failures and reduce downtime",
        results: [
          "73% reduction in unplanned downtime",
          "28% increase in equipment lifespan",
          "$3.2M annual cost savings"
        ],
        duration: "8 months",
        teamSize: "9 analysts",
        tags: ["IoT", "Predictive", "Maintenance"],
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop"
      },
      {
        title: "Real-time Analytics Platform",
        company: "DataTech Solutions",
        industry: "Technology",
        description: "Building a real-time analytics platform for instant insights",
        results: [
          "95% faster data processing",
          "67% improvement in decision speed",
          "89% increase in user adoption"
        ],
        duration: "10 months",
        teamSize: "14 analysts",
        tags: ["Real-time", "Analytics", "Platform"],
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop"
      }
    ]
  }
];

const featuredStudies = [
  {
    title: "Enterprise-Wide Data Transformation",
    company: "Fortune 500 Corporation",
    industry: "Multi-industry",
    description: "A comprehensive data transformation initiative that revolutionized business operations across all departments",
    results: [
      "156% increase in operational efficiency",
      "$15.2M annual cost savings",
      "89% improvement in data-driven decision making"
    ],
    duration: "18 months",
    teamSize: "25 analysts",
    tags: ["Transformation", "Enterprise", "Efficiency"],
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=338&fit=crop",
    featured: true
  },
  {
    title: "Startup to Scale: Data-Driven Growth",
    company: "Tech Startup Success",
    industry: "Technology",
    description: "How a startup used data analytics to scale from 10 to 1000+ employees in 3 years",
    results: [
      "1000% growth in 3 years",
      "67% improvement in customer acquisition",
      "89% increase in revenue per customer"
    ],
    duration: "36 months",
    teamSize: "8 analysts",
    tags: ["Startup", "Growth", "Scaling"],
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=338&fit=crop",
    featured: true
  }
];

export function CaseStudies() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);

  const industries = ["Retail", "Finance", "Healthcare", "Technology", "Manufacturing", "Marketing", "E-commerce"];

  const filteredCategories = caseStudyCategories.filter(category =>
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
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                Case Studies
              </h1>
            </div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Real-world success stories showcasing how organizations leverage data analytics to drive transformation and achieve remarkable results.
            </p>
            
            {/* Search and Filters */}
            <div className="max-w-4xl mx-auto mb-12">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search case studies..."
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
                    {caseStudyCategories.map(category => (
                      <option key={category.title} value={category.title}>{category.title}</option>
                    ))}
                  </select>
                  <select
                    value={selectedIndustry || ''}
                    onChange={(e) => setSelectedIndustry(e.target.value || null)}
                    className="px-4 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Industries</option>
                    {industries.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Featured Case Studies */}
      <div className="max-w-7xl mx-auto px-6 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold text-white mb-8">Featured Success Stories</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {featuredStudies.map((study, index) => (
              <motion.div
                key={study.title}
                className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:bg-white/10 transition-all duration-300"
                whileHover={{ scale: 1.02, y: -4 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              >
                <div className="relative">
                  <img 
                    src={study.thumbnail} 
                    alt={study.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300" />
                  <div className="absolute top-4 right-4 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                    FEATURED
                  </div>
                  <div className="absolute bottom-4 left-4 px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded">
                    {study.industry}
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Building className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-400 font-medium">{study.company}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{study.title}</h3>
                  <p className="text-gray-300 mb-6">{study.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-6">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {study.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {study.teamSize}
                    </div>
                  </div>
                  <div className="space-y-3 mb-6">
                    <h4 className="text-sm font-semibold text-white">Key Results:</h4>
                    {study.results.map((result, resultIndex) => (
                      <div key={resultIndex} className="flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-300">{result}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {study.tags.map((tag, tagIndex) => (
                        <span key={tagIndex} className="px-2 py-1 bg-white/10 rounded-full text-xs text-gray-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300">
                      Read Full Case
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Case Study Categories */}
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
                  {category.studies.map((study, studyIndex) => (
                    <motion.div
                      key={study.title}
                      className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all duration-300"
                      whileHover={{ scale: 1.02, y: -2 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.6 + categoryIndex * 0.1 + studyIndex * 0.05 }}
                    >
                      <div className="relative">
                        <img 
                          src={study.thumbnail} 
                          alt={study.title}
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300" />
                        <div className="absolute top-2 right-2 px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded">
                          {study.industry}
                        </div>
                        {study.featured && (
                          <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                            FEATURED
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Building className="w-3 h-3 text-blue-400" />
                          <span className="text-blue-400 text-sm font-medium">{study.company}</span>
                        </div>
                        <h4 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                          {study.title}
                        </h4>
                        <p className="text-gray-300 text-sm mb-3">{study.description}</p>
                        <div className="flex items-center gap-3 text-sm text-gray-400 mb-3">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {study.duration}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {study.teamSize}
                          </div>
                        </div>
                        <div className="space-y-2 mb-3">
                          <h5 className="text-sm font-semibold text-white">Key Results:</h5>
                          {study.results.slice(0, 2).map((result, resultIndex) => (
                            <div key={resultIndex} className="flex items-start gap-2">
                              <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                              <span className="text-xs text-gray-300">{result}</span>
                            </div>
                          ))}
                          {study.results.length > 2 && (
                            <span className="text-xs text-blue-400">+{study.results.length - 2} more results</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1">
                            {study.tags.slice(0, 2).map((tag, tagIndex) => (
                              <span key={tagIndex} className="px-2 py-1 bg-white/10 rounded-full text-xs text-gray-300">
                                {tag}
                              </span>
                            ))}
                            {study.tags.length > 2 && (
                              <span className="px-2 py-1 bg-white/10 rounded-full text-xs text-gray-300">
                                +{study.tags.length - 2}
                              </span>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform duration-300" />
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
          <h2 className="text-3xl font-bold text-white mb-4">Share Your Success Story</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Have a compelling case study? Share your data analytics success story and inspire others in the community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300">
              Submit Case Study
            </button>
            <button className="px-8 py-4 border border-white/20 text-white font-bold rounded-xl hover:bg-white/10 transition-all duration-300">
              Request Consultation
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

