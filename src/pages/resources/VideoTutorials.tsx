import { useState } from 'react';
import { 
  Video, Play, Clock, Users, Star, BookOpen, BarChart3, 
  Brain, TrendingUp, Search, ChevronRight,
  Share2, Heart
} from 'lucide-react';
import { motion } from 'framer-motion';

const tutorialCategories = [
  {
    title: "Getting Started",
    description: "Essential tutorials for new users",
    icon: BookOpen,
    color: "from-blue-500 to-cyan-500",
    videos: [
      {
        title: "Welcome to DataAnalyzer Pro",
        duration: "5:23",
        views: "12.5K",
        rating: 4.8,
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop",
        instructor: "Sarah Johnson",
        level: "Beginner"
      },
      {
        title: "Your First Data Analysis",
        duration: "8:45",
        views: "8.2K",
        rating: 4.9,
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop",
        instructor: "Mike Chen",
        level: "Beginner"
      },
      {
        title: "Importing Your Data",
        duration: "6:12",
        views: "15.1K",
        rating: 4.7,
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop",
        instructor: "Emma Davis",
        level: "Beginner"
      }
    ]
  },
  {
    title: "Data Visualization",
    description: "Create stunning charts and dashboards",
    icon: BarChart3,
    color: "from-purple-500 to-pink-500",
    videos: [
      {
        title: "Creating Interactive Charts",
        duration: "12:34",
        views: "9.8K",
        rating: 4.9,
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop",
        instructor: "Alex Rodriguez",
        level: "Intermediate"
      },
      {
        title: "Advanced Dashboard Design",
        duration: "15:22",
        views: "6.4K",
        rating: 4.8,
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop",
        instructor: "Lisa Wang",
        level: "Advanced"
      },
      {
        title: "Custom Chart Types",
        duration: "10:18",
        views: "7.9K",
        rating: 4.6,
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop",
        instructor: "David Kim",
        level: "Intermediate"
      }
    ]
  },
  {
    title: "Advanced Analytics",
    description: "Master complex analysis techniques",
    icon: Brain,
    color: "from-emerald-500 to-teal-500",
    videos: [
      {
        title: "Machine Learning Models",
        duration: "18:45",
        views: "5.2K",
        rating: 4.9,
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop",
        instructor: "Dr. Maria Garcia",
        level: "Advanced"
      },
      {
        title: "Predictive Analytics",
        duration: "22:11",
        views: "4.1K",
        rating: 4.8,
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop",
        instructor: "Dr. James Wilson",
        level: "Expert"
      },
      {
        title: "Time Series Analysis",
        duration: "16:33",
        views: "6.8K",
        rating: 4.7,
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop",
        instructor: "Dr. Robert Lee",
        level: "Advanced"
      }
    ]
  },
  {
    title: "Business Intelligence",
    description: "Transform data into business insights",
    icon: TrendingUp,
    color: "from-orange-500 to-red-500",
    videos: [
      {
        title: "Sales Analytics Dashboard",
        duration: "14:27",
        views: "8.9K",
        rating: 4.8,
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop",
        instructor: "Jennifer Smith",
        level: "Intermediate"
      },
      {
        title: "Customer Behavior Analysis",
        duration: "19:15",
        views: "5.6K",
        rating: 4.9,
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop",
        instructor: "Tom Anderson",
        level: "Advanced"
      },
      {
        title: "Financial Reporting",
        duration: "11:42",
        views: "7.3K",
        rating: 4.7,
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop",
        instructor: "Rachel Green",
        level: "Intermediate"
      }
    ]
  }
];

const featuredVideos = [
  {
    title: "Complete Data Analysis Workflow",
    description: "Learn the complete process from data import to final insights",
    duration: "45:12",
    views: "25.3K",
    rating: 4.9,
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=338&fit=crop",
    instructor: "Dr. Sarah Johnson",
    level: "All Levels",
    featured: true
  },
  {
    title: "AI-Powered Insights Discovery",
    description: "Discover how AI can automatically find insights in your data",
    duration: "32:18",
    views: "18.7K",
    rating: 4.8,
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=338&fit=crop",
    instructor: "Dr. Michael Chen",
    level: "Advanced",
    featured: true
  }
];

export function VideoTutorials() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  const levels = ["Beginner", "Intermediate", "Advanced", "Expert"];

  const filteredCategories = tutorialCategories.filter(category =>
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
                <Video className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                Video Tutorials
              </h1>
            </div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Step-by-step video guides to master data analysis with DataAnalyzer Pro
            </p>
            
            {/* Search and Filters */}
            <div className="max-w-4xl mx-auto mb-12">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search tutorials..."
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
                    {tutorialCategories.map(category => (
                      <option key={category.title} value={category.title}>{category.title}</option>
                    ))}
                  </select>
                  <select
                    value={selectedLevel || ''}
                    onChange={(e) => setSelectedLevel(e.target.value || null)}
                    className="px-4 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Levels</option>
                    {levels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Featured Videos */}
      <div className="max-w-7xl mx-auto px-6 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold text-white mb-8">Featured Tutorials</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {featuredVideos.map((video, index) => (
              <motion.div
                key={video.title}
                className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:bg-white/10 transition-all duration-300"
                whileHover={{ scale: 1.02, y: -4 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              >
                <div className="relative">
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="p-4 bg-white/20 backdrop-blur-xl rounded-full group-hover:scale-110 transition-transform duration-300">
                      <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                    FEATURED
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2">{video.title}</h3>
                  <p className="text-gray-300 mb-4">{video.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {video.duration}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {video.views}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400" />
                        {video.rating}
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-white/10 rounded-full text-xs">
                      {video.level}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-400 font-medium">{video.instructor}</span>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <Heart className="w-4 h-4 text-gray-400" />
                      </button>
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <Share2 className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Tutorial Categories */}
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
                  {category.videos.map((video, videoIndex) => (
                    <motion.div
                      key={video.title}
                      className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all duration-300"
                      whileHover={{ scale: 1.02, y: -2 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.6 + categoryIndex * 0.1 + videoIndex * 0.05 }}
                    >
                      <div className="relative">
                        <img 
                          src={video.thumbnail} 
                          alt={video.title}
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="p-2 bg-white/20 backdrop-blur-xl rounded-full group-hover:scale-110 transition-transform duration-300">
                            <Play className="w-6 h-6 text-white ml-0.5" />
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                          {video.title}
                        </h4>
                        <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {video.duration}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {video.views}
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-400" />
                              {video.rating}
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-white/10 rounded-full text-xs">
                            {video.level}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-blue-400 text-sm font-medium">{video.instructor}</span>
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
          <h2 className="text-3xl font-bold text-white mb-4">Want to contribute?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Share your expertise by creating tutorials for the community. Help others learn and grow their data analysis skills.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300">
              Create Tutorial
            </button>
            <button className="px-8 py-4 border border-white/20 text-white font-bold rounded-xl hover:bg-white/10 transition-all duration-300">
              Join Community
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

